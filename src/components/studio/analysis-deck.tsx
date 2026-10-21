"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, Cpu, Loader2, RotateCcw, Sparkles, Timer, TrendingDown, Users } from "lucide-react";
import { useMemo } from "react";
import { Pillars } from "@/components/analytics/pillars";
import { RetentionChart } from "@/components/analytics/retention-chart";
import { ScoreGauge } from "@/components/analytics/score-gauge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import type { AnalyzeError, Progress } from "@/hooks/use-analyzer";
import { FORMAT_META } from "@/lib/plans";
import { SAMPLE_SCRIPTS, type SampleScript } from "@/lib/samples";
import type { AnalysisResult } from "@/lib/schema";
import { formatRuntime } from "@/lib/script";
import { cn, scoreColor, SEVERITY_META } from "@/lib/utils";
import { DropOffFeed } from "./drop-off-feed";
import { HookVariants } from "./hook-variants";

export type DeckTab = "leaks" | "hooks";

const STAGES = [
  { key: "sanitizing", label: "Calibrating pacing & beats" },
  { key: "simulating", label: "Simulating audience second-by-second" },
  { key: "scoring", label: "Flagging leaky beats" },
  { key: "rewriting", label: "Writing 8 viral hook variants" },
  { key: "finalizing", label: "Rendering your retention report" },
];

function Stat({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400">
        <Icon className="size-3.5" aria-hidden /> {label}
      </p>
      <p className={cn("mt-1 font-mono text-lg font-semibold tabular-nums text-white", tone)}>{value}</p>
    </div>
  );
}

