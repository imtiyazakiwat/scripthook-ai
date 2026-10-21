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
import { clamp, formatTimestamp, locateQuote, parseTimestamp, type Beat } from "./script";

/**
 * The model answered, but not with a complete report. Gaps are never filled
 * with made-up values: the attempt fails and the next model (or an error) follows.
 */
export class IncompleteReportError extends Error {
  constructor(missing: string) {
    super(missing);
    this.name = "IncompleteReportError";
  }
}

type Dict = Record<string, unknown>;

const isObj = (v: unknown): v is Dict => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
/** Parse a number the model may have sent as "60%" — NaN when it isn't one. */
function num(v: unknown): number {
  if (typeof v === "string") return parseFloat(v.replace(/[%\s]/g, ""));
  return typeof v === "number" ? v : NaN;
}

/** Pull a JSON object out of an LLM response (handles code fences & chatter). */
export function extractJson(text: string): unknown {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first < 0) throw new SyntaxError("No JSON object found in model output");
  try {
    if (last > first) {
      try {
        return JSON.parse(t.slice(first, last + 1));
      } catch {
        /* unescaped quotes, trailing commas, missing commas… — repair below */
      }
    }
    return JSON.parse(jsonrepair(t.slice(first)));
  } catch (err) {
    throw new SyntaxError(`Malformed JSON in model output: ${(err as Error).message}`);
  }
}

export interface NormalizeContext {
  durationSeconds: number;
  format: ScriptFormat;
  /** The script the model saw and its timed beats — used to time flags the model left untimed. */
  script?: string;
  beats?: Beat[];
}

/** Start time of the beat containing `quote`, computed from the script's own word timing. */
function beatStartFor(quote: string, ctx: NormalizeContext): number {
  if (!ctx.script || !ctx.beats?.length) return NaN;
  const loc = locateQuote(ctx.script, quote);
  if (!loc) return NaN;
  const beat = ctx.beats.find((b) => loc[0] >= b.offset && loc[0] < b.offset + b.text.length) ?? ctx.beats.find((b) => b.offset >= loc[0]);
  return beat ? beat.start : NaN;
}

function normCategory(v: unknown): ReasonCategory {
  const s = str(v).toLowerCase().replace(/[\s-]+/g, "_");
  return (REASON_CATEGORIES as readonly string[]).includes(s) ? (s as ReasonCategory) : "other";
}

const PILLAR_KEYS = ["curiosity_gap", "speed_to_value", "audience_clarity", "emotional_stakes"] as const;

/** All four pillar scores from the model, or nothing — never estimated. */
function normPillars(v: unknown): Pillars | undefined {
  if (!isObj(v)) return undefined;
  const vals = PILLAR_KEYS.map((k) => num(v[k]));
  if (vals.some((n) => !Number.isFinite(n))) return undefined;
  const [curiosity_gap, speed_to_value, audience_clarity, emotional_stakes] = vals.map((n) => Math.round(clamp(n, 0, 25)));
  return { curiosity_gap, speed_to_value, audience_clarity, emotional_stakes };
}

export function verdictFor(score: number): string {
  if (score >= 85) return "Viral-Ready Hook";
  if (score >= 70) return "Strong Hook";
  if (score >= 55) return "Decent — Needs Sharpening";
  if (score >= 40) return "Leaky Hook";
  return "Scroll-Away Risk";
}

function normCurve(v: unknown, ctx: NormalizeContext, endRetention: number | null): RetentionPoint[] {
  if (!Array.isArray(v)) throw new IncompleteReportError("no retention curve");
  const d = Math.max(1, Math.round(ctx.durationSeconds));
  const pts: RetentionPoint[] = [];
  for (const item of v) {
    if (!isObj(item)) continue;
    let s = num(item.seconds);
    if (!Number.isFinite(s)) s = parseTimestamp(str(item.timestamp)) ?? NaN;
    const r = num(item.retention_pct);
    if (!Number.isFinite(s) || !Number.isFinite(r)) continue;
    const note = str(item.note);
    pts.push({
      seconds: Math.round(clamp(s, 0, d)),
      retention_pct: Math.round(clamp(r, 0, 100) * 10) / 10,
      timestamp: "",
      ...(note ? { note } : {}),
    });
  }
  pts.sort((a, b) => a.seconds - b.seconds);
  const curve: RetentionPoint[] = [];
  for (const p of pts) {
    const prev = curve[curve.length - 1];
    if (prev && prev.seconds === p.seconds) {
      if (p.note && !prev.note) prev.note = p.note;
      prev.retention_pct = Math.min(prev.retention_pct, p.retention_pct);
    } else curve.push(p);
  }
  if (curve.length < 2) throw new IncompleteReportError("retention curve has fewer than 2 points");

  // Retention at second 0 is 100% by definition.
  if (curve[0].seconds !== 0) curve.unshift({ seconds: 0, retention_pct: 100, timestamp: "" });
  curve[0].retention_pct = 100;

  // Reach the final second only with the model's own end-of-video estimate.
  const last = curve[curve.length - 1];
  if (last.seconds < d) {
    if (endRetention !== null) curve.push({ seconds: d, retention_pct: endRetention, timestamp: "" });
    else if (last.seconds < d * 0.9) throw new IncompleteReportError("retention curve stops before the end of the script");
  }
  return curve.map((p) => ({ ...p, timestamp: formatTimestamp(p.seconds) }));
}

