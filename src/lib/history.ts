import type { AnalysisResult } from "./schema";

const KEY = "scripthook:history:v1";
const MAX = 15;

export function loadHistory(): AnalysisResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    // Reports from the retired offline estimator aren't AI output — drop them.
    return Array.isArray(list) ? (list as AnalysisResult[]).filter((r) => (r as { source?: string })?.source === "ai") : [];
  } catch {
    return [];
  }
}

export function saveToHistory(result: AnalysisResult): AnalysisResult[] {
  const list = [result, ...loadHistory().filter((r) => r.id !== result.id)].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // quota exceeded — drop the oldest half and retry once
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, Math.ceil(MAX / 2))));
    } catch {
      /* ignore */
    }
  }
  return list;
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const DRAFT_KEY = "scripthook:draft:v1";
/** Landing page → Studio handoff: run the saved draft once on arrival. */
export const AUTORUN_PARAM = "analyze";
export const VOICE_KEY = "scripthook:voice:v1";
export const PREFS_KEY = "scripthook:prefs:v1";
