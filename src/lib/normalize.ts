import { jsonrepair } from "jsonrepair";
import {
  REASON_CATEGORIES,
  ScriptAnalysisSchema,
  type DropOffFlag,
  type HookVariant,
  type Pillars,
  type ReasonCategory,
  type RetentionPoint,
  type ScriptAnalysis,
  type ScriptFormat,
} from "./schema";
import { baselineRetention, sampleTimes } from "./curve";
import { clamp, formatTimestamp, parseTimestamp } from "./script";

type Dict = Record<string, unknown>;

const isObj = (v: unknown): v is Dict => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, def = ""): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : def);
function num(v: unknown, def: number): number {
  const n = typeof v === "string" ? parseFloat(v.replace(/[%\s]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : def;
}

/** Pull a JSON object out of an LLM response (handles code fences & chatter). */
export function extractJson(text: string): unknown {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first < 0) throw new Error("No JSON object found in model output");
  if (last <= first) return JSON.parse(jsonrepair(t.slice(first)));
  const body = t.slice(first, last + 1);
  try {
    return JSON.parse(body);
  } catch {
    // unescaped quotes, trailing commas, missing commas… — common LLM slips
    return JSON.parse(jsonrepair(t.slice(first)));
  }
}

export interface NormalizeContext {
  durationSeconds: number;
  format: ScriptFormat;
}

function normCategory(v: unknown): ReasonCategory {
  const s = str(v).toLowerCase().replace(/[\s-]+/g, "_");
  return (REASON_CATEGORIES as readonly string[]).includes(s) ? (s as ReasonCategory) : "other";
}

function normPillars(v: unknown, hookScore: number): Pillars {
  const fallback = hookScore / 4;
  const p = isObj(v) ? v : {};
  const get = (k: string) => Math.round(clamp(num(p[k], fallback), 0, 25));
  return {
    curiosity_gap: get("curiosity_gap"),
    speed_to_value: get("speed_to_value"),
    audience_clarity: get("audience_clarity"),
    emotional_stakes: get("emotional_stakes"),
  };
}

export function verdictFor(score: number): string {
  if (score >= 85) return "Viral-Ready Hook";
  if (score >= 70) return "Strong Hook";
  if (score >= 55) return "Decent — Needs Sharpening";
  if (score >= 40) return "Leaky Hook";
  return "Scroll-Away Risk";
}

function normCurve(v: unknown, ctx: NormalizeContext, hookScore: number, endRetention: number | null): RetentionPoint[] {
  const d = Math.max(1, Math.round(ctx.durationSeconds));
  const raw = Array.isArray(v) ? v : [];
  const pts: RetentionPoint[] = [];
  for (const item of raw) {
    if (!isObj(item)) continue;
    let s = num(item.seconds, NaN);
    if (!Number.isFinite(s)) s = parseTimestamp(str(item.timestamp)) ?? NaN;
    if (!Number.isFinite(s)) continue;
    const r = num(item.retention_pct, NaN);
    if (!Number.isFinite(r)) continue;
    const note = str(item.note);
    pts.push({
      seconds: Math.round(clamp(s, 0, d)),
      retention_pct: Math.round(clamp(r, 0, 100) * 10) / 10,
      timestamp: "",
      ...(note ? { note } : {}),
    });
  }
  pts.sort((a, b) => a.seconds - b.seconds);
  const dedup: RetentionPoint[] = [];
  for (const p of pts) {
    const prev = dedup[dedup.length - 1];
    if (prev && prev.seconds === p.seconds) {
      if (p.note && !prev.note) prev.note = p.note;
      prev.retention_pct = Math.min(prev.retention_pct, p.retention_pct);
    } else dedup.push(p);
  }

  let curve = dedup;
  if (curve.length < 3) {
    curve = sampleTimes(d, ctx.format).map((t) => ({
      seconds: t,
      retention_pct: Math.round(baselineRetention(t, d, ctx.format, hookScore) * 10) / 10,
      timestamp: "",
    }));
    if (endRetention !== null) {
      const last = curve[curve.length - 1].retention_pct || 1;
      const k = endRetention / last;
      curve = curve.map((p) => (p.seconds === 0 ? p : { ...p, retention_pct: Math.round(clamp(p.retention_pct * Math.min(k, 1.5), 0, 100) * 10) / 10 }));
    }
  }
  if (curve[0].seconds !== 0) curve.unshift({ seconds: 0, retention_pct: 100, timestamp: "" });
  curve[0].retention_pct = 100;
  const last = curve[curve.length - 1];
  if (last.seconds < d) {
    curve.push({
      seconds: d,
      retention_pct: endRetention ?? Math.max(0, last.retention_pct - 2),
      timestamp: "",
    });
  }
  return curve.map((p) => ({ ...p, timestamp: formatTimestamp(p.seconds) }));
}

function normFlags(v: unknown, ctx: NormalizeContext): DropOffFlag[] {
  const raw = Array.isArray(v) ? v : [];
  const out: DropOffFlag[] = [];
  for (const item of raw) {
    if (!isObj(item)) continue;
    const flagged_text = str(item.flagged_text);
    if (!flagged_text) continue;
    let category = normCategory(item.reason_category);
    let drop = num(item.drop_pct, 15);
    if (category === "retention_spike" && drop > 0) drop = -drop;
    if (drop < 0 && category !== "retention_spike") category = "retention_spike";
    const time_range = str(item.time_range, "0:00");
    const startStr = time_range.split(/\s*[-–—]\s*/)[0] ?? "0:00";
    const start = clamp(num(item.start_seconds, parseTimestamp(startStr) ?? 0), 0, ctx.durationSeconds);
    out.push({
      time_range,
      start_seconds: Math.round(start),
      flagged_text,
      drop_pct: Math.round(clamp(drop, -30, 90)),
      reason_category: category,
      reason_description: str(item.reason_description, "This line weakens momentum."),
      recommended_fix: str(item.recommended_fix),
    });
  }
  return out.sort((a, b) => (a.start_seconds ?? 0) - (b.start_seconds ?? 0)).slice(0, 14);
}

function normHooks(v: unknown): HookVariant[] {
  const raw = Array.isArray(v) ? v : [];
  const out: HookVariant[] = [];
  for (const item of raw) {
    if (!isObj(item)) continue;
    const hook_text = str(item.hook_text);
    if (!hook_text) continue;
    out.push({
      framework: str(item.framework, "Hook"),
      hook_text,
      why_it_works: str(item.why_it_works),
    });
  }
  return out.slice(0, 8);
}

/** Coerce arbitrary (LLM) output into a schema-valid ScriptAnalysis. */
export function normalizeAnalysis(raw: unknown, ctx: NormalizeContext): ScriptAnalysis {
  const o = isObj(raw) ? raw : {};
  const rawScore = Math.round(clamp(num(o.hook_score, 50), 0, 100));
  const pillars = normPillars(o.pillars, rawScore);
  const pillarSum = pillars.curiosity_gap + pillars.speed_to_value + pillars.audience_clarity + pillars.emotional_stakes;
  // keep the score consistent with the 4-pillar rubric when the model drifted
  const hook_score = isObj(o.pillars) && Math.abs(pillarSum - rawScore) > 6 ? pillarSum : rawScore;

  const endRaw = num(o.predicted_end_retention, NaN);
  const endRetention = Number.isFinite(endRaw) ? clamp(endRaw, 0, 100) : null;
  const retention_curve = normCurve(o.retention_curve, ctx, hook_score, endRetention);
  const predicted_end_retention = Math.round(retention_curve[retention_curve.length - 1].retention_pct);

  const analysis: ScriptAnalysis = {
    hook_score,
    predicted_end_retention,
    estimated_duration_seconds: Math.round(ctx.durationSeconds),
    hook_critique: str(o.hook_critique, "No critique available."),
    verdict: verdictFor(hook_score),
    pillars,
    retention_curve,
    drop_off_flags: normFlags(o.drop_off_flags, ctx),
    hook_variants: normHooks(o.hook_variants),
  };
  return ScriptAnalysisSchema.parse(analysis);
}
