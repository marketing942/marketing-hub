"use client";

import { useState, type RefObject } from "react";
import { Camera, FileImage, FileText, Check, Loader2 } from "lucide-react";
import {
  captureElement,
  downloadDataUrl,
  downloadPdf,
  snapshotFilename,
} from "@/lib/snapshots/capture";
import { saveSnapshot } from "@/lib/snapshots/actions";
import { Button } from "@/components/ui/button";

type Busy = null | "png" | "pdf" | "save";

export function SnapshotControls({
  targetRef,
  companyId,
  title,
  data,
  canSave = true,
}: {
  targetRef: RefObject<HTMLElement | null>;
  companyId: string | null;
  title: string;
  data?: Record<string, unknown>;
  canSave?: boolean;
}) {
  const [busy, setBusy] = useState<Busy>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function withTarget(fn: (el: HTMLElement) => Promise<void>, kind: Busy) {
    const el = targetRef.current;
    if (!el) {
      setMsg("Nada para capturar.");
      return;
    }
    setBusy(kind);
    setMsg(null);
    setOk(false);
    try {
      await fn(el);
    } catch (e) {
      setMsg((e as Error).message || "Falha na captura.");
    } finally {
      setBusy(null);
    }
  }

  const doPng = () =>
    withTarget(async (el) => {
      const url = await captureElement(el);
      downloadDataUrl(url, snapshotFilename(title, "png"));
    }, "png");

  const doPdf = () =>
    withTarget(async (el) => {
      const url = await captureElement(el);
      await downloadPdf(url, snapshotFilename(title, "pdf"));
    }, "pdf");

  const doSave = () =>
    withTarget(async (el) => {
      const url = await captureElement(el);
      const res = await saveSnapshot({ companyId, title, imageBase64: url, data });
      if (res.ok) {
        setOk(true);
        setMsg("Snapshot salvo em Snapshots.");
      } else {
        setMsg(res.error ?? "Falha ao salvar.");
      }
    }, "save");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={doPng} disabled={busy !== null}>
        {busy === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
        PNG
      </Button>
      <Button variant="outline" size="sm" onClick={doPdf} disabled={busy !== null}>
        {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        PDF
      </Button>
      {canSave && (
        <Button size="sm" onClick={doSave} disabled={busy !== null}>
          {busy === "save" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : ok ? (
            <Check className="h-4 w-4" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          Salvar snapshot
        </Button>
      )}
      {msg && <span className="text-xs text-text-muted">{msg}</span>}
    </div>
  );
}
