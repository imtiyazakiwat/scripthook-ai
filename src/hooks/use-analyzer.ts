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
  /** One line per failed model attempt, e.g. "gemini-3.5-flash-lite timed out after 20s". */
  details?: string[];
}

export interface Progress {
  stage: string;
  stageKey: string;
  pct: number;
  partialScore?: number;
  partialCritique?: string;
  /** Set while a backup attempt runs after a failed one. */
  retry?: { attempt: number; of: number; model: string; reason: string };
}

let fpPromise: Promise<string> | null = null;
function getFp() {
  if (!fpPromise) fpPromise = clientFingerprint();
  return fpPromise;
}

function fail(e: AnalyzeError): never {
  throw e;
}

/**
 * Consume the NDJSON stream from /api/analyze-script.
 * Exposed as a plain function so batch mode can reuse it.
 */
export async function analyzeScript(
  input: AnalyzeInput,
  opts: { signal?: AbortSignal; onEvent?: (e: AnalyzeStreamEvent) => void } = {},
): Promise<AnalysisResult> {
  let res: Response;
  try {
    res = await fetch("/api/analyze-script", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client-fp": await getFp() },
      body: JSON.stringify(input),
      signal: opts.signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    fail({ status: 0, code: "network", message: "Couldn’t reach the ScriptHook server. Check your connection and try again." });
  }
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string; required?: string; details?: string[] };
    fail({
      status: res.status,
      message: data.error || `The server answered with HTTP ${res.status}, so no report was generated.`,
      code: data.code,
      required: data.required,
      details: data.details,
    });
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let result: AnalysisResult | null = null;
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (err) {
      if ((err as Error)?.name === "AbortError") throw err;
      fail({ status: 0, code: "network", message: "The connection dropped before the AI finished, so no report was generated." });
    }
    if (chunk.done) break;
    buf += decoder.decode(chunk.value, { stream: true });
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
      if (event.type === "error") fail({ status: 502, message: event.message, code: event.code, details: event.details });
    }
  }
  if (!result) fail({ status: 504, code: "incomplete", message: "The server stopped responding before the AI finished, so no report was generated." });
  return result;
}

export function useAnalyzer() {
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [progress, setProgress] = useState<Progress>({ stage: "", stageKey: "", pct: 0 });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<AnalyzeError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (input: AnalyzeInput): Promise<AnalysisResult | null> => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus("analyzing");
    setError(null);
    setProgress({ stage: "Connecting to the server", stageKey: "connect", pct: 2 });
    try {
      const r = await analyzeScript(input, {
        signal: ctrl.signal,
        onEvent: (e) => {
          if (e.type === "stage") setProgress((p) => ({ ...p, stage: e.label, stageKey: e.stage, pct: Math.max(p.pct, 5) }));
          else if (e.type === "progress") setProgress((p) => ({ ...p, pct: Math.max(p.pct, e.pct) }));
          // A failed attempt's partial score/critique must not linger next to the retry's.
          else if (e.type === "retry")
            setProgress({
              stage: `Retrying with ${e.model} (attempt ${e.attempt} of ${e.of})`,
              stageKey: "simulating",
              pct: 5,
              retry: { attempt: e.attempt, of: e.of, model: e.model, reason: e.reason },
            });
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
      const e = err as Partial<AnalyzeError>;
      setError({
        status: e.status ?? 0,
        message: e.message || "Something went wrong, so no report was generated.",
        code: e.code,
        required: e.required,
        details: e.details,
      });
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
