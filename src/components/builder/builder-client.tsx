"use client";

import { useMemo, useState, useTransition } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
  Check,
  GripVertical,
  Loader2,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import type { Company } from "@/lib/types";
import { CARD_CATALOG, CARD_BY_KEY } from "@/lib/metrics/catalog";
import {
  LAYOUT_MODES,
  type CardSize,
  type LayoutMode,
  type LayoutSummary,
} from "@/lib/layouts/types";
import {
  deleteLayout,
  saveLayout,
  setDefaultLayout,
  type LayoutCardInput,
} from "@/lib/layouts/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DraftCard {
  key: string;
  enabled: boolean;
  size: CardSize;
}

const SIZE_LABEL: Record<CardSize, string> = { sm: "P", md: "M", lg: "G" };
const CATEGORY_LABEL: Record<string, string> = {
  paid: "Pago",
  organic: "Orgânico",
  leads: "Leads",
  custom: "Custom",
};

/** Cards habilitados por padrão ao criar um layout novo, conforme o modo. */
function defaultEnabled(key: string, mode: LayoutMode): boolean {
  const def = CARD_BY_KEY[key];
  if (!def) return false;
  switch (mode) {
    case "tv":
      return !!def.tv;
    case "paid":
      return def.category === "paid" || def.category === "leads";
    case "organic":
      return def.category === "organic" || def.category === "leads";
    default:
      return !!def.tv;
  }
}

/** Monta o rascunho: cards do layout (na ordem) + demais cards do catálogo desativados. */
function buildDraft(layout: LayoutSummary | null, mode: LayoutMode): DraftCard[] {
  if (layout) {
    const seen = new Set<string>();
    const fromLayout: DraftCard[] = layout.cards
      .filter((c) => CARD_BY_KEY[c.key])
      .map((c) => {
        seen.add(c.key);
        return { key: c.key, enabled: c.enabled, size: c.size };
      });
    const rest: DraftCard[] = CARD_CATALOG.filter((c) => !seen.has(c.key)).map(
      (c) => ({ key: c.key, enabled: false, size: "md" as CardSize }),
    );
    return [...fromLayout, ...rest];
  }
  return CARD_CATALOG.map((c) => ({
    key: c.key,
    enabled: defaultEnabled(c.key, mode),
    size: "md" as CardSize,
  }));
}

