import type { ReasonCategory, ScriptAnalysis, ScriptFormat } from "./schema";
import { baselineRetention, sampleTimes } from "./curve";
import { normalizeAnalysis } from "./normalize";
import { clamp, formatTimestamp, splitBeats, type Beat } from "./script";

/**
 * Deterministic, offline retention analyser. Used as a fallback when the
 * LLM is unreachable and to give the model accurate beat timestamps.
 */

interface Rule {
  re: RegExp;
  category: ReasonCategory;
  drop: number;
  reason: string;
  fix: (beat: Beat, topic: string) => string;
  /** only flag when the beat starts before this many seconds */
  before?: number;
}

const RULES: Rule[] = [
  {
    re: /\b(hey|hi|hello|what'?s up|yo|sup)\b[\s,]+(guys|everyone|everybody|y'?all|friends|folks|fam|team|internet)\b|\bwelcome (back )?to (the|my) channel\b|\bwelcome back\b/i,
    category: "housekeeping_greeting",
    drop: 45,
    reason: "Greetings signal ‘nothing is happening yet’. Viewers who clicked for a payoff swipe away before you deliver one.",
    fix: (_b, topic) => `Most people get ${topic} completely wrong — and it's costing them. Here's the fix.`,
  },
  {
    re: /\bmy name is\b|\bif you'?re new here\b|\bfor those (of you )?who don'?t know me\b/i,
    category: "housekeeping_greeting",
    drop: 35,
    reason: "Introductions delay value. Earn the right to introduce yourself after the first payoff.",
    fix: (_b, topic) => `In the next 60 seconds you'll see exactly how ${topic} works — no fluff.`,
  },
  {
    re: /\b(smash|hit|click|tap|press|don'?t forget to|make sure (you|to))\b.{0,30}\b(like|subscribe|bell|notification|follow)\b|\blike and subscribe\b/i,
    category: "weak_cta",
    drop: 40,
    reason: "Asking for likes before delivering value reads as a toll booth. Viewers haven't been rewarded yet.",
    fix: (_b, topic) => `Here's the part about ${topic} nobody talks about.`,
    before: 120,
  },
  {
    re: /\b(before we (get started|begin|dive in|jump in)|but first|later in (this|the) video|stick around (until|till) the end|stay tuned|wait (until|till) the end|we'?ll get to (that|it) (later|in a bit))\b/i,
    category: "delayed_value_promise",
    drop: 30,
    reason: "Explicitly postponing the payoff tells viewers they can leave now and lose nothing.",
    fix: (_b, topic) => `Let's get straight to it — the biggest ${topic} mistake is the first one.`,
  },
  {
    re: /\b(today'?s (video|episode) is sponsored|this video is sponsored|brought to you by|thanks to .{0,30} for sponsoring)\b/i,
    category: "other",
    drop: 28,
    reason: "An early sponsor read interrupts curiosity before it's been earned.",
    fix: () => "Move the sponsor read after your first payoff (around the 60–90s mark) and bridge into it with a question.",
  },
  {
    re: /\b(in today'?s video|today we('re| are)? (gonna|going to)|in this video (i'?m|i am|we'?re|we are) (gonna|going to)|today i('m| am)? (gonna|going to)|so today)\b/i,
    category: "delayed_value_promise",
    drop: 22,
    reason: "‘In today's video’ is a table-of-contents opener. It describes value instead of delivering it.",
    fix: (_b, topic) => `Here's what nobody tells you about ${topic}.`,
    before: 45,
  },
  {
    re: /\b(guaranteed|100%|the best .{0,20} ever|never fails|always works|everyone knows|scientifically proven|literally the best)\b/i,
    category: "unsupported_claim",
    drop: 18,
    reason: "Big claims without proof trigger skepticism, especially in competitive niches.",
    fix: (b) => `${b.text.replace(/[.!?]+$/, "")} — and here's the proof.`,
  },
  {
    re: /\b(um+|uh+|you know what i mean|kind of|sort of|basically|literally|anyway(s)?|so yeah)\b/i,
    category: "monotone_pacing",
    drop: 12,
    reason: "Filler words drain energy and make the delivery feel unscripted.",
    fix: (b) => b.text.replace(/\b(um+|uh+|you know what i mean|kind of|sort of|basically|literally|anyway(s)?|so yeah),?\s*/gi, "").replace(/\s{2,}/g, " ").trim(),
  },
];

const SPIKE_RE =
  /\b(but here'?s the (thing|catch|twist)|what if|the secret|nobody (tells|talks)|mistake|wrong|here'?s why|plot twist|the truth|watch this|shocking|crazy part|turns out|until|\$\d|\d+%|number \d|step \d)\b|\?/i;

const STOP = new Set(
  "the a an and or but so to of in on for with at by from is are was were be been it this that these those i you we they he she my your our their me us them as if then than just really very about into out up down over more most some any all can will would should could do does did have has had not no yes get got gonna going want like make made thing things video channel today guys everyone hey welcome back talk".split(
    " ",
  ),
);

export function extractTopic(script: string): string {
  const m = script.match(
    /\b(?:talk(?:ing)? about|show(?:ing)? you(?: how to)?|cover(?:ing)?|break(?:ing)? down|review(?:ing)?|teach(?:ing)? you(?: how to)?|learn(?:ing)?(?: how to)?|is about|guide to|how to)\s+([^.,!?\n]{3,48})/i,
  );
  if (m) {
    return m[1]
      .replace(/^(the|a|an|my|our|some)\s+/i, "")
      .replace(/\s+(and|so|because|which|that)\b.*$/i, "")
      .trim()
      .toLowerCase()
      .replace(/\bi\b/g, "I");
  }
  const freq = new Map<string, number>();
  for (const w of script.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? []) {
    if (STOP.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "this";
}

function pillarScores(beats: Beat[], format: ScriptFormat) {
  const hookWindow = format === "youtube_longform" ? 12 : 4;
  const hookText = beats
    .filter((b) => b.start < hookWindow)
    .map((b) => b.text)
    .join(" ");
  const first = beats[0]?.text ?? "";
  const has = (re: RegExp) => re.test(hookText);

  let curiosity = 9;
  if (has(/\?/)) curiosity += 5;
  if (has(/\b(secret|nobody|why|how|what if|the truth|mistake|wrong|until|here'?s)\b/i)) curiosity += 6;
  if (has(/\b(but|however|turns out)\b/i)) curiosity += 3;

  let speed = 22;
  if (/\b(hey|hi|hello|what'?s up)\b|\bwelcome\b/i.test(first)) speed -= 10;
  if (has(/\b(subscribe|like|bell|my name is|sponsor)\b/i)) speed -= 6;
  if (has(/\b(in today'?s video|today we|before we|but first)\b/i)) speed -= 5;
  if ((beats[0]?.words ?? 0) > 22) speed -= 3;

  let clarity = 11;
  if (has(/\byou(r)?\b/i)) clarity += 6;
  if (has(/\b(if you|for anyone|for people who|creators?|beginners?|you'?re)\b/i)) clarity += 4;

  let stakes = 8;
  if (has(/\$\d|\d+%|\b\d{2,}\b/)) stakes += 6;
  if (has(/\b(lost|lose|fail|mistake|never|stop|wrong|danger|cost|broke|quit|almost)\b/i)) stakes += 6;
  if (has(/!/)) stakes += 2;

  return {
    curiosity_gap: clamp(curiosity, 3, 25),
    speed_to_value: clamp(speed, 2, 25),
    audience_clarity: clamp(clarity, 3, 25),
    emotional_stakes: clamp(stakes, 3, 25),
  };
}

export function buildHookVariants(topic: string, format: ScriptFormat) {
  const t = topic || "this";
  const all = [
    {
      framework: "Curiosity Loop",
      hook_text: `There's one thing about ${t} that nobody tells you — and it's the reason most people never see results.`,
      why_it_works: "Opens an unanswered question the brain wants closed, so viewers stay for the answer.",
    },
    {
      framework: "Contrarian Callout",
      hook_text: `Everything you've been told about ${t} is wrong. Here's what actually works.`,
      why_it_works: "Challenging a belief creates instant tension and positions you as the insider.",
    },
    {
      framework: "Proof-First",
      hook_text: `This is what ${t} looks like when you get it right — and I'll show you exactly how I got here.`,
      why_it_works: "Showing the end result first proves the payoff is real before asking for attention.",
    },
    {
      framework: "High-Stakes Story",
      hook_text: `I almost gave up on ${t} completely — until one tiny change flipped everything.`,
      why_it_works: "Personal stakes plus an unresolved ‘until’ create a story loop viewers need closed.",
    },
    {
      framework: "Direct Question",
      hook_text: `Are you still doing ${t} the hard way in 2026?`,
      why_it_works: "A pointed question forces self-identification in under two seconds.",
    },
    {
      framework: "FOMO",
      hook_text: `A small group of creators are quietly using this ${t} trick right now — and everyone else is falling behind.`,
      why_it_works: "Fear of being left out is a stronger motivator than the promise of gain.",
    },
    {
      framework: "Speedrun / Listicle",
      hook_text: `3 ${t} moves in under 60 seconds. Number 2 is the one that changed everything for me.`,
      why_it_works: "A countable promise sets a clear finish line and the teaser on #2 prevents skipping.",
    },
    {
      framework: "Problem-Solution Bridge",
      hook_text: `If ${t} has been driving you crazy, this is the fix I wish I'd found a year ago.`,
      why_it_works: "Names the pain first, then bridges to the solution without sounding like an ad.",
    },
  ];
  if (format === "tiktok_shop") return [all[7], ...all.slice(0, 7)];
  return all;
}

export function heuristicAnalysis(script: string, format: ScriptFormat, wpm: number, durationSeconds: number): ScriptAnalysis {
  const beats = splitBeats(script, wpm);
  const d = Math.max(1, durationSeconds);
  const topic = extractTopic(script);
  const pillars = pillarScores(beats, format);
  const hookScore = pillars.curiosity_gap + pillars.speed_to_value + pillars.audience_clarity + pillars.emotional_stakes;

  type RawFlag = { start: number; end: number; text: string; drop: number; category: ReasonCategory; reason: string; fix: string };
  const flags: RawFlag[] = [];
  const usedBeats = new Set<number>();
  const usedCats = new Map<string, number>();

  for (const beat of beats) {
    for (const rule of RULES) {
      if (rule.before !== undefined && beat.start > rule.before) continue;
      if (!rule.re.test(beat.text)) continue;
      const key = rule.category + rule.drop;
      if ((usedCats.get(key) ?? 0) >= 2) continue;
      usedCats.set(key, (usedCats.get(key) ?? 0) + 1);
      usedBeats.add(beat.index);
      // Early housekeeping hurts more; late leaks hurt less.
      const early = beat.start < (format === "youtube_longform" ? 30 : 3);
      const drop = Math.round(rule.drop * (early ? 1 : 0.6));
      flags.push({ start: beat.start, end: beat.end, text: beat.text, drop, category: rule.category, reason: rule.reason, fix: rule.fix(beat, topic) });
      break;
    }
  }
  // Long monotone exposition
  for (const beat of beats) {
    if (usedBeats.has(beat.index) || beat.words < 38) continue;
    if (flags.filter((f) => f.category === "monotone_pacing").length >= 2) break;
    usedBeats.add(beat.index);
    flags.push({
      start: beat.start,
      end: beat.end,
      text: beat.text,
      drop: 18,
      category: "monotone_pacing",
      reason: `A ${beat.words}-word sentence with no pause or pattern interrupt — attention drifts mid-thought.`,
      fix: "Split this into 2–3 punchy sentences and add a visual or tonal pattern interrupt halfway through.",
    });
  }
  // Retention spikes
  let spikes = 0;
  for (const beat of beats) {
    if (spikes >= 3 || usedBeats.has(beat.index) || beat.start < 2) continue;
    if (!SPIKE_RE.test(beat.text)) continue;
    spikes++;
    flags.push({
      start: beat.start,
      end: beat.end,
      text: beat.text,
      drop: -8,
      category: "retention_spike",
      reason: "Pattern interrupt / open loop — re-engages viewers who were drifting.",
      fix: "Keep this. Consider moving a version of it earlier as a micro-cliffhanger.",
    });
  }

  // Curve: baseline + cumulative effects of flags
  const times = sampleTimes(d, format, 24);
  flags.forEach((f) => times.push(Math.round(f.end)));
  const uniq = [...new Set(times.filter((t) => t <= d))].sort((a, b) => a - b);
  const curve = uniq.map((t) => {
    let r = baselineRetention(t, d, format, hookScore);
    let note: string | undefined;
    for (const f of flags) {
      if (f.end <= t) {
        const effect = f.drop > 0 ? 1 - (f.drop / 100) * 0.35 : 1 + Math.abs(f.drop) / 100 / 2;
        r *= effect;
      }
      if (Math.round(f.end) === t) note = f.drop > 0 ? `Drop: ${f.category.replace(/_/g, " ")}` : "Re-engagement spike";
    }
    return { seconds: t, retention_pct: t === 0 ? 100 : clamp(r, 1, 100), timestamp: formatTimestamp(t), note };
  });

  const firstFlag = flags.filter((f) => f.drop > 0).sort((a, b) => a.start - b.start)[0];
  const critique =
    hookScore >= 70
      ? `Your opening gets to the point fast and gives viewers a reason to stay. ${firstFlag ? `Watch the leak around ${formatTimestamp(firstFlag.start)} — it undoes some of that momentum.` : "Keep the payoff promise alive through the middle."}`
      : `The first seconds ${pillars.speed_to_value < 14 ? "spend time on housekeeping instead of a payoff" : "don't open a strong enough curiosity gap"}, so casual viewers have no reason to stay. Lead with the most surprising result or the sharpest question about ${topic}.`;

  return normalizeAnalysis(
    {
      hook_score: hookScore,
      pillars,
      hook_critique: critique,
      retention_curve: curve,
      drop_off_flags: flags.map((f) => ({
        time_range: `${formatTimestamp(f.start)} - ${formatTimestamp(f.end)}`,
        start_seconds: f.start,
        flagged_text: f.text,
        drop_pct: f.drop,
        reason_category: f.category,
        reason_description: f.reason,
        recommended_fix: f.fix,
      })),
      hook_variants: buildHookVariants(topic, format),
    },
    { durationSeconds: d, format },
  );
}
