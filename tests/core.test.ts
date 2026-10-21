import { describe, expect, it } from "vitest";
import { gateAnalysis } from "@/lib/license";
import { extractJson, IncompleteReportError, normalizeAnalysis, type NormalizeContext } from "@/lib/normalize";
import { ScriptAnalysisSchema } from "@/lib/schema";
import {
  countWords,
  detectDirectorNotes,
  estimateSeconds,
  formatRuntime,
  formatTimestamp,
  locateQuote,
  parseTimestamp,
  splitBeats,
  stripDirectorNotes,
} from "@/lib/script";

const SCRIPT =
  "Hey guys, welcome back to the channel! Today we are gonna talk about growing on YouTube. [B-roll: drone shot] Make sure you smash that like button. (Sound effect: whoosh) But here's the thing nobody tells you: views come from the first 30 seconds. I lost $3,000 learning this.";

const CTX: NormalizeContext = { durationSeconds: 60, format: "youtube_longform" };

/** A complete, well-formed model response (test fixture — not shown to users). */
function modelReport(overrides: Record<string, unknown> = {}) {
  return {
    hook_score: 30,
    pillars: { curiosity_gap: 9, speed_to_value: 4, audience_clarity: 10, emotional_stakes: 7 },
    hook_critique: "Opens with a greeting.",
    predicted_end_retention: 35,
    retention_curve: [
      { seconds: 0, retention_pct: 100 },
      { seconds: 30, retention_pct: 55 },
      { seconds: 60, retention_pct: 35 },
    ],
    drop_off_flags: [
      { flagged_text: "Hey guys", drop_pct: 45, reason_category: "housekeeping_greeting", time_range: "0:00 - 0:03" },
      { flagged_text: "smash that like button", drop_pct: 30, reason_category: "weak_cta", time_range: "0:08 - 0:11" },
      { flagged_text: "Make sure you", drop_pct: 20, reason_category: "weak_cta", time_range: "0:07 - 0:08" },
      { flagged_text: "nobody tells you", drop_pct: -8, reason_category: "retention_spike", time_range: "0:12 - 0:15" },
    ],
    hook_variants: Array.from({ length: 8 }, (_, i) => ({ framework: `F${i}`, hook_text: `Hook ${i}`, why_it_works: "" })),
    ...overrides,
  };
}

describe("script utilities", () => {
  it("detects and strips director notes but keeps spoken parentheticals", () => {
    expect(detectDirectorNotes(SCRIPT).map((n) => n.text)).toEqual(["[B-roll: drone shot]", "(Sound effect: whoosh)"]);
    const clean = stripDirectorNotes(SCRIPT + " (trust me)");
    expect(clean).not.toContain("B-roll");
    expect(clean).not.toContain("whoosh");
    expect(clean).toContain("(trust me)");
  });

  it("estimates runtime from WPM", () => {
    expect(countWords("one two three's four-five")).toBe(4);
    expect(estimateSeconds(150, "youtube_longform", "normal")).toBe(60);
    expect(estimateSeconds(180, "youtube_longform", "fast")).toBe(60);
    expect(formatTimestamp(75)).toBe("1:15");
    expect(formatRuntime(135)).toBe("~2m 15s");
    expect(parseTimestamp("1:05")).toBe(65);
  });

  it("splits beats with monotonic timestamps and paragraphs", () => {
    const beats = splitBeats("First line here. Second one!\n\nNew paragraph?", 150);
    expect(beats.map((b) => b.text)).toEqual(["First line here.", "Second one!", "New paragraph?"]);
    expect(beats[2].paragraph).toBe(1);
    expect(beats[1].start).toBeCloseTo(beats[0].end);
  });

  it("locates quotes with punctuation/case drift", () => {
    const s = "Hey guys, welcome back — to the Channel!";
    expect(locateQuote(s, "hey guys welcome back to the channel")).not.toBeNull();
    expect(locateQuote(s, "totally different sentence here")).toBeNull();
  });
});

