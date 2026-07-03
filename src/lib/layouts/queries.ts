import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  CardSize,
  LayoutCardEntry,
  LayoutMode,
  LayoutSummary,
} from "./types";

export type { CardSize, LayoutCardEntry, LayoutMode, LayoutSummary } from "./types";
export { LAYOUT_MODES } from "./types";

/** Mapa key -> id do catálogo de cards (dashboard_cards). */
export async function fetchCardIdByKey(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("dashboard_cards").select("id, key");
  const out: Record<string, string> = {};
  for (const c of data ?? []) out[c.key as string] = c.id as string;
  return out;
}

interface LayoutRow {
  id: string;
  company_id: string | null;
  name: string;
  mode: LayoutMode;
  is_default: boolean;
}
interface LayoutCardRow {
  layout_id: string;
  enabled: boolean;
  position: number;
  size: string;
  dashboard_cards: { key: string } | { key: string }[] | null;
}

function cardKey(row: LayoutCardRow): string | null {
  const dc = row.dashboard_cards;
  if (!dc) return null;
  return Array.isArray(dc) ? (dc[0]?.key ?? null) : dc.key;
}

/** Todos os layouts (RLS filtra por acesso à empresa), com seus cards. */
export async function fetchLayouts(): Promise<LayoutSummary[]> {
  const supabase = await createClient();

  const { data: layouts } = await supabase
    .from("dashboard_layouts")
    .select("id, company_id, name, mode, is_default")
    .order("created_at", { ascending: true });

  const rows = (layouts ?? []) as LayoutRow[];
  if (rows.length === 0) return [];

  const { data: cardRows } = await supabase
    .from("dashboard_layout_cards")
    .select("layout_id, enabled, position, size, dashboard_cards(key)")
    .in(
      "layout_id",
      rows.map((r) => r.id),
    )
    .order("position", { ascending: true });

  const cardsByLayout: Record<string, LayoutCardEntry[]> = {};
  for (const r of (cardRows ?? []) as LayoutCardRow[]) {
    const key = cardKey(r);
    if (!key) continue;
    (cardsByLayout[r.layout_id] ??= []).push({
      key,
      enabled: r.enabled,
      position: r.position,
      size: (r.size as CardSize) ?? "md",
    });
  }

  return rows.map((r) => ({
    id: r.id,
    companyId: r.company_id,
    name: r.name,
    mode: r.mode,
    isDefault: r.is_default,
    cards: cardsByLayout[r.id] ?? [],
  }));
}

/**
 * Resolve os cards ordenados de um modo para uma empresa, usando o layout padrão.
 * Retorna null quando não há layout padrão configurado (a UI usa o catálogo).
 */
export async function resolveLayoutCards(
  companyId: string,
  mode: LayoutMode,
): Promise<LayoutCardEntry[] | null> {
  const supabase = await createClient();

  const { data: layout } = await supabase
    .from("dashboard_layouts")
    .select("id")
    .eq("company_id", companyId)
    .eq("mode", mode)
    .eq("is_default", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!layout) return null;

  const { data: cardRows } = await supabase
    .from("dashboard_layout_cards")
    .select("layout_id, enabled, position, size, dashboard_cards(key)")
    .eq("layout_id", layout.id)
    .eq("enabled", true)
    .order("position", { ascending: true });

  const cards: LayoutCardEntry[] = [];
  for (const r of (cardRows ?? []) as LayoutCardRow[]) {
    const key = cardKey(r);
    if (!key) continue;
    cards.push({
      key,
      enabled: r.enabled,
      position: r.position,
      size: (r.size as CardSize) ?? "md",
    });
  }
  return cards;
}

/** Layouts padrão de um modo para várias empresas: { [companyId]: cards }. */
export async function resolveLayoutsByCompany(
  companyIds: string[],
  mode: LayoutMode,
): Promise<Record<string, LayoutCardEntry[]>> {
  const out: Record<string, LayoutCardEntry[]> = {};
  const resolved = await Promise.all(
    companyIds.map((id) => resolveLayoutCards(id, mode)),
  );
  companyIds.forEach((id, i) => {
    const cards = resolved[i];
    if (cards && cards.length > 0) out[id] = cards;
  });
  return out;
}
