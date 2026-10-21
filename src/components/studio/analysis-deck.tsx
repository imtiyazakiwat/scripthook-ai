"use client";

import { Activity, AlertTriangle, CheckCircle2, Cpu, Loader2, RotateCcw, ServerOff } from "lucide-react";
import { useMemo } from "react";
import { Pillars } from "@/components/analytics/pillars";
import { RetentionChart } from "@/components/analytics/retention-chart";
import { ScoreGauge } from "@/components/analytics/score-gauge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import type { AiStatus } from "@/hooks/use-ai-status";
import type { AnalyzeError, Progress } from "@/hooks/use-analyzer";
import { FORMAT_META } from "@/lib/plans";
import type { AnalysisResult } from "@/lib/schema";
import { formatRuntime } from "@/lib/script";
import { cn, scoreColor, SEVERITY_META } from "@/lib/utils";
import { DropOffFeed } from "./drop-off-feed";
import { HookVariants } from "./hook-variants";

export type DeckTab = "leaks" | "hooks";

const STAGES = [
  { key: "sanitizing", label: "Split the script into timed beats" },
  { key: "simulating", label: "AI estimates retention second by second" },
  { key: "scoring", label: "AI flags the drop-offs" },
  { key: "rewriting", label: "AI writes hook rewrites" },
  { key: "finalizing", label: "Build the report" },
];

const REPORT_CONTENTS = [
  ["Hook Score", "0–100, scored on four pillars: curiosity gap, speed to value, audience clarity and emotional stakes."],
  ["Retention curve", "The share of viewers the AI expects to still be watching at each second."],
  ["Drop-offs", "Each line that loses viewers, the estimated drop, why it happens, and a rewrite you can apply."],
  ["Hook rewrites", "New openers for this script across proven hook frameworks."],
] as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold uppercase text-orange-600">{children}</p>;
}

/** OpenReply stat card, white on the surrounding panel. */
function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded border border-border bg-background p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums text-foreground", tone)}>{value}</p>
    </div>
  );
}

function AiMissingNotice() {
  return (
    <div role="alert" className="flex items-start gap-3 rounded border border-error/30 bg-error/5 p-4 text-sm text-error">
      <ServerOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">AI analysis is unavailable</p>
        <p className="mt-1 leading-6">No AI provider is configured on this server (AI_API_KEY is missing), so scripts can’t be analyzed.</p>
      </div>
    </div>
  );
}

