"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/user";
import { fetchCardIdByKey } from "./queries";
import type { CardSize, LayoutMode } from "./types";

export interface LayoutCardInput {
  key: string;
  enabled: boolean;
  size: CardSize;
}

export interface SaveLayoutInput {
  id?: string | null;
  companyId: string;
  name: string;
  mode: LayoutMode;
  isDefault: boolean;
  /** Ordem final dos cards (a posição é o índice no array). */
  cards: LayoutCardInput[];
}

export interface SaveLayoutResult {
  ok: boolean;
  error?: string;
  layoutId?: string;
}

function canEdit(role: string | undefined): boolean {
  return role === "admin" || role === "coordinator";
}

/** Cria ou atualiza um layout e substitui seus cards. Admin/Coordenador. */
export async function saveLayout(
  input: SaveLayoutInput,
): Promise<SaveLayoutResult> {
  const user = await getCurrentUser();
  if (!user || !canEdit(user.role)) {
    return { ok: false, error: "Sem permissão para editar layouts." };
  }
  if (!input.name.trim()) {
    return { ok: false, error: "Dê um nome ao layout." };
  }

  const supabase = await createClient();
  const cardIdByKey = await fetchCardIdByKey();

  // Upsert do layout (mantém created_by na criação).
  let layoutId = input.id ?? null;
  if (layoutId) {
    const { error } = await supabase
      .from("dashboard_layouts")
      .update({
        name: input.name.trim(),
        mode: input.mode,
        is_default: input.isDefault,
      })
      .eq("id", layoutId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await supabase
      .from("dashboard_layouts")
      .insert({
        company_id: input.companyId,
        name: input.name.trim(),
        mode: input.mode,
        is_default: input.isDefault,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, error: error?.message ?? "Falha ao criar layout." };
    }
    layoutId = data.id as string;
  }

  // Só pode haver um layout padrão por empresa+modo.
  if (input.isDefault) {
    await supabase
      .from("dashboard_layouts")
      .update({ is_default: false })
      .eq("company_id", input.companyId)
      .eq("mode", input.mode)
      .neq("id", layoutId);
  }

  // Substitui os cards do layout (delete + insert).
  await supabase.from("dashboard_layout_cards").delete().eq("layout_id", layoutId);

  const cardRows = input.cards
    .map((c, i) => {
      const cardId = cardIdByKey[c.key];
      if (!cardId) return null;
      return {
        layout_id: layoutId,
        card_id: cardId,
        enabled: c.enabled,
        position: i,
        size: c.size,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (cardRows.length > 0) {
    const { error } = await supabase
      .from("dashboard_layout_cards")
      .insert(cardRows);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/builder");
  revalidatePath("/dashboard");
  revalidatePath("/tv");
  return { ok: true, layoutId };
}

export async function deleteLayout(
  layoutId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canEdit(user.role)) {
    return { ok: false, error: "Sem permissão para remover layouts." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("dashboard_layouts")
    .delete()
    .eq("id", layoutId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/builder");
  revalidatePath("/dashboard");
  revalidatePath("/tv");
  return { ok: true };
}

/** Marca um layout como padrão do seu modo/empresa (desmarca os demais). */
export async function setDefaultLayout(
  layoutId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !canEdit(user.role)) {
    return { ok: false, error: "Sem permissão." };
  }
  const supabase = await createClient();

  const { data: layout, error: readErr } = await supabase
    .from("dashboard_layouts")
    .select("company_id, mode")
    .eq("id", layoutId)
    .single();
  if (readErr || !layout) {
    return { ok: false, error: readErr?.message ?? "Layout não encontrado." };
  }

  await supabase
    .from("dashboard_layouts")
    .update({ is_default: false })
    .eq("company_id", layout.company_id)
    .eq("mode", layout.mode)
    .neq("id", layoutId);

  const { error } = await supabase
    .from("dashboard_layouts")
    .update({ is_default: true })
    .eq("id", layoutId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/builder");
  revalidatePath("/dashboard");
  revalidatePath("/tv");
  return { ok: true };
}