function normFlags(v: unknown, ctx: NormalizeContext): DropOffFlag[] {
  if (!Array.isArray(v)) throw new IncompleteReportError("no drop-off flags");
  const out: DropOffFlag[] = [];
  for (const item of v) {
    if (!isObj(item)) continue;
    const flagged_text = str(item.flagged_text);
    let drop = num(item.drop_pct);
    // A flag without its quote or its size is unusable — skip it rather than guess.
    if (!flagged_text || !Number.isFinite(drop)) continue;
    let category = normCategory(item.reason_category);
    if (category === "retention_spike" && drop > 0) drop = -drop;
    if (drop < 0 && category !== "retention_spike") category = "retention_spike";
    const range = str(item.time_range);
    let start = num(item.start_seconds);
    if (!Number.isFinite(start)) start = parseTimestamp(range.split(/\s*[-–—]\s*/)[0] ?? "") ?? NaN;
    if (!Number.isFinite(start)) start = beatStartFor(flagged_text, ctx);
    if (!Number.isFinite(start)) continue; // no timing and not found in the script, so it can't be placed
    start = Math.round(clamp(start, 0, ctx.durationSeconds));
    out.push({
      time_range: range || formatTimestamp(start),
      start_seconds: start,
      flagged_text,
      drop_pct: Math.round(clamp(drop, -30, 90)),
      reason_category: category,
      reason_description: str(item.reason_description),
      recommended_fix: str(item.recommended_fix),
    });
  }
  return out.sort((a, b) => (a.start_seconds ?? 0) - (b.start_seconds ?? 0)).slice(0, 14);
}

function normHooks(v: unknown): HookVariant[] {
  if (!Array.isArray(v)) throw new IncompleteReportError("no hook rewrites");
  const out: HookVariant[] = [];
  for (const item of v) {
    if (!isObj(item)) continue;
    const hook_text = str(item.hook_text);
    if (!hook_text) continue;
    out.push({
      framework: str(item.framework) || "Hook rewrite",
      hook_text,
      why_it_works: str(item.why_it_works),
    });
  }
  return out.slice(0, 8);
}

/**
 * Validate and tidy LLM output into a ScriptAnalysis. Every number comes from
 * the model; anything essential that's missing throws IncompleteReportError.
 */
export function normalizeAnalysis(raw: unknown, ctx: NormalizeContext): ScriptAnalysis {
  if (!isObj(raw)) throw new IncompleteReportError("the response wasn't a JSON object");
  const o = raw;
  const pillars = normPillars(o.pillars);
  const pillarSum = pillars ? PILLAR_KEYS.reduce((sum, k) => sum + pillars[k], 0) : null;

  const rawScore = num(o.hook_score);
  let hook_score: number;
  if (Number.isFinite(rawScore)) {
    const s = Math.round(clamp(rawScore, 0, 100));
    // keep the score consistent with the model's own 4-pillar rubric when it drifted
    hook_score = pillarSum !== null && Math.abs(pillarSum - s) > 6 ? pillarSum : s;
  } else if (pillarSum !== null) {
    hook_score = pillarSum; // the rubric defines the score as the pillar sum
  } else {
    throw new IncompleteReportError("no hook score");
  }

  const endRaw = num(o.predicted_end_retention);
  const endRetention = Number.isFinite(endRaw) ? Math.round(clamp(endRaw, 0, 100) * 10) / 10 : null;
  const retention_curve = normCurve(o.retention_curve, ctx, endRetention);
  const predicted_end_retention = Math.round(retention_curve[retention_curve.length - 1].retention_pct);

  const analysis: ScriptAnalysis = {
    hook_score,
    predicted_end_retention,
    estimated_duration_seconds: Math.round(ctx.durationSeconds),
    hook_critique: str(o.hook_critique),
    verdict: verdictFor(hook_score),
    ...(pillars ? { pillars } : {}),
    retention_curve,
    drop_off_flags: normFlags(o.drop_off_flags, ctx),
    hook_variants: normHooks(o.hook_variants),
  };
  return ScriptAnalysisSchema.parse(analysis);
}
