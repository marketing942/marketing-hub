import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface SnapshotItem {
  id: string;
  companyId: string | null;
  title: string | null;
  imageUrl: string | null;
  createdAt: string;
  createdById: string | null;
  createdByName: string | null;
}

interface Row {
  id: string;
  company_id: string | null;
  title: string | null;
  image_url: string | null;
  created_at: string;
  created_by: string | null;
  creator: { full_name: string | null; email: string | null } | null;
}

/** Snapshots salvos (RLS por empresa), mais recentes primeiro. */
export async function fetchSnapshots(limit = 60): Promise<SnapshotItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("metric_snapshots")
    .select(
      "id, company_id, title, image_url, created_at, created_by, creator:profiles!created_by(full_name,email)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as Row[] | null ?? []).map((r) => ({
    id: r.id,
    companyId: r.company_id,
    title: r.title,
    imageUrl: r.image_url,
    createdAt: r.created_at,
    createdById: r.created_by,
    createdByName: r.creator?.full_name ?? r.creator?.email ?? null,
  }));
}
