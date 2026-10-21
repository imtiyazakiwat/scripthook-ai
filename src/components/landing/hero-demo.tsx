"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TrendingDown, TrendingUp, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ScoreGauge } from "@/components/analytics/score-gauge";
import { cn } from "@/lib/utils";

const STATES = {
  before: {
    score: 28,
    end: 19,
    lines: [
      { t: "0:00", text: "Hey guys, welcome back to the channel!", tone: "high", tag: "−45%" },
      { t: "0:03", text: "Before we start, smash that like button.", tone: "high", tag: "−40%" },
      { t: "0:08", text: "So basically, today we’re talking about growth…", tone: "mid", tag: "−22%" },
      { t: "0:14", text: "But here’s the thing nobody tells you.", tone: "spike", tag: "+8%" },
    ],
    path: "M0 6 C 20 8, 30 60, 60 70 S 110 78, 150 80 S 200 74, 230 82 S 300 92, 360 96",
  },
  after: {
    score: 86,
    end: 47,
    lines: [
      { t: "0:00", text: "I lost $3,000 before I learned this one rule.", tone: "spike", tag: "+12%" },
      { t: "0:04", text: "Views don’t come from uploading more.", tone: "spike", tag: "+9%" },
      { t: "0:08", text: "They come from the first 30 seconds.", tone: "ok", tag: "" },
      { t: "0:12", text: "Here’s the 3-step ladder I use on every video.", tone: "ok", tag: "" },
    ],
    path: "M0 6 C 20 8, 30 18, 60 22 S 110 28, 150 32 S 200 36, 230 40 S 300 48, 360 52",
  },
} as const;

const TONE: Record<string, string> = {
  high: "decoration-leak-high bg-leak-high/10",
  mid: "decoration-leak-mid bg-leak-mid/10",
  spike: "decoration-spike bg-spike/10",
  ok: "decoration-transparent",
};
const TAG: Record<string, string> = { high: "text-leak-high", mid: "text-leak-mid", spike: "text-spike", ok: "" };

export function HeroDemo() {
  const [mode, setMode] = useState<"before" | "after">("before");
  useEffect(() => {
    const id = setInterval(() => setMode((m) => (m === "before" ? "after" : "before")), 4200);
    return () => clearInterval(id);
  }, []);
  const s = STATES[mode];

  return (
    <div className="relative">
      <div className="absolute -inset-8 -z-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgb(124_92_255/0.35),transparent_65%)] blur-2xl" />
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80 shadow-[0_50px_120px_-30px_rgb(0_0_0/0.9)] backdrop-blur-xl">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <div className="mx-auto flex rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5 text-[11px] font-medium">
            {(["before", "after"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn("relative rounded-md px-3 py-1 capitalize transition-colors", mode === m ? "text-white" : "text-ink-400")}
              >
                {mode === m && <motion.span layoutId="hero-mode" className="absolute inset-0 -z-10 rounded-md bg-white/10" />}
                {m === "before" ? "Before" : "After fixes"}
              </button>
            ))}
          </div>
          <span className="w-12" />
        </div>

        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          {/* script */}
          <div className="border-b border-white/[0.06] p-5 md:border-b-0 md:border-r">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-ink-500">Script · Long-form</p>
            <AnimatePresence mode="wait">
              <motion.ul
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="space-y-2.5"
              >
                {s.lines.map((l) => (
                  <li key={l.text} className="flex gap-3 text-[13.5px] leading-6">
                    <span className="pt-px font-mono text-[11px] text-ink-500">{l.t}</span>
                    <span className={cn("rounded px-1 underline decoration-2 underline-offset-4 text-ink-100", TONE[l.tone])}>
                      {l.text}
                      {l.tag && <sup className={cn("ml-1 font-mono text-[9px] font-semibold", TAG[l.tone])}>{l.tag}</sup>}
                    </span>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/[0.07] p-2.5 text-[12px] text-ink-200">
              <Wand2 className="size-3.5 shrink-0 text-brand-300" />
              {mode === "before" ? "3 leaks found · 8 hook rewrites ready" : "Leaks fixed · hook rewritten with ‘High-Stakes Story’"}
            </div>
          </div>

          {/* analytics */}
          <div className="p-5">
            <div className="flex items-center gap-4">
              <ScoreGauge score={s.score} size={112} stroke={9} label="Hook" />
              <div className="space-y-2 text-xs">
                <p className="flex items-center gap-1.5 text-ink-300">
                  {mode === "before" ? <TrendingDown className="size-3.5 text-leak-high" /> : <TrendingUp className="size-3.5 text-spike" />}
                  End retention
                </p>
                <p className={cn("font-mono text-2xl font-semibold", mode === "before" ? "text-leak-high" : "text-spike")}>{s.end}%</p>
                <p className="text-ink-500">{mode === "before" ? "Intro cliff at 0:03" : "+28 pts vs. original"}</p>
              </div>
            </div>
            <svg viewBox="0 0 360 110" className="mt-4 w-full" aria-hidden>
              <defs>
                <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="hero-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#c4b5ff" />
                  <stop offset="100%" stopColor="#ff7ab6" />
                </linearGradient>
              </defs>
              {[25, 50, 75].map((y) => (
                <line key={y} x1="0" x2="360" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
              ))}
              <motion.path animate={{ d: `${s.path} L360 110 L0 110Z` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} fill="url(#hero-fill)" />
              <motion.path animate={{ d: s.path }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} fill="none" stroke="url(#hero-stroke)" strokeWidth="2.5" strokeLinecap="round" />
              {mode === "before" && (
                <>
                  <circle cx="34" cy="40" r="4.5" fill="#ff4d6d" />
                  <circle cx="62" cy="70" r="4.5" fill="#ff4d6d" />
                  <circle cx="150" cy="80" r="4.5" fill="#ffb547" />
                  <circle cx="206" cy="75" r="4.5" fill="#2ee6a6" />
                </>
              )}
            </svg>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-500">
              <span>0:00</span>
              <span>2:00</span>
              <span>4:00</span>
              <span>6:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
