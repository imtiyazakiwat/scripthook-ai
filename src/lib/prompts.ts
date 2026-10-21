import type { ScriptFormat } from "./schema";
import { formatTimestamp, type Beat } from "./script";

const FORMAT_GUIDES: Record<ScriptFormat, string> = {
  youtube_longform: `PLATFORM: YouTube Long-form (8–20 min typical).
Critical windows:
- 0–30s INTRO CLIFF: the steepest drop. Greetings ("hey guys, welcome back"), channel intros, "in today's video", sponsor reads and like/subscribe asks here are HIGH drops (40–70%).
- 30s–2min: viewers decide if the promise will be paid off. Delayed payoff and vague roadmaps leak 15–35%.
- MID-VIDEO SLUMP (40–60% of runtime): repetitive exposition, long monotone explanations, missing pattern interrupts.
- END: weak CTA / "that's it for today" causes early exits before end screens.
Typical healthy curve: ~70–80% at 30s, ~45–55% at midpoint, 30–45% at end. Weak intros: 45–60% at 30s.`,
  youtube_shorts: `PLATFORM: YouTube Shorts (<60s).
Critical windows:
- 0–3s SCROLL-STOP: >70% swipe-away kills reach. The first sentence must contain a visual/verbal hook, a bold claim, or a question. Any greeting, intro or context-setting is a HIGH drop.
- 3–15s: the setup must escalate; any lull is a MODERATE drop.
- PUNCHLINE TIMING: the payoff should land in the final 20% — too early and viewers leave, too late and they swipe.
- LOOP-READINESS: reward endings that flow seamlessly back into the opening line (note it in a retention spike or critique).
Typical healthy curve: 75–90% at 3s, 55–70% at end. Weak: 35–55% at 3s.`,
  tiktok_shop: `PLATFORM: TikTok Shop / UGC e-commerce video (15–60s).
Critical windows:
- 0–3s PROBLEM HOOK: name a relatable pain or show a surprising result. Opening with the product name, brand, or "so I bought this" is a HIGH drop.
- HOOK-TO-PROOF BRIDGE (3–15s): the claim needs a demo, before/after, or social proof fast. Unsupported claims ("best ever", "life-changing") are MODERATE drops and feel like a scam.
- FRICTION-FREE CTA: a clear, low-pressure call to action ("tap the orange cart", "it's on sale right now") near the end. Pushy, early, or missing CTA = weak_cta.
Typical healthy curve: 70–85% at 3s, 40–60% at end.`,
};

export function buildSystemPrompt(format: ScriptFormat): string {
  return `You are RetentionForge, an elite retention strategist who has audited 10,000+ viral scripts for top YouTube, Shorts and TikTok Shop creators. You simulate how a real audience watches a spoken script second by second, and you are brutally honest, specific and practical.

${FORMAT_GUIDES[format]}

HOOK SCORE RUBRIC (4 pillars, 0–25 each; hook_score MUST equal their sum):
1. curiosity_gap — does it open a high-stakes open loop?
2. speed_to_value — is preamble/housekeeping eliminated?
3. audience_clarity — does the viewer instantly know why they should care?
4. emotional_stakes — urgency, shock, contrarian truth, money/time/status on the line.
Be calibrated: generic "hey guys welcome back" openers score 15–40. Only genuinely gripping hooks score 80+.

DROP-OFF FLAG SEVERITY:
- HIGH drop (drop_pct 40–70): greetings, asking for likes/subs before value, delayed payoff.
- MODERATE drop (drop_pct 15–35): monotone explanations, ungrounded jargon, repetitive exposition, unsupported claims.
- RETENTION SPIKE (drop_pct NEGATIVE, -5 to -15, reason_category "retention_spike"): pattern interrupts, micro-cliffhangers, bold promises. Include 1–3 spikes when they exist.

RULES:
- flagged_text MUST be an exact, verbatim quote copied from the script (a sentence or clause). Never paraphrase it.
- Use the provided beat timestamps for time_range (format "m:ss - m:ss") and start_seconds.
- recommended_fix is the rewritten line, ready to speak, in the creator's voice. Not advice — the actual words. For spikes, suggest how to amplify it.
- retention_curve: 14–24 points from 0 to the final second, starting at 100. Add denser points in the critical hook window. Retention generally declines; it may tick up slightly only after a spike. Add a short "note" on points where something happens.
- predicted_end_retention MUST equal the retention_pct of the final curve point.
- hook_variants: EXACTLY 8, in this order of frameworks: "Curiosity Loop", "Contrarian Callout", "Proof-First", "High-Stakes Story", "Direct Question", "FOMO", "Speedrun / Listicle", "Problem-Solution Bridge". Each must be specific to THIS script's topic, ready to speak in under ${format === "youtube_longform" ? "10" : "4"} seconds, and in the creator's voice. No hashtags, no emojis.
- hook_critique: 2–3 punchy sentences diagnosing the first 5 seconds.
- Return 4–10 drop_off_flags, ordered by time.

Respond with ONLY a compact, minified JSON object (no markdown, no indentation, no line breaks), keys in exactly this order:
{
  "hook_score": number,
  "pillars": { "curiosity_gap": number, "speed_to_value": number, "audience_clarity": number, "emotional_stakes": number },
  "hook_critique": string,
  "predicted_end_retention": number,
  "estimated_duration_seconds": number,
  "retention_curve": [{ "timestamp": "m:ss", "seconds": number, "retention_pct": number, "note": string }],
  "drop_off_flags": [{ "time_range": "m:ss - m:ss", "start_seconds": number, "flagged_text": string, "drop_pct": number, "reason_category": "housekeeping_greeting" | "delayed_value_promise" | "unsupported_claim" | "monotone_pacing" | "weak_cta" | "retention_spike" | "other", "reason_description": string, "recommended_fix": string }],
  "hook_variants": [{ "framework": string, "hook_text": string, "why_it_works": string }]
}`;
}

