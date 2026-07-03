/** Tipos e constantes de layout compartilhados entre server e client. */

/** Modos de layout (enum layout_mode no banco). */
export type LayoutMode = "tv" | "executive" | "paid" | "organic" | "coordination";

export const LAYOUT_MODES: { value: LayoutMode; label: string }[] = [
  { value: "tv", label: "TV" },
  { value: "executive", label: "Executivo" },
  { value: "paid", label: "Tráfego" },
  { value: "organic", label: "Orgânico" },
  { value: "coordination", label: "Coordenação" },
];

/** Tamanho do card no layout. lg ocupa 2 colunas. */
export type CardSize = "sm" | "md" | "lg";

export interface LayoutCardEntry {
  key: string;
  enabled: boolean;
  position: number;
  size: CardSize;
}

export interface LayoutSummary {
  id: string;
  companyId: string | null;
  name: string;
  mode: LayoutMode;
  isDefault: boolean;
  cards: LayoutCardEntry[];
}
