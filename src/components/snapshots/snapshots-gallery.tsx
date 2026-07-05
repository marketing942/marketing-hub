"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  FileImage,
  FileText,
  Trash2,
  GitCompareArrows,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { Company } from "@/lib/types";
import type { SnapshotItem } from "@/lib/snapshots/queries";
import { deleteSnapshot } from "@/lib/snapshots/actions";
import {
  downloadDataUrl,
  downloadPdf,
  imageUrlToDataUrl,
  snapshotFilename,
} from "@/lib/snapshots/capture";
import { EmptyState } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SnapshotsGallery({
  companies,
  snapshots,
  currentUserId,
  canManageAll,
}: {
  companies: Company[];
  snapshots: SnapshotItem[];
  currentUserId: string | null;
  canManageAll: boolean;
}) {
  const [companyFilter, setCompanyFilter] = useState<string | "all">("all");
  const [compare, setCompare] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const companyById = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c])),
    [companies],
  );

  const visible = snapshots.filter(
    (s) => companyFilter === "all" || s.companyId === companyFilter,
  );

  const compareItems = compare
    .map((id) => snapshots.find((s) => s.id === id))
    .filter((s): s is SnapshotItem => !!s);

  function toggleCompare(id: string) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  async function download(s: SnapshotItem, kind: "png" | "pdf") {
    if (!s.imageUrl) return;
    setBusyId(s.id);
    setMsg(null);
    try {
      const dataUrl = await imageUrlToDataUrl(s.imageUrl);
      const name = snapshotFilename(s.title ?? "snapshot", kind);
      if (kind === "png") downloadDataUrl(dataUrl, name);
      else await downloadPdf(dataUrl, name);
    } catch {
      setMsg("Não foi possível baixar (verifique CORS do Storage).");
    } finally {
      setBusyId(null);
    }
  }

  function remove(id: string) {
    setBusyId(id);
    setMsg(null);
    startTransition(async () => {
      const res = await deleteSnapshot(id);
      setBusyId(null);
      if (!res.ok) setMsg(res.error ?? "Erro ao remover.");
      else setCompare((prev) => prev.filter((x) => x !== id));
    });
  }

  if (snapshots.length === 0) {
    return (
      <EmptyState
        title="Nenhum snapshot ainda"
        description="Capture o Dashboard ou o Modo TV com o botão “Salvar snapshot”. As capturas aparecem aqui para download e comparação."
      />
    );
  }

  return (
    <div>
      {/* Filtro por empresa */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={companyFilter === "all"} onClick={() => setCompanyFilter("all")}>
          Todas
        </Chip>
        {companies.map((c) => (
          <Chip
            key={c.id}
            active={companyFilter === c.id}
            onClick={() => setCompanyFilter(c.id)}
          >
            {c.name}
          </Chip>
        ))}
      </div>

      {msg && (
        <p className="mb-4 rounded-md border border-border bg-card px-3 py-2 text-xs text-text-muted">
          {msg}
        </p>
      )}

      {/* Comparação lado a lado */}
      {compareItems.length === 2 && (
        <div className="mb-6 rounded-xl border border-green/30 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
              <GitCompareArrows className="h-4 w-4 text-green-neon" /> Comparação
            </h3>
            <button
              onClick={() => setCompare([])}
              className="text-xs text-text-muted hover:text-text"
            >
              Limpar
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {compareItems.map((s) => (
              <figure key={s.id}>
                <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-bg">
                  {s.imageUrl && (
                    <Image src={s.imageUrl} alt={s.title ?? "snapshot"} fill className="object-contain" unoptimized />
                  )}
                </div>
                <figcaption className="mt-1.5 text-xs text-text-muted">
                  {s.title} · {new Date(s.createdAt).toLocaleString("pt-BR")}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* Grade de snapshots */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((s) => {
          const company = s.companyId ? companyById[s.companyId] : null;
          const isBusy = busyId === s.id && (pending || busyId === s.id);
          const canDelete = canManageAll || s.createdById === currentUserId;
          const selected = compare.includes(s.id);
          return (
            <div
              key={s.id}
              className={cn(
                "overflow-hidden rounded-xl border bg-card",
                selected ? "border-green/50" : "border-border",
              )}
            >
              <div className="relative aspect-video bg-bg">
                {s.imageUrl ? (
                  <Image
                    src={s.imageUrl}
                    alt={s.title ?? "snapshot"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-text-muted">
                    sem imagem
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-text">
                    {s.title ?? "Snapshot"}
                  </p>
                  {company && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `${company.brandColor}22`,
                        color: company.brandColor,
                      }}
                    >
                      {company.initials}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-text-muted" suppressHydrationWarning>
                  {new Date(s.createdAt).toLocaleString("pt-BR")}
                  {s.createdByName ? ` · ${s.createdByName}` : ""}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Act title="Baixar PNG" onClick={() => download(s, "png")} disabled={isBusy}>
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileImage className="h-3.5 w-3.5" />}
                  </Act>
                  <Act title="Baixar PDF" onClick={() => download(s, "pdf")} disabled={isBusy}>
                    <FileText className="h-3.5 w-3.5" />
                  </Act>
                  <Act
                    title={selected ? "Remover da comparação" : "Comparar"}
                    onClick={() => toggleCompare(s.id)}
                    active={selected}
                  >
                    <GitCompareArrows className="h-3.5 w-3.5" />
                  </Act>
                  {s.imageUrl && (
                    <a
                      href={s.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir imagem"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:border-green/40 hover:text-green-neon"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {canDelete && (
                    <Act title="Excluir" onClick={() => remove(s.id)} disabled={isBusy}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Act>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
        active
          ? "border-green/50 bg-green/10 text-green-neon"
          : "border-border bg-card text-text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

function Act({
  title,
  onClick,
  disabled,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border transition-colors disabled:opacity-40",
        active
          ? "border-green/50 bg-green/10 text-green-neon"
          : "border-border text-text-muted hover:border-green/40 hover:text-green-neon",
      )}
    >
      {children}
    </button>
  );
}
