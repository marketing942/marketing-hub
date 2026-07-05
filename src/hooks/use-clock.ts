"use client";

import { useEffect, useState } from "react";

/** Relógio ao vivo, atualizado a cada segundo (client-only para evitar hydration mismatch). */
export function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // Leitura inicial via timer (evita setState síncrono no corpo do efeito)
    // e mantém client-only para não quebrar a hidratação.
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}