function EmptyState({ onLoadSample }: { onLoadSample: (s: SampleScript) => void }) {
  return (
    <div className="card relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/25 bg-brand-500/10 px-2.5 py-1 text-[11px] font-medium text-brand-300">
          <Sparkles className="size-3" aria-hidden /> Retention Analytics Deck
        </span>
        <h2 className="mt-4 max-w-md text-2xl font-semibold tracking-tight text-white sm:text-[28px] sm:leading-tight">
          See your retention curve <span className="text-gradient">before</span> you film a single frame.
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-300">
          Paste a script on the left and hit Analyze. You’ll get a Hook Score, a simulated audience curve, the exact lines that leak viewers, and 8 rewritten hooks.
        </p>

        {/* ghost chart */}
        <svg viewBox="0 0 400 120" className="mt-6 w-full" aria-hidden>
          <defs>
            <linearGradient id="ghost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0 8 C 30 10, 40 52, 80 58 S 140 62, 170 64 S 210 54, 240 66 S 320 78, 400 84"
            fill="none"
            stroke="#9a83ff"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
          <path d="M0 8 C 30 10, 40 52, 80 58 S 140 62, 170 64 S 210 54, 240 66 S 320 78, 400 84 L400 120 L0 120Z" fill="url(#ghost)" />
          <circle cx="62" cy="47" r="5" fill="#ff4d6d" />
          <circle cx="210" cy="58" r="5" fill="#2ee6a6" />
          <circle cx="300" cy="74" r="5" fill="#ffb547" />
        </svg>

        <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
          {SAMPLE_SCRIPTS.map((s) => (
            <button
              key={s.id}
              onClick={() => onLoadSample(s)}
              className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-left transition hover:border-brand-400/30 hover:bg-brand-500/[0.06]"
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{FORMAT_META[s.format].short}</p>
              <p className="mt-1 text-[13px] font-medium leading-snug text-ink-100 group-hover:text-white">{s.title}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-500">Try a sample — each one has deliberate leaks to find.</p>
      </div>
    </div>
  );
}

function AnalyzingState({ progress }: { progress: Progress }) {
  const activeIdx = Math.max(0, STAGES.findIndex((s) => s.key === progress.stageKey));
  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreGauge score={progress.partialScore ?? null} pending={progress.partialScore === undefined} />
          <div className="w-full flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-brand-300">Simulating your audience</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,#7c5cff,#ff4f9a)]"
                animate={{ width: `${progress.pct}%` }}
                transition={{ ease: "easeOut", duration: 0.4 }}
              />
            </div>
            <ol className="mt-4 space-y-2">
              {STAGES.map((s, i) => {
                const done = i < activeIdx;
                const active = i === activeIdx;
                return (
                  <li key={s.key} className={cn("flex items-center gap-2.5 text-[13px]", done ? "text-ink-300" : active ? "text-white" : "text-ink-500")}>
                    {done ? (
                      <CheckCircle2 className="size-4 text-spike" aria-hidden />
                    ) : active ? (
                      <Loader2 className="size-4 animate-spin text-brand-300" aria-hidden />
                    ) : (
                      <span className="grid size-4 place-items-center">
                        <span className="size-1.5 rounded-full bg-ink-600" />
                      </span>
                    )}
                    {active ? progress.stage || s.label : s.label}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
        <AnimatePresence>
          {progress.partialCritique && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-[13.5px] leading-relaxed text-ink-200"
            >
              {progress.partialCritique}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="card p-5">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="relative mt-5 h-[220px] overflow-hidden rounded-xl bg-white/[0.02]">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgb(124_92_255/0.18),transparent)]"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
          />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry, onUpgrade }: { error: AnalyzeError; onRetry: () => void; onUpgrade: () => void }) {
  const gated = error.status === 429 || error.status === 403;
  return (
    <div className="card p-8 text-center">
      <div className={cn("mx-auto grid size-12 place-items-center rounded-2xl", gated ? "bg-brand-500/15 text-brand-300" : "bg-leak-high/15 text-leak-high")}>
        {gated ? <Sparkles className="size-5" aria-hidden /> : <AlertTriangle className="size-5" aria-hidden />}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{gated ? "Unlock more analyses" : "Analysis failed"}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-300">{error.message}</p>
      <div className="mt-5 flex justify-center gap-2">
        {gated ? (
          <Button variant="primary" onClick={onUpgrade}>
            See plans
          </Button>
        ) : (
          <Button variant="secondary" onClick={onRetry}>
            <RotateCcw className="size-4" aria-hidden /> Try again
          </Button>
        )}
      </div>
    </div>
  );
}

export function AnalysisDeck({
  status,
  progress,
  result,
  error,
  tab,
  onTabChange,
  activeFlag,
  onSelectFlag,
  onApplyFix,
  onMoreOptions,
  onUseHook,
  onUpgrade,
  onRetry,
  onLoadSample,
  locatable,
  stale,
}: {
  status: "idle" | "analyzing" | "done" | "error";
  progress: Progress;
  result: AnalysisResult | null;
  error: AnalyzeError | null;
  tab: DeckTab;
  onTabChange: (t: DeckTab) => void;
  activeFlag: number | null;
  onSelectFlag: (i: number) => void;
  onApplyFix: (i: number) => void;
  onMoreOptions: (i: number, mode: "fix" | "deslop") => void;
  onUseHook: (text: string) => void;
  onUpgrade: () => void;
  onRetry: () => void;
  onLoadSample: (s: SampleScript) => void;
  locatable: boolean[];
  stale: boolean;
}) {
  const hookWindowRetention = useMemo(() => {
    if (!result) return null;
    const w = result.format === "youtube_longform" ? 30 : 3;
    const p = result.retention_curve.find((pt) => pt.seconds >= w) ?? result.retention_curve[result.retention_curve.length - 1];
    return Math.round(p.retention_pct);
  }, [result]);

  if (status === "analyzing") return <AnalyzingState progress={progress} />;
  if (status === "error" && error) return <ErrorState error={error} onRetry={onRetry} onUpgrade={onUpgrade} />;
  if (!result) return <EmptyState onLoadSample={onLoadSample} />;

  const drops = result.drop_off_flags.filter((f) => f.drop_pct > 0);
  const color = scoreColor(result.hook_score);

  return (
    <div className="space-y-4">
      {stale && (
        <div className="flex items-center gap-2 rounded-xl border border-leak-mid/20 bg-leak-mid/[0.07] px-3 py-2 text-xs text-leak-mid">
          <Activity className="size-3.5" aria-hidden /> Script changed since this report — re-analyze to update the curve.
        </div>
      )}
      {/* Hook score */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5 sm:p-6" aria-label="Hook score">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreGauge score={result.hook_score} />
          <div className="w-full flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color, background: `${color}1f` }}>
                {result.hook_score}/100 • {result.verdict}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.07] px-2 py-0.5 text-[11px] text-ink-400" title={result.model ?? "Offline heuristic engine"}>
                <Cpu className="size-3" aria-hidden />
                {result.source === "ai" ? (result.depth === "deep" ? "Deep AI" : "AI") : "Offline engine"}
              </span>
              <span className="rounded-full border border-white/[0.07] px-2 py-0.5 text-[11px] text-ink-400">{FORMAT_META[result.format].label}</span>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-100">{result.hook_critique}</p>
            {result.pillars && (
              <div className="mt-4">
                <Pillars pillars={result.pillars} />
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Stat icon={Timer} label="Est. runtime" value={formatRuntime(result.estimated_duration_seconds).replace("~", "")} />
          <Stat icon={Users} label={result.format === "youtube_longform" ? "Still watching @ 0:30" : "Still watching @ 0:03"} value={`${hookWindowRetention}%`} />
          <Stat icon={Activity} label="End retention" value={`${result.predicted_end_retention}%`} tone={result.predicted_end_retention >= 40 ? "text-spike" : result.predicted_end_retention >= 25 ? "text-leak-mid" : "text-leak-high"} />
          <Stat icon={TrendingDown} label="Leaks found" value={drops.length} tone={drops.length ? "text-leak-high" : "text-spike"} />
        </div>
      </motion.section>

      {/* Retention curve */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="card p-4 sm:p-5"
        aria-label="Predicted retention curve"
      >
        <header className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
          <h3 className="text-sm font-semibold text-white">Predicted retention</h3>
          <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] text-ink-400">
            {(["high", "moderate", "spike"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", SEVERITY_META[k].dot)} /> {SEVERITY_META[k].label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-px w-3 border-t border-dashed border-white/40" /> Niche benchmark
            </span>
          </div>
        </header>
        <RetentionChart result={result} activeFlag={activeFlag} onSelectFlag={onSelectFlag} />
      </motion.section>

      {/* Leaks & hooks */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} aria-label="Breakdown">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Segmented
            ariaLabel="Breakdown view"
            value={tab}
            onChange={onTabChange}
            options={[
              { value: "leaks", label: `Drop-off breakdown (${result.drop_off_flags.length})` },
              { value: "hooks", label: `Hook rewrites (${result.hook_variants.length})` },
            ]}
          />
        </div>
        {tab === "leaks" ? (
          <DropOffFeed
            flags={result.drop_off_flags}
            activeFlag={activeFlag}
            onSelect={onSelectFlag}
            onApplyFix={onApplyFix}
            onMoreOptions={onMoreOptions}
            onUpgrade={onUpgrade}
            locatable={locatable}
          />
        ) : (
          <HookVariants hooks={result.hook_variants} onUse={onUseHook} onUpgrade={onUpgrade} />
        )}
      </motion.section>
    </div>
  );
}