function EmptyState({ aiStatus }: { aiStatus: AiStatus }) {
  return (
    <div className="panel rounded p-6 sm:p-8">
      <Eyebrow>Retention report</Eyebrow>
      <h2 className="mt-3 max-w-md text-balance text-2xl font-black leading-tight text-foreground sm:text-3xl">Paste a script, then run Analyze</h2>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
        An AI model reads your script beat by beat at your speaking pace. Your report appears here when it finishes.
      </p>

      {aiStatus.state === "missing" && (
        <div className="mt-6">
          <AiMissingNotice />
        </div>
      )}

      <dl className="mt-6 grid gap-3 @xl:grid-cols-2">
        {REPORT_CONTENTS.map(([term, desc]) => (
          <div key={term} className="rounded border border-border bg-background p-4">
            <dt className="text-sm font-semibold text-foreground">{term}</dt>
            <dd className="mt-1 text-sm leading-6 text-muted">{desc}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-5 text-muted">
        Every number comes from the AI model. If it can’t be reached, you get an error that says why, not an estimate.
      </p>
    </div>
  );
}

function AnalyzingState({ progress }: { progress: Progress }) {
  const activeIdx = Math.max(0, STAGES.findIndex((s) => s.key === progress.stageKey));
  return (
    <div className="space-y-4 sm:space-y-6" aria-busy="true">
      <section className="panel rounded p-4 sm:p-6" aria-live="polite">
        {progress.retry && (
          <div className="mb-5 flex items-start gap-2 rounded border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Attempt {progress.retry.attempt - 1} failed: {progress.retry.reason}. Retrying with {progress.retry.model} (attempt {progress.retry.attempt} of{" "}
              {progress.retry.of}).
            </p>
          </div>
        )}
        <div className="flex flex-col items-center gap-6 @lg:flex-row @lg:items-start">
          <ScoreGauge score={progress.partialScore ?? null} pending={progress.partialScore === undefined} />
          <div className="w-full flex-1">
            <Eyebrow>Analyzing</Eyebrow>
            <div className="mt-3 h-2 w-full overflow-hidden rounded bg-border">
              <div className="h-full rounded bg-accent transition-[width] duration-300" style={{ width: `${progress.pct}%` }} />
            </div>
            <p className="mt-1.5 text-right font-mono text-xs text-muted">{progress.pct}%</p>
            <ol className="mt-2 space-y-2">
              {STAGES.map((s, i) => {
                const done = i < activeIdx;
                const active = i === activeIdx;
                return (
                  <li
                    key={s.key}
                    className={cn("flex items-center gap-2.5 text-sm", done ? "text-muted" : active ? "font-medium text-foreground" : "text-zinc-400")}
                  >
                    {done ? (
                      <CheckCircle2 className="size-4 text-success" aria-hidden />
                    ) : active ? (
                      <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
                    ) : (
                      <span className="grid size-4 place-items-center" aria-hidden>
                        <span className="size-1.5 rounded-full bg-zinc-300" />
                      </span>
                    )}
                    {active ? progress.stage || s.label : s.label}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
        {progress.partialCritique && (
          <p className="mt-5 rounded border border-border bg-background p-3.5 text-sm leading-6 text-foreground">{progress.partialCritique}</p>
        )}
      </section>
      <section className="panel rounded p-4 sm:p-6" aria-hidden>
        <div className="h-4 w-40 rounded bg-surface-hover" />
        <div className="mt-5 h-[220px] rounded bg-surface-hover/70" />
      </section>
    </div>
  );
}

function ErrorState({ error, onRetry, canRetry }: { error: AnalyzeError; onRetry: () => void; canRetry: boolean }) {
  const notConfigured = error.code === "ai_not_configured";
  return (
    <div className="panel rounded p-6 sm:p-8" role="alert">
      <div className="flex items-start gap-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-error/10 text-error">
          {notConfigured ? <ServerOff className="size-5" aria-hidden /> : <AlertTriangle className="size-5" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground">{notConfigured ? "AI analysis is unavailable" : "Analysis failed"}</h2>
          <p className="mt-1 text-sm leading-6 text-foreground">{error.message}</p>
          {error.details && error.details.length > 0 && (
            <ul className="mt-3 space-y-1.5 rounded border border-border bg-background p-3 font-mono text-xs leading-5 text-muted">
              {error.details.map((d, i) => (
                <li key={i}>
                  <span className="text-zinc-400">Attempt {i + 1}:</span> {d}
                </li>
              ))}
            </ul>
          )}
          {!notConfigured && <p className="mt-3 text-sm text-muted">Nothing was estimated or filled in. Your script is unchanged.</p>}
          {canRetry && !notConfigured && (
            <Button variant="secondary" className="mt-5" onClick={onRetry}>
              <RotateCcw className="size-4" aria-hidden /> Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AnalysisDeck({
  status,
  progress,
  result,
  error,
  aiStatus,
  tab,
  onTabChange,
  activeFlag,
  onSelectFlag,
  onApplyFix,
  onMoreOptions,
  onUseHook,
  onRetry,
  locatable,
  stale,
}: {
  status: "idle" | "analyzing" | "done" | "error";
  progress: Progress;
  result: AnalysisResult | null;
  error: AnalyzeError | null;
  aiStatus: AiStatus;
  tab: DeckTab;
  onTabChange: (t: DeckTab) => void;
  activeFlag: number | null;
  onSelectFlag: (i: number) => void;
  onApplyFix: (i: number) => void;
  onMoreOptions: (i: number, mode: "fix" | "deslop") => void;
  onUseHook: (text: string) => void;
  onRetry: () => void;
  locatable: boolean[];
  stale: boolean;
}) {
  const hookWindowRetention = useMemo(() => {
    if (!result) return null;
    const w = result.format === "youtube_longform" ? 30 : 3;
    const p = result.retention_curve.find((pt) => pt.seconds >= w) ?? result.retention_curve[result.retention_curve.length - 1];
    return p ? Math.round(p.retention_pct) : null;
  }, [result]);

  // The deck is a container: it renders full-width when stacked and half-width beside the editor.
  if (status === "analyzing")
    return (
      <div className="@container">
        <AnalyzingState progress={progress} />
      </div>
    );
  if (status === "error" && error) return <ErrorState error={error} onRetry={onRetry} canRetry={aiStatus.state !== "missing"} />;
  if (!result)
    return (
      <div className="@container">
        <EmptyState aiStatus={aiStatus} />
      </div>
    );

  const drops = result.drop_off_flags.filter((f) => f.drop_pct > 0);
  const hooks = result.hook_variants.filter((h) => !h.locked);
  const color = scoreColor(result.hook_score);
  const end = result.predicted_end_retention;

  return (
    <div className="@container space-y-4 sm:space-y-6">
      {stale && (
        <div className="flex items-center gap-2 rounded border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <Activity className="size-4 shrink-0" aria-hidden /> Script changed since this report. Re-analyze to update it.
        </div>
      )}

      {/* Hook score */}
      <section className="panel rounded p-4 sm:p-6" aria-label="Hook score">
        <div className="flex flex-col items-center gap-6 @lg:flex-row @lg:items-start">
          <ScoreGauge score={result.hook_score} />
          <div className="w-full flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {result.verdict && (
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color, background: `${color}1a` }}>
                  {result.verdict}
                </span>
              )}
              <span
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted"
                title="The AI model that wrote this report"
              >
                <Cpu className="size-3" aria-hidden />
                {result.model ?? "AI"}
                {result.depth === "deep" && " · Deep"}
              </span>
              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted">{FORMAT_META[result.format].label}</span>
            </div>
            {result.hook_critique && <p className="mt-3 text-sm leading-6 text-foreground">{result.hook_critique}</p>}
            {result.pillars && (
              <div className="mt-5">
                <Pillars pillars={result.pillars} />
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 @xl:grid-cols-4">
          <Stat label="Est. runtime" value={formatRuntime(result.estimated_duration_seconds).replace("~", "")} />
          <Stat
            label={result.format === "youtube_longform" ? "Watching at 0:30" : "Watching at 0:03"}
            value={hookWindowRetention === null ? "—" : `${hookWindowRetention}%`}
          />
          <Stat label="End retention" value={`${end}%`} tone={end >= 40 ? "text-success" : end >= 25 ? "text-warning" : "text-error"} />
          <Stat label="Leaks found" value={drops.length} tone={drops.length ? "text-error" : "text-success"} />
        </div>
        <p className="mt-4 text-xs text-muted">
          Runtime is calculated from your word count and pace. Every other number is the AI’s estimate, not real analytics.
        </p>
      </section>

      {/* Retention curve */}
      <section className="panel rounded p-4 sm:p-6" aria-label="Predicted retention curve">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-sm font-semibold text-foreground">Predicted retention</h2>
          <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted">
            {(["high", "moderate", "spike"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", SEVERITY_META[k].dot)} aria-hidden /> {SEVERITY_META[k].label}
              </span>
            ))}
          </div>
        </div>
        <RetentionChart result={result} activeFlag={activeFlag} onSelectFlag={onSelectFlag} />
      </section>

      {/* Leaks & hooks */}
      <section aria-label="Breakdown">
        <div className="border-b border-border">
          <Tabs
            ariaLabel="Breakdown view"
            idPrefix="deck"
            className="h-10"
            value={tab}
            onChange={onTabChange}
            options={[
              { value: "leaks", label: `Drop-offs (${result.drop_off_flags.length})` },
              { value: "hooks", label: `Hook rewrites (${hooks.length})` },
            ]}
          />
        </div>
        <div id="deck-panel" role="tabpanel" aria-labelledby={`deck-tab-${tab}`} className="pt-4">
          {tab === "leaks" ? (
            <DropOffFeed
              flags={result.drop_off_flags}
              activeFlag={activeFlag}
              onSelect={onSelectFlag}
              onApplyFix={onApplyFix}
              onMoreOptions={onMoreOptions}
              locatable={locatable}
            />
          ) : (
            <HookVariants hooks={hooks} onUse={onUseHook} />
          )}
        </div>
      </section>
    </div>
  );
}