export function BuilderClient({
  companies,
  layouts,
}: {
  companies: Company[];
  layouts: LayoutSummary[];
}) {
  const [activeCompany, setActiveCompany] = useState(companies[0]?.id ?? "");
  const [mode, setMode] = useState<LayoutMode>("tv");
  const [layoutId, setLayoutId] = useState<string | null>(null); // null = novo
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [draft, setDraft] = useState<DraftCard[]>(() => buildDraft(null, "tv"));

  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Layouts do escopo atual (empresa + modo).
  const scoped = useMemo(
    () =>
      layouts.filter(
        (l) => l.companyId === activeCompany && l.mode === mode,
      ),
    [layouts, activeCompany, mode],
  );

  function loadLayout(l: LayoutSummary | null) {
    setLayoutId(l?.id ?? null);
    setName(l?.name ?? "");
    setIsDefault(l?.isDefault ?? scoped.length === 0);
    setDraft(buildDraft(l, mode));
    setSaved(false);
    setError(null);
  }

  function switchCompany(id: string) {
    setActiveCompany(id);
    const first = layouts.find((l) => l.companyId === id && l.mode === mode);
    // carrega o primeiro layout do novo escopo, ou um rascunho novo
    setLayoutId(first?.id ?? null);
    setName(first?.name ?? "");
    setIsDefault(first?.isDefault ?? true);
    setDraft(buildDraft(first ?? null, mode));
    setSaved(false);
    setError(null);
  }

  function switchMode(m: LayoutMode) {
    setMode(m);
    const first = layouts.find(
      (l) => l.companyId === activeCompany && l.mode === m,
    );
    setLayoutId(first?.id ?? null);
    setName(first?.name ?? "");
    setIsDefault(first?.isDefault ?? true);
    setDraft(buildDraft(first ?? null, m));
    setSaved(false);
    setError(null);
  }

  function toggle(key: string) {
    setDraft((d) =>
      d.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c)),
    );
    setSaved(false);
  }

  function setSize(key: string, size: CardSize) {
    setDraft((d) => d.map((c) => (c.key === key ? { ...c, size } : c)));
    setSaved(false);
  }

  function save() {
    setError(null);
    const cards: LayoutCardInput[] = draft.map((c) => ({
      key: c.key,
      enabled: c.enabled,
      size: c.size,
    }));
    startTransition(async () => {
      const res = await saveLayout({
        id: layoutId,
        companyId: activeCompany,
        name,
        mode,
        isDefault,
        cards,
      });
      if (res.ok) {
        setSaved(true);
        if (res.layoutId) setLayoutId(res.layoutId);
      } else {
        setError(res.error ?? "Erro ao salvar.");
      }
    });
  }

  function remove() {
    if (!layoutId) return;
    startTransition(async () => {
      const res = await deleteLayout(layoutId);
      if (res.ok) loadLayout(null);
      else setError(res.error ?? "Erro ao remover.");
    });
  }

  function makeDefault() {
    if (!layoutId) return;
    startTransition(async () => {
      const res = await setDefaultLayout(layoutId);
      if (res.ok) setIsDefault(true);
      else setError(res.error ?? "Erro.");
    });
  }

  const enabledCount = draft.filter((c) => c.enabled).length;

  return (
    <div>
      {/* Empresa */}
      <div className="mb-4 flex flex-wrap gap-2">
        {companies.map((c) => (
          <button
            key={c.id}
            onClick={() => switchCompany(c.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              activeCompany === c.id
                ? "border-green/50 bg-green/10 text-green-neon"
                : "border-border bg-card text-text-muted hover:text-text",
            )}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold"
              style={{ backgroundColor: `${c.brandColor}22`, color: c.brandColor }}
            >
              {c.initials}
            </span>
            {c.name}
          </button>
        ))}
      </div>

      {/* Modo */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {LAYOUT_MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => switchMode(m.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              mode === m.value
                ? "border-green/50 bg-green/10 text-green-neon"
                : "border-border bg-card text-text-muted hover:text-text",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Layouts existentes do escopo + novo */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {scoped.map((l) => (
          <button
            key={l.id}
            onClick={() => loadLayout(l)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              layoutId === l.id
                ? "border-green/50 bg-green/10 text-green-neon"
                : "border-border bg-card text-text-muted hover:text-text",
            )}
          >
            {l.isDefault && <Star className="h-3.5 w-3.5 fill-green-neon text-green-neon" />}
            {l.name}
          </button>
        ))}
        <button
          onClick={() => loadLayout(null)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-sm transition-colors",
            layoutId === null
              ? "border-green/50 text-green-neon"
              : "border-border text-text-muted hover:text-text",
          )}
        >
          <Plus className="h-3.5 w-3.5" /> Novo layout
        </button>
      </div>

      {/* Nome + padrão */}
      <div className="mb-5 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          Nome do layout
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="Ex.: TV Marketing"
            className="w-64 rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-green/50 focus:outline-none"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 py-2 text-sm text-text">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => {
              setIsDefault(e.target.checked);
              setSaved(false);
            }}
            className="h-4 w-4 accent-green"
          />
          Layout padrão deste modo
        </label>
        <span className="py-2 text-xs text-text-muted">
          {enabledCount} card{enabledCount === 1 ? "" : "s"} ativo
          {enabledCount === 1 ? "" : "s"}
        </span>
      </div>

      {/* Lista de cards (drag-and-drop) */}
      <p className="mb-2 text-xs text-text-muted">
        Arraste para reordenar. Ative/desative e escolha o tamanho (P/M/G — G ocupa 2 colunas).
      </p>
      <Reorder.Group
        axis="y"
        values={draft}
        onReorder={(v) => {
          setDraft(v);
          setSaved(false);
        }}
        className="space-y-2"
      >
        {draft.map((card) => (
          <CardRow
            key={card.key}
            card={card}
            onToggle={() => toggle(card.key)}
            onSize={(s) => setSize(card.key, s)}
          />
        ))}
      </Reorder.Group>

      {/* Ações */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Salvando..." : layoutId ? "Salvar layout" : "Criar layout"}
        </Button>
        {layoutId && !isDefault && (
          <Button variant="outline" size="sm" onClick={makeDefault} disabled={pending}>
            <Star className="h-4 w-4" /> Definir como padrão
          </Button>
        )}
        {layoutId && (
          <Button variant="outline" size="sm" onClick={remove} disabled={pending}>
            <Trash2 className="h-4 w-4" /> Excluir
          </Button>
        )}
        {error && <span className="text-xs text-critical">{error}</span>}
        {saved && !pending && (
          <span className="inline-flex items-center gap-1 text-xs text-good">
            <Check className="h-3.5 w-3.5" /> Salvo
          </span>
        )}
      </div>
    </div>
  );
}

function CardRow({
  card,
  onToggle,
  onSize,
}: {
  card: DraftCard;
  onToggle: () => void;
  onSize: (s: CardSize) => void;
}) {
  const controls = useDragControls();
  const def = CARD_BY_KEY[card.key];

  return (
    <Reorder.Item
      value={card}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5",
        card.enabled ? "border-border" : "border-border-soft opacity-60",
      )}
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none text-text-muted hover:text-text active:cursor-grabbing"
        title="Arraste para reordenar"
        aria-label="Reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <input
        type="checkbox"
        checked={card.enabled}
        onChange={onToggle}
        className="h-4 w-4 accent-green"
      />

      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-text">{def?.label ?? card.key}</span>
      </div>

      <span className="rounded-md bg-card-alt px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
        {CATEGORY_LABEL[def?.category ?? "custom"]}
      </span>

      <div className="flex items-center gap-1">
        {(["sm", "md", "lg"] as CardSize[]).map((s) => (
          <button
            key={s}
            onClick={() => onSize(s)}
            disabled={!card.enabled}
            className={cn(
              "h-7 w-7 rounded-md border text-xs font-semibold transition-colors disabled:opacity-40",
              card.size === s
                ? "border-green/50 bg-green/10 text-green-neon"
                : "border-border text-text-muted hover:text-text",
            )}
            title={`Tamanho ${SIZE_LABEL[s]}`}
          >
            {SIZE_LABEL[s]}
          </button>
        ))}
      </div>
    </Reorder.Item>
  );
}
