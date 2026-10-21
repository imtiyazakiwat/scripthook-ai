"use client";

import { motion } from "framer-motion";
import { Check, Copy, Lock, Quote, Scissors, Sparkles, TrendingDown, TrendingUp, Wand2 } from "lucide-react";
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
  onUpgrade,
  canLocate,
}: {
  flag: DropOffFlag;
  index: number;
  active: boolean;
  onSelect: (i: number) => void;
  onApplyFix: (i: number) => void;
  onMoreOptions: (i: number, mode: "fix" | "deslop") => void;
  onUpgrade: () => void;
  canLocate: boolean;
}) {
  const sev = severityOf(flag);
  const meta = SEVERITY_META[sev];
  const spike = sev === "spike";
  const [copied, setCopied] = useState(false);

  return (
    <motion.article
      id={`flag-${index}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
      onClick={() => onSelect(index)}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.035]",
        active ? "border-white/20 animate-[flash_1.2s_ease-out]" : "border-white/[0.07]",
      )}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: meta.color }} aria-hidden />
      <header className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.bg, meta.text)}>
          {spike ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
          {spike ? `+${Math.abs(flag.drop_pct)}%` : `−${flag.drop_pct}%`}
        </span>
        <span className="text-[12px] font-medium text-ink-100">{meta.label}</span>
        <span className="text-ink-600">·</span>
        <span className="text-[12px] text-ink-400">{CATEGORY_LABEL[flag.reason_category]}</span>
        <span className="ml-auto rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[11px] text-ink-300">{flag.time_range}</span>
      </header>

      <blockquote className="mt-3 flex gap-2 text-[14px] leading-relaxed text-ink-100">
        <Quote className="mt-1 size-3.5 shrink-0 text-ink-500" aria-hidden />
        <span className="italic">{flag.flagged_text}</span>
      </blockquote>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-300">{flag.reason_description}</p>

      {flag.recommended_fix && (
        <div className={cn("mt-3 rounded-xl border p-3", spike ? "border-spike/15 bg-spike/[0.04]" : "border-brand-500/20 bg-brand-500/[0.06]")}>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-300">
            <Sparkles className="size-3" aria-hidden /> {spike ? "Amplify it" : "Recommended fix"}
          </p>
          {flag.locked ? (
            <div className="relative">
              <p className="select-none text-[14px] leading-relaxed text-ink-200 blur-[5px]" aria-hidden>
                Most people get this completely wrong — and it’s costing them views. Here’s the fix in 20 seconds.
              </p>
              <div className="absolute inset-0 grid place-items-center">
                <Button
                  size="xs"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpgrade();
                  }}
                >
                  <Lock className="size-3" aria-hidden /> Unlock 1-click fixes
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-[14px] leading-relaxed text-white">{flag.recommended_fix}</p>
          )}
        </div>
      )}

      {!flag.locked && !spike && (
        <footer className="mt-3 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="xs" variant="primary" onClick={() => onApplyFix(index)} disabled={!canLocate} title={canLocate ? "Replace this line in your script" : "Line not found in the current script"}>
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
            {copied ? <Check className="size-3.5 text-spike" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onMoreOptions(index, "fix")}>
            <Sparkles className="size-3.5" aria-hidden /> 3 more options
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onMoreOptions(index, "deslop")} title="Segment-level De-Slop rewrite (Pro)">
            <Scissors className="size-3.5" aria-hidden /> De-Slop
          </Button>
        </footer>
      )}
    </motion.article>
  );
}

export function DropOffFeed({
  flags,
  activeFlag,
  onSelect,
  onApplyFix,
  onMoreOptions,
  onUpgrade,
  locatable,
}: {
  flags: DropOffFlag[];
  activeFlag: number | null;
  onSelect: (i: number) => void;
  onApplyFix: (i: number) => void;
  onMoreOptions: (i: number, mode: "fix" | "deslop") => void;
  onUpgrade: () => void;
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
      <div className="rounded-2xl border border-spike/20 bg-spike/5 p-6 text-center text-sm text-spike">
        No major leaks detected — this script holds attention well.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs" role="tablist" aria-label="Filter flags">
        {(
          [
            ["all", `All ${flags.length}`],
            ["drops", `Drops ${drops}`],
            ["spikes", `Spikes ${spikes}`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={filter === k}
            onClick={() => setFilter(k)}
            className={cn(
              "rounded-full border px-2.5 py-1 font-medium transition",
              filter === k ? "border-white/15 bg-white/10 text-white" : "border-transparent text-ink-400 hover:text-ink-200",
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
          onUpgrade={onUpgrade}
          canLocate={locatable[i] ?? false}
        />
      ))}
    </div>
  );
}
