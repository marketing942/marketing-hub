import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface SyncJobView {
  id: string;
  provider: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  recordsProcessed: number;
  errorMessage: string | null;
  createdAt: string;
}

export async function fetchSyncJobs(limit = 30): Promise<SyncJobView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sync_jobs")
    .select("id, provider, status, started_at, finished_at, records_processed, error_message, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((j) => ({
    id: j.id,
    provider: j.provider,
    status: j.status,
    startedAt: j.started_at,
    finishedAt: j.finished_at,
    recordsProcessed: j.records_processed ?? 0,
    errorMessage: j.error_message,
    createdAt: j.created_at,
  }));
}
