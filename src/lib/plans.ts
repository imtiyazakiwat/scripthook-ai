import type { ScriptFormat } from "./schema";

export type PlanId = "free" | "creator" | "pro";

export interface PlanDef {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  /** null = unlimited */
  limit: number | null;
  period: "day" | "month";
  formats: ScriptFormat[];
  unlockedHooks: number;
  unlockedFixes: number;
  teleprompter: boolean;
  batch: boolean;
  deslop: boolean;
  voiceProfiles: boolean;
  features: string[];
}

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Test the waters",
    limit: 2,
    period: "day",
    formats: ["youtube_longform"],
    unlockedHooks: 2,
    unlockedFixes: 1,
    teleprompter: false,
    batch: false,
    deslop: false,
    voiceProfiles: false,
    features: ["2 analyses per day", "YouTube Long-form preset", "Hook Score & retention curve", "Drop-off flags", "2 hook rewrites preview"],
  },
  creator: {
    id: "creator",
    name: "Creator",
    price: 19,
    tagline: "For weekly uploaders",
    limit: 30,
    period: "month",
    formats: ["youtube_longform", "youtube_shorts", "tiktok_shop"],
    unlockedHooks: 8,
    unlockedFixes: Infinity,
    teleprompter: true,
    batch: false,
    deslop: false,
    voiceProfiles: false,
    features: ["30 analyses per month", "All 3 platform presets", "8 viral hook variants", "1-click “Fix this beat”", "Teleprompter export"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 39,
    tagline: "For agencies & daily posters",
    limit: null,
    period: "month",
    formats: ["youtube_longform", "youtube_shorts", "tiktok_shop"],
    unlockedHooks: 8,
    unlockedFixes: Infinity,
    teleprompter: true,
    batch: true,
    deslop: true,
    voiceProfiles: true,
    features: ["Unlimited analyses", "Everything in Creator", "Batch compare up to 5 scripts", "Segment-level De-Slop rewrites", "Custom creator voice profile"],
  },
};

export const FORMAT_META: Record<ScriptFormat, { label: string; short: string; description: string }> = {
  youtube_longform: {
    label: "YouTube Long-form",
    short: "Long-form",
    description: "0–30s intro cliff, mid-video slump & housekeeping traps",
  },
  youtube_shorts: {
    label: "YouTube Shorts",
    short: "Shorts",
    description: "0–3s scroll-stop, punchline timing & loop-readiness",
  },
  tiktok_shop: {
    label: "TikTok Shop",
    short: "TikTok Shop",
    description: "Problem hook, hook-to-proof bridge & friction-free CTA",
  },
};

export function isPlanId(v: unknown): v is PlanId {
  return v === "free" || v === "creator" || v === "pro";
}