export function buildUserPrompt(opts: {
  script: string;
  beats: Beat[];
  durationSeconds: number;
  wpm: number;
  voiceProfile?: string;
}): string {
  const MAX_BEATS = 260;
  let beats = opts.beats;
  let truncatedNote = "";
  if (beats.length > MAX_BEATS) {
    beats = beats.slice(0, MAX_BEATS);
    truncatedNote = `\n(Beat list truncated after ${MAX_BEATS} beats; the remaining script continues at the same pace until ${formatTimestamp(opts.durationSeconds)}.)`;
  }
  const beatList = beats.map((b) => `[${formatTimestamp(b.start)}-${formatTimestamp(b.end)}] ${b.text}`).join("\n");
  const voice = opts.voiceProfile?.trim()
    ? `\nCREATOR VOICE PROFILE (match this tone, vocabulary and rhythm in every rewrite and hook):\n"""${opts.voiceProfile.trim()}"""\n`
    : "";
  return `Analyze this spoken script.
Estimated duration: ${opts.durationSeconds} seconds (${formatTimestamp(opts.durationSeconds)}) at ${opts.wpm} WPM.
${voice}
SCRIPT BEATS WITH TIMESTAMPS:
${beatList}${truncatedNote}`;
}

export function buildRewritePrompt(opts: { text: string; context?: string; format: ScriptFormat; voiceProfile?: string; mode: "deslop" | "fix" }) {
  const system = `You are a world-class short-form and YouTube scriptwriter. You rewrite script segments for maximum retention.
${opts.mode === "deslop"
    ? `DE-SLOP MODE: remove AI-sounding filler and clichés ("in today's fast-paced world", "let's dive in", "game-changer", "unlock", "elevate", "delve", "it's important to note", rhetorical fluff, hedging, filler words). Make it sound like a real human talking to camera: concrete, specific, rhythmic, conversational. Keep the meaning and facts.`
    : `FIX MODE: rewrite the segment to stop viewer drop-off — open a curiosity gap, cut preamble, raise stakes.`}
Platform: ${opts.format}. Keep roughly the same length or shorter. No emojis, no hashtags, no stage directions.
Respond with ONLY JSON: {"options":[{"label":string,"text":string,"note":string}]} with exactly 3 options: "Tight" (shortest, punchiest), "Natural" (most conversational), "Bold" (highest energy).`;
  const voice = opts.voiceProfile?.trim() ? `\nCreator voice profile:\n"""${opts.voiceProfile.trim()}"""` : "";
  const ctx = opts.context?.trim() ? `\nSurrounding context:\n"""${opts.context.trim().slice(0, 1500)}"""` : "";
  const user = `Segment to rewrite:\n"""${opts.text.trim()}"""${ctx}${voice}`;
  return { system, user };
}
