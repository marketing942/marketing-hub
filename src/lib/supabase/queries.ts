import { createClient } from "./server";
import type { Company, CompanySlug } from "@/lib/types";

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  status: "active" | "inactive";
  brand_color: string;
  logo_url: string | null;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Busca as empresas do Supabase (respeitando RLS).
 * Retorna null se o schema ainda não foi aplicado ou houver erro — a UI
 * decide entre mostrar dado real ou empty state (nunca dado fake como real).
 */
export async function fetchCompanies(): Promise<Company[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("companies")
      .select("id,name,slug,status,brand_color,logo_url")
      .order("sort_order", { ascending: true });

    if (error || !data) return null;

    return (data as CompanyRow[]).map((c) => ({
      id: c.id,
      slug: c.slug as CompanySlug,
      name: c.name,
      shortName: c.name.replace(/^(CPPEM|Colégio)\s+/i, "") || c.name,
      initials: initialsOf(c.name),
      status: c.status,
      brandColor: c.brand_color,
      logoUrl: c.logo_url,
    }));
  } catch {
    return null;
  }
}
