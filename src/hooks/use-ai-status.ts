"use client";

import { useEffect, useState } from "react";

export type AiStatus =
  | { state: "checking" }
  | { state: "unknown" }
  | { state: "missing" }
  | { state: "configured"; model: string; fallbackModel: string | null; deepModel: string };

/** Reads /api/status once: is an AI provider configured, and which models will run. */
export function useAiStatus(): AiStatus {
  const [status, setStatus] = useState<AiStatus>({ state: "checking" });
  useEffect(() => {
    let alive = true;
    fetch("/api/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { ai?: { configured?: boolean; model?: string; fallback_model?: string | null; deep_model?: string } }) => {
        if (!alive) return;
        const ai = d.ai;
        if (ai?.configured && ai.model && ai.deep_model) {
          setStatus({ state: "configured", model: ai.model, fallbackModel: ai.fallback_model ?? null, deepModel: ai.deep_model });
        } else setStatus({ state: "missing" });
      })
      // Can't tell — don't block analysis on a failed status check; the run itself will report.
      .catch(() => alive && setStatus({ state: "unknown" }));
    return () => {
      alive = false;
    };
  }, []);
  return status;
}
