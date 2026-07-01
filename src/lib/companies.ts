import type { Company } from "./types";

/**
 * Empresas padrão do hub — fonte única de verdade no client enquanto o
 * Supabase não está conectado (Etapa 2 substitui por consulta ao banco).
 *
 * ⚠️ Apenas estas 3 empresas. "Grupo Mota" NÃO faz parte do dashboard.
 */
export const COMPANIES: Company[] = [
  {
    id: "cppem-concursos",
    slug: "cppem-concursos",
    name: "CPPEM Concursos",
    shortName: "Concursos",
    initials: "CC",
    status: "active",
    brandColor: "#16a34a",
    logoUrl: null,
  },
  {
    id: "unicive",
    slug: "unicive",
    name: "Unicive",
    shortName: "Unicive",
    initials: "UN",
    status: "active",
    brandColor: "#22c55e",
    logoUrl: null,
  },
  {
    id: "colegio-cppem",
    slug: "colegio-cppem",
    name: "Colégio CPPEM",
    shortName: "Colégio",
    initials: "CO",
    status: "active",
    brandColor: "#4ade80",
    logoUrl: null,
  },
];

/** Ordem de rotação na TV. */
export const ROTATION_ORDER = COMPANIES.map((c) => c.slug);

export function getCompanyBySlug(slug: string): Company | undefined {
  return COMPANIES.find((c) => c.slug === slug);
}

/** Intervalo de rotação da TV (ms). */
export const ROTATION_INTERVAL_MS = 20_000;
