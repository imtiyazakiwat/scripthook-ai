import { describe, expect, it } from "vitest";
import { heuristicAnalysis } from "@/lib/heuristics";
import { gateAnalysis } from "@/lib/license";
import { extractJson, normalizeAnalysis } from "@/lib/normalize";
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
        retention_curve: [
          { timestamp: "0:30", retention_pct: "60%" },
          { seconds: 10, retention_pct: 80 },
        ],
        drop_off_flags: [
          { flagged_text: "Hey guys", drop_pct: 45, reason_category: "Housekeeping Greeting", time_range: "0:00 - 0:03" },
          { flagged_text: "nice", drop_pct: 8, reason_category: "retention_spike" },
          { drop_pct: 10 },
        ],
        hook_variants: [{ framework: "X", hook_text: "Hook" }, { hook_text: "" }],
      },
      { durationSeconds: 60, format: "youtube_longform" },
    );
    expect(ScriptAnalysisSchema.safeParse(a).success).toBe(true);
    expect(a.hook_score).toBe(100);
    expect(a.retention_curve[0]).toMatchObject({ seconds: 0, retention_pct: 100 });
    expect(a.retention_curve.at(-1)!.seconds).toBe(60);
    expect(a.predicted_end_retention).toBe(Math.round(a.retention_curve.at(-1)!.retention_pct));
    expect(a.drop_off_flags).toHaveLength(2);
    expect(a.drop_off_flags[0].reason_category).toBe("housekeeping_greeting");
    expect(a.drop_off_flags[1].drop_pct).toBe(-8);
    expect(a.hook_variants).toHaveLength(1);
  });
});

describe("offline heuristic engine", () => {
  const clean = stripDirectorNotes(SCRIPT);
  const a = heuristicAnalysis(clean, "youtube_longform", 150, estimateSeconds(countWords(clean), "youtube_longform", "normal"));

  it("flags greetings & early CTAs and finds spikes", () => {
    const cats = a.drop_off_flags.map((f) => f.reason_category);
    expect(cats).toContain("housekeeping_greeting");
    expect(cats).toContain("weak_cta");
    expect(cats).toContain("retention_spike");
    expect(a.hook_variants).toHaveLength(8);
    expect(a.hook_score).toBeLessThan(60);
    for (const f of a.drop_off_flags) expect(locateQuote(clean, f.flagged_text)).not.toBeNull();
  });

  it("gates paid content server-side for free users", () => {
    const g = gateAnalysis(a, "free");
    expect(g.hook_variants.filter((h) => h.locked)).toHaveLength(6);
    expect(g.drop_off_flags.filter((f) => f.drop_pct > 0 && !f.locked)).toHaveLength(1);
    const pro = gateAnalysis(a, "pro");
    expect(pro.hook_variants.some((h) => h.locked)).toBe(false);
  });
});
