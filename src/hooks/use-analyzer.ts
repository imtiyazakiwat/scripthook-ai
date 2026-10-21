"use client";

import { useCallback, useRef, useState } from "react";
import type { AnalysisResult, AnalyzeStreamEvent, ScriptFormat, SpeakingPace } from "@/lib/schema";
import { clientFingerprint } from "@/lib/utils";

export interface AnalyzeInput {
  script: string;
  format: ScriptFormat;
  speaking_pace: SpeakingPace;
  strip_director_notes: boolean;
  voice_profile?: string;
  depth?: "fast" | "deep";
}

export interface AnalyzeError {
  status: number;
  message: string;
  code?: string;
  required?: string;
}

export interface Progress {
  stage: string;
  stageKey: string;
  pct: number;
  partialScore?: number;
  partialCritique?: string;
}

let fpPromise: Promise<string> | null = null;
function getFp() {
  if (!fpPromise) fpPromise = clientFingerprint();
  return fpPromise;
}

/**
 * Consume the NDJSON stream from /api/analyze-script.
 * Exposed as a plain function so batch mode can reuse it.
 */
export async function analyzeScript(
  input: AnalyzeInput,
  opts: { signal?: AbortSignal; onEvent?: (e: AnalyzeStreamEvent) => void } = {},
): Promise<AnalysisResult> {
  const res = await fetch("/api/analyze-script", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-client-fp": await getFp() },
    body: JSON.stringify(input),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string; required?: string };
    throw { status: res.status, message: data.error || "Analysis failed. Please try again.", code: data.code, required: data.required } satisfies AnalyzeError;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let result: AnalysisResult | null = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let event: AnalyzeStreamEvent;
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }
      opts.onEvent?.(event);
      if (event.type === "result") result = event.data;
      if (event.type === "error") throw { status: 500, message: event.message } satisfies AnalyzeError;
    }
  }
  if (!result) throw { status: 500, message: "The analysis stream ended unexpectedly." } satisfies AnalyzeError;
  return result;
}

export function useAnalyzer(callbacks: { onMeta?: (runsLeft: number | null, plan: string) => void } = {}) {
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [progress, setProgress] = useState<Progress>({ stage: "", stageKey: "", pct: 0 });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<AnalyzeError | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const run = useCallback(async (input: AnalyzeInput): Promise<AnalysisResult | null> => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus("analyzing");
    setError(null);
    setProgress({ stage: "Connecting to the retention engine", stageKey: "connect", pct: 2 });
    try {
      const r = await analyzeScript(input, {
        signal: ctrl.signal,
        onEvent: (e) => {
          if (e.type === "meta") cbRef.current.onMeta?.(e.runs_left, e.plan);
          else if (e.type === "stage") setProgress((p) => ({ ...p, stage: e.label, stageKey: e.stage, pct: Math.max(p.pct, 5) }));
          else if (e.type === "progress") setProgress((p) => ({ ...p, pct: Math.max(p.pct, e.pct) }));
          else if (e.type === "partial")
            setProgress((p) => ({
              ...p,
              ...(e.hook_score !== undefined ? { partialScore: e.hook_score } : {}),
              ...(e.hook_critique ? { partialCritique: e.hook_critique } : {}),
            }));
        },
      });
      if (ctrl.signal.aborted) return null;
      setResult(r);
      setStatus("done");
      return r;
    } catch (err) {
      if (ctrl.signal.aborted || (err as Error)?.name === "AbortError") {
        setStatus((s) => (s === "analyzing" ? "idle" : s));
        return null;
      }
      const e = err as AnalyzeError;
      setError({ status: e.status ?? 0, message: e.message || "Network error — check your connection.", code: e.code, required: e.required });
      setStatus("error");
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  const load = useCallback((r: AnalysisResult) => {
    abortRef.current?.abort();
    setResult(r);
    setError(null);
    setStatus("done");
  }, []);

  return { status, progress, result, error, run, cancel, load, setResult };
}
