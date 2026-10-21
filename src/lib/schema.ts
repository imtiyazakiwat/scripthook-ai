import { z } from "zod";

/**
 * Structured AI schema (PRD §5) — extended with optional `pillars`,
 * `verdict` and a `retention_spike` category so the UI can render the
 * 4-pillar rubric and green re-engagement flags.
 */
export const REASON_CATEGORIES = [
  "housekeeping_greeting",
  "delayed_value_promise",
  "unsupported_claim",
  "monotone_pacing",
  "weak_cta",
  "retention_spike",
  "other",
] as const;

export const PillarsSchema = z.object({
  curiosity_gap: z.number().min(0).max(25),
  speed_to_value: z.number().min(0).max(25),
  audience_clarity: z.number().min(0).max(25),
  emotional_stakes: z.number().min(0).max(25),
});

export const RetentionPointSchema = z.object({
  timestamp: z.string().describe("Timestamp in mm:ss format"),
  seconds: z.number().describe("Elapsed seconds"),
  retention_pct: z.number().min(0).max(100).describe("Projected retention percentage at this second"),
  note: z.string().optional().describe("Short reason for retention shift"),
});

export const DropOffFlagSchema = z.object({
  time_range: z.string().describe("e.g. 0:00 - 0:07"),
  start_seconds: z.number().optional(),
  flagged_text: z.string().describe("The exact quote from the script causing drop-off"),
  drop_pct: z.number().describe("Estimated percentage drop caused by this line (negative = re-engagement spike)"),
  reason_category: z.enum(REASON_CATEGORIES),
  reason_description: z.string().describe("Clear explanation of viewer psychology"),
  recommended_fix: z.string().describe("Rewritten line ready to paste"),
  locked: z.boolean().optional(),
});

export const HookVariantSchema = z.object({
  framework: z.string().describe("e.g. Curiosity Gap, Contrarian, Stakes, Story"),
  hook_text: z.string().describe("The ready-to-speak hook variant"),
  why_it_works: z.string().describe("1 sentence explanation of why this hooks viewers"),
  locked: z.boolean().optional(),
});

export const ScriptAnalysisSchema = z.object({
  hook_score: z.number().min(0).max(100).describe("Overall hook quality score from 0 to 100"),
  predicted_end_retention: z.number().min(0).max(100).describe("Estimated % of viewers remaining at video end"),
  estimated_duration_seconds: z.number().describe("Estimated spoken duration in seconds"),
  hook_critique: z.string().describe("Concise 2-3 sentence diagnosis of why viewers stay or bounce in the first 5 seconds"),
  verdict: z.string().optional(),
  pillars: PillarsSchema.optional(),
  retention_curve: z.array(RetentionPointSchema),
  drop_off_flags: z.array(DropOffFlagSchema),
  hook_variants: z.array(HookVariantSchema),
});

export type ScriptAnalysis = z.infer<typeof ScriptAnalysisSchema>;
export type RetentionPoint = z.infer<typeof RetentionPointSchema>;
export type DropOffFlag = z.infer<typeof DropOffFlagSchema>;
export type HookVariant = z.infer<typeof HookVariantSchema>;
export type Pillars = z.infer<typeof PillarsSchema>;
export type ReasonCategory = (typeof REASON_CATEGORIES)[number];

export const FORMATS = ["youtube_longform", "youtube_shorts", "tiktok_shop"] as const;
export const PACES = ["slow", "normal", "fast"] as const;
export type ScriptFormat = (typeof FORMATS)[number];
export type SpeakingPace = (typeof PACES)[number];

export const MAX_SCRIPT_CHARS = 15_000;
export const MIN_SCRIPT_WORDS = 20;

export const AnalyzeRequestSchema = z.object({
  script: z.string(),
  format: z.enum(FORMATS).default("youtube_longform"),
  speaking_pace: z.enum(PACES).default("normal"),
  strip_director_notes: z.boolean().optional().default(true),
  voice_profile: z.string().max(1500).optional(),
  depth: z.enum(["fast", "deep"]).optional().default("fast"),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/** Wire envelope returned to the client (analysis + run metadata). */
export interface AnalysisResult extends ScriptAnalysis {
  id: string;
  created_at: string;
  format: ScriptFormat;
  speaking_pace: SpeakingPace;
  source: "ai" | "heuristic";
  model?: string;
  depth?: "fast" | "deep";
  script: string;
  word_count: number;
}

/** NDJSON stream events from POST /api/analyze-script */
export type AnalyzeStreamEvent =
  | { type: "meta"; plan: string; runs_left: number | null }
  | { type: "stage"; stage: "sanitizing" | "simulating" | "scoring" | "rewriting" | "finalizing"; label: string }
  | { type: "progress"; pct: number }
  | { type: "partial"; hook_score?: number; hook_critique?: string }
  | { type: "result"; data: AnalysisResult }
  | { type: "error"; message: string };
