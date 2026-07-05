"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/user";

const BUCKET = "snapshots";

export interface SaveSnapshotInput {
  companyId: string | null;
  title: string;
  /** data URL PNG (data:image/png;base64,...). */
  imageBase64: string;
  /** Métricas capturadas (para histórico/comparação). */
  data?: Record<string, unknown>;
}

export interface SaveSnapshotResult {
  ok: boolean;
  error?: string;
  id?: string;
  imageUrl?: string;
}

/** Garante que o bucket público de snapshots existe (idempotente). */
async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (!data) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/png"],
    });
  }
}

/**
 * Salva um snapshot: sobe o PNG no Storage (service role) e registra a linha
 * em metric_snapshots (RLS, com created_by do usuário).
 */
export async function saveSnapshot(
  input: SaveSnapshotInput,
): Promise<SaveSnapshotResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Faça login para salvar snapshots." };

  const prefix = "data:image/png;base64,";
  if (!input.imageBase64.startsWith(prefix)) {
    return { ok: false, error: "Imagem inválida." };
  }
  const buffer = Buffer.from(input.imageBase64.slice(prefix.length), "base64");

  const admin = createAdminClient();
  try {
    await ensureBucket(admin);
  } catch (e) {
    return { ok: false, error: `Storage indisponível: ${(e as Error).message}` };
  }

  const path = `${input.companyId ?? "overview"}/${Date.now()}.png`;
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: "image/png", upsert: false });
  if (upErr) return { ok: false, error: `Falha no upload: ${upErr.message}` };

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("metric_snapshots")
    .insert({
      company_id: input.companyId,
      title: input.title,
      image_url: publicUrl,
      data: input.data ?? {},
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !row) {
    // Remove o arquivo órfão se o insert falhou.
    await admin.storage.from(BUCKET).remove([path]);
    return { ok: false, error: error?.message ?? "Falha ao registrar snapshot." };
  }

  revalidatePath("/snapshots");
  return { ok: true, id: row.id as string, imageUrl: publicUrl };
}

/** Remove um snapshot (linha + arquivo). Autor ou admin/coordenador. */
export async function deleteSnapshot(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Não autorizado." };

  const supabase = await createClient();
  const { data: snap } = await supabase
    .from("metric_snapshots")
    .select("image_url, created_by")
    .eq("id", id)
    .single();

  const canManage =
    user.role === "admin" ||
    user.role === "coordinator" ||
    snap?.created_by === user.id;
  if (!canManage) return { ok: false, error: "Sem permissão para remover." };

  const { error } = await supabase.from("metric_snapshots").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Remove o arquivo do Storage (service role), best-effort.
  const url = snap?.image_url as string | undefined;
  if (url) {
    const idx = url.indexOf(`/${BUCKET}/`);
    if (idx !== -1) {
      const objectPath = url.slice(idx + BUCKET.length + 2);
      await createAdminClient().storage.from(BUCKET).remove([objectPath]);
    }
  }

  revalidatePath("/snapshots");
  return { ok: true };
}
