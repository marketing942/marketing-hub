"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Mostra "há X min" a partir de um ISO, computando só no client (sem mismatch de hidratação). */
export function UpdatedAgo({ updatedAt }: { updatedAt: string | null | undefined }) {
  const [label, setLabel] = useState<string>("—");

  useEffect(() => {
    if (!updatedAt) {
      setLabel("—");
      return;
    }
    const update = () =>
      setLabel(
        "há " +
          formatDistanceToNowStrict(new Date(updatedAt), { locale: ptBR }),
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [updatedAt]);

  return <span suppressHydrationWarning>{label}</span>;
}
