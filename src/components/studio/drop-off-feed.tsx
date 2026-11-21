"use client";

import { Check, Copy, Scissors, Sparkles, TrendingDown, TrendingUp, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DropOffFlag } from "@/lib/schema";
import { CATEGORY_LABEL, cn, copyText, SEVERITY_META, severityOf } from "@/lib/utils";

function FlagCard({
  flag,
  index,
  active,
  onSelect,
  onApplyFix,
  onMoreOptions,
  canLocate,
}: {
  flag: DropOffFlag;
  index: number;
  active: boolean;
  onSelect: (i: number) => void;
  onApplyFix: (i: number) => void;
  onMoreOptions: (i: number, mode: "fix" | "deslop") => void;
  canLocate: boolean;
}) {
  const sev = severityOf(flag);
  const meta = SEVERITY_META[sev];
  const spike = sev === "spike";
  const [copied, setCopied] = useState(false);
  // Gated reports (OPEN_ACCESS=false) replace paid fixes with a placeholder — never show it.
  const showFix = !!flag.recommended_fix && !flag.locked;

  return (
    <article
      id={`flag-${index}`}
      onClick={() => onSelect(index)}
      className={cn(
        "cursor-pointer rounded border bg-surface p-4 transition-colors",
        active ? "border-accent" : "border-border hover:border-border-hover",
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", meta.bg, meta.text)}>
          {spike ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
          {spike ? `+${Math.abs(flag.drop_pct)}%` : `−${flag.drop_pct}%`}
        </span>
        <span className="text-sm font-medium text-foreground">{meta.label}</span>
        <span className="text-zinc-300" aria-hidden>
          ·
        </span>
        <span className="text-sm text-muted">{CATEGORY_LABEL[flag.reason_category]}</span>
        <span className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted">{flag.time_range}</span>
      </header>

      <blockquote className="mt-3 border-l-2 pl-3 text-sm italic leading-6 text-foreground" style={{ borderColor: meta.color }}>
        {flag.flagged_text}
      </blockquote>
      {flag.reason_description && <p className="mt-2 text-sm leading-6 text-muted">{flag.reason_description}</p>}

      {showFix && (
        <div className="mt-3 rounded border border-border bg-background p-3">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-orange-600">{spike ? "Amplify it" : "Recommended fix"}</p>
          <p className="text-sm leading-6 text-foreground">{flag.recommended_fix}</p>
        </div>
      )}

      {showFix && !spike && (
        <footer className="mt-3 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="xs"
            variant="primary"
            onClick={() => onApplyFix(index)}
            disabled={!canLocate}
            title={canLocate ? "Replace this line in your script" : "Line not found in the current script"}
          >
            <Wand2 className="size-3.5" aria-hidden /> Fix this beat
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={async () => {
              if (await copyText(flag.recommended_fix)) {
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }
            }}
          >
            {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onMoreOptions(index, "fix")}>
            <Sparkles className="size-3.5" aria-hidden /> 3 more options
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onMoreOptions(index, "deslop")} title="Segment-level De-Slop rewrite">
            <Scissors className="size-3.5" aria-hidden /> De-Slop
          </Button>
        </footer>
      )}
    </article>
  );
}

export function DropOffFeed({
  flags,
  activeFlag,
  onSelect,
  onApplyFix,
  onMoreOptions,
  locatable,
}: {
  flags: DropOffFlag[];
  activeFlag: number | null;
  onSelect: (i: number) => void;
  onApplyFix: (i: number) => void;
  onMoreOptions: (i: number, mode: "fix" | "deslop") => void;
  locatable: boolean[];
}) {
  const [filter, setFilter] = useState<"all" | "drops" | "spikes">("all");
  useEffect(() => {
    if (activeFlag === null) return;
    // make sure the selected card is visible
    const f = flags[activeFlag];
    if (f && filter === "spikes" && f.drop_pct > 0) setFilter("all");
    if (f && filter === "drops" && f.drop_pct < 0) setFilter("all");
  }, [activeFlag, flags, filter]);

  const drops = flags.filter((f) => f.drop_pct > 0).length;
  const spikes = flags.length - drops;
  const list = flags
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => (filter === "all" ? true : filter === "drops" ? f.drop_pct > 0 : f.drop_pct < 0));

  if (!flags.length) {
    return (
      <div className="rounded border border-border bg-surface p-6 text-center text-sm text-muted">
        The AI didn’t flag any drop-offs or spikes in this script.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5" role="group" aria-label="Filter flags">
        {(
          [
            ["all", `All ${flags.length}`],
            ["drops", `Drops ${drops}`],
            ["spikes", `Spikes ${spikes}`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              filter === k
                ? "border-orange-200 bg-orange-50 text-orange-700"
                : "border-border text-muted hover:border-border-hover hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {list.map(({ f, i }) => (
        <FlagCard
          key={`${i}-${f.flagged_text.slice(0, 20)}`}
          flag={f}
          index={i}
          active={activeFlag === i}
          onSelect={onSelect}
          onApplyFix={onApplyFix}
          onMoreOptions={onMoreOptions}
          canLocate={locatable[i] ?? false}
        />
      ))}
    </div>
  );
}