describe("LLM output normalisation", () => {
  it("repairs fenced/truncated/trailing-comma JSON", () => {
    expect(extractJson('```json\n{"a":1,}\n```')).toEqual({ a: 1 });
    expect(extractJson('{"a":[1,2')).toEqual({ a: [1, 2] });
  });

  it("coerces messy data into a schema-valid analysis", () => {
    const a = normalizeAnalysis(
      {
        hook_score: "130",
        predicted_end_retention: "41%",
        retention_curve: [
          { timestamp: "0:30", retention_pct: "60%" },
          { seconds: 10, retention_pct: 80 },
        ],
        drop_off_flags: [
          { flagged_text: "Hey guys", drop_pct: 45, reason_category: "Housekeeping Greeting", time_range: "0:00 - 0:03" },
          { flagged_text: "nice", drop_pct: 8, reason_category: "retention_spike", time_range: "0:12 - 0:15" },
          { drop_pct: 10 },
        ],
        hook_variants: [{ framework: "X", hook_text: "Hook" }, { hook_text: "" }],
      },
      CTX,
    );
    expect(ScriptAnalysisSchema.safeParse(a).success).toBe(true);
    expect(a.hook_score).toBe(100);
    expect(a.retention_curve[0]).toMatchObject({ seconds: 0, retention_pct: 100 });
    expect(a.retention_curve.at(-1)).toMatchObject({ seconds: 60, retention_pct: 41 });
    expect(a.predicted_end_retention).toBe(41);
    expect(a.drop_off_flags).toHaveLength(2);
    expect(a.drop_off_flags[0].reason_category).toBe("housekeeping_greeting");
    expect(a.drop_off_flags[1].drop_pct).toBe(-8);
    expect(a.hook_variants).toHaveLength(1);
  });

  it("never invents data the model didn't send", () => {
    const missing = (o: Record<string, unknown>) => () => normalizeAnalysis(modelReport(o), CTX);
    expect(missing({ hook_score: undefined, pillars: undefined })).toThrow(IncompleteReportError);
    expect(missing({ retention_curve: undefined })).toThrow(IncompleteReportError);
    expect(missing({ retention_curve: [{ seconds: 0, retention_pct: 100 }] })).toThrow(IncompleteReportError);
    expect(missing({ retention_curve: [{ seconds: 0, retention_pct: 100 }, { seconds: 20, retention_pct: 60 }], predicted_end_retention: undefined })).toThrow(
      IncompleteReportError,
    );
    expect(missing({ drop_off_flags: undefined })).toThrow(IncompleteReportError);
    expect(missing({ hook_variants: undefined })).toThrow(IncompleteReportError);

    // Score falls back only to the model's own pillar sum; partial pillars are dropped, not estimated.
    expect(normalizeAnalysis(modelReport({ hook_score: undefined }), CTX).hook_score).toBe(30);
    expect(normalizeAnalysis(modelReport({ pillars: { curiosity_gap: 9 } }), CTX).pillars).toBeUndefined();
    // Flags without a size, or with no timing and no match in the script, are skipped.
    const skipped = normalizeAnalysis(modelReport({ drop_off_flags: [{ flagged_text: "x" }, { flagged_text: "no timing", drop_pct: 20 }] }), CTX);
    expect(skipped.drop_off_flags).toHaveLength(0);
  });

  it("times untimed flags from the script's own beats", () => {
    const script = stripDirectorNotes(SCRIPT);
    const beats = splitBeats(script, 150);
    const a = normalizeAnalysis(modelReport({ drop_off_flags: [{ flagged_text: "smash that like button", drop_pct: 30 }] }), { ...CTX, script, beats });
    const beat = beats.find((b) => b.text.includes("smash that like button"))!;
    expect(a.drop_off_flags[0].start_seconds).toBe(Math.round(beat.start));
  });
});

describe("server-side gating (OPEN_ACCESS=false)", () => {
  it("gates paid content for free users", () => {
    const a = normalizeAnalysis(modelReport(), CTX);
    const g = gateAnalysis(a, "free");
    expect(g.hook_variants.filter((h) => h.locked)).toHaveLength(6);
    expect(g.drop_off_flags.filter((f) => f.drop_pct > 0 && !f.locked)).toHaveLength(1);
    const pro = gateAnalysis(a, "pro");
    expect(pro.hook_variants.some((h) => h.locked)).toBe(false);
  });
});
