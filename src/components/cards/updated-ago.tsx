"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Mostra "há X min" a partir de um ISO, computando só no client (sem mismatch de hidratação). */
export function UpdatedAgo({ updatedAt }: { updatedAt: string | null | undefined }) {
  const [label, setLabel] = useState<string>("—");

  useEffect(() => {
    if (!updatedAt) {
      // reset diferido (evita setState síncrono no corpo do efeito)
      const t = setTimeout(() => setLabel("—"), 0);
      return () => clearTimeout(t);
    }
    const update = () =>
      setLabel(
        "há " +
          formatDistanceToNowStrict(new Date(updatedAt), { locale: ptBR }),
      );
    const first = setTimeout(update, 0);
    const id = setInterval(update, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [updatedAt]);

  return <span suppressHydrationWarning>{label}</span>;
}
