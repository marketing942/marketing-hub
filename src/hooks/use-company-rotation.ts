"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ROTATION_INTERVAL_MS } from "@/lib/companies";

/**
 * Controla a rotação automática entre empresas na TV.
 * Retorna índice atual, progresso do timer (0–1) e controles.
 */
export function useCompanyRotation(count: number, intervalMs = ROTATION_INTERVAL_MS) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number>(Date.now());

  const reset = useCallback(() => {
    startRef.current = Date.now();
    setProgress(0);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % count);
    reset();
  }, [count, reset]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
    reset();
  }, [count, reset]);

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % count) + count) % count);
      reset();
    },
    [count, reset],
  );

  const togglePause = useCallback(() => {
    setPaused((p) => {
      if (p) reset(); // ao retomar, reinicia o ciclo atual
      return !p;
    });
  }, [reset]);

  useEffect(() => {
    if (paused) return;
    const tick = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / intervalMs, 1);
      setProgress(p);
      if (p >= 1) {
        setIndex((i) => (i + 1) % count);
        startRef.current = Date.now();
        setProgress(0);
      }
    }, 100);
    return () => clearInterval(tick);
  }, [paused, intervalMs, count]);

  return { index, paused, progress, next, prev, goTo, togglePause };
}
