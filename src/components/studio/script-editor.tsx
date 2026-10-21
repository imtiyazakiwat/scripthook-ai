"use client";

import { Command, CornerDownLeft, Eye, Gauge, MonitorPlay, PenLine, Scissors, Trash2, Wand2, Zap } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Segmented } from "@/components/ui/segmented";
import { Tabs } from "@/components/ui/tabs";
import { MAX_SCRIPT_CHARS, MIN_SCRIPT_WORDS, type AnalysisResult, type ScriptFormat, type SpeakingPace } from "@/lib/schema";
import { detectDirectorNotes, formatRuntime, getScriptStats, locateQuote } from "@/lib/script";
import { cn, SEVERITY_META, severityOf } from "@/lib/utils";

export type EditorTab = "write" | "annotated";

interface Range {
  start: number;
  end: number;
  kind: "flag" | "note";
  index?: number;
}

function AnnotatedScript({
  text,
  result,
  strip,
  activeFlag,
  onFlagClick,
}: {
  text: string;
  result: AnalysisResult | null;
  strip: boolean;
  activeFlag: number | null;
  onFlagClick: (i: number) => void;
}) {
  const ranges = useMemo(() => {
    const out: Range[] = [];
    result?.drop_off_flags.forEach((f, i) => {
      const loc = locateQuote(text, f.flagged_text);
      if (loc) out.push({ start: loc[0], end: loc[1], kind: "flag", index: i });
    });
    if (strip) detectDirectorNotes(text).forEach((n) => out.push({ start: n.index, end: n.index + n.text.length, kind: "note" }));
    out.sort((a, b) => a.start - b.start);
    const clean: Range[] = [];
    for (const r of out) if (!clean.length || r.start >= clean[clean.length - 1].end) clean.push(r);
    return clean;
  }, [text, result, strip]);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((r, k) => {
    if (r.start > cursor) nodes.push(<span key={`t${k}`}>{text.slice(cursor, r.start)}</span>);
    const chunk = text.slice(r.start, r.end);
    if (r.kind === "note") {
      nodes.push(
        <span key={`n${k}`} className="rounded-sm bg-surface-hover px-0.5 text-zinc-400 line-through" title="Director note — not spoken, excluded from timing">
          {chunk}
        </span>,
      );
    } else {
      const f = result!.drop_off_flags[r.index!];
      const meta = SEVERITY_META[severityOf(f)];
      const active = activeFlag === r.index;
      nodes.push(
        <mark
          key={`f${k}`}
          role="button"
          tabIndex={0}
          onClick={() => onFlagClick(r.index!)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onFlagClick(r.index!)}
          title={`${meta.label} · ${f.time_range}`}
          className="cursor-pointer rounded-sm px-0.5 text-inherit underline decoration-2 underline-offset-[5px]"
          style={{
            textDecorationColor: meta.color,
            backgroundColor: `${meta.color}${active ? "2e" : "17"}`,
            boxShadow: active ? `0 0 0 2px ${meta.color}66` : undefined,
          }}
        >
          {chunk}
          <sup className="ml-0.5 font-mono text-[9px] font-semibold" style={{ color: meta.color }}>
            {f.drop_pct > 0 ? `−${f.drop_pct}%` : `+${Math.abs(f.drop_pct)}%`}
          </sup>
        </mark>,
      );
    }
    cursor = r.end;
  });
  if (cursor < text.length) nodes.push(<span key="tail">{text.slice(cursor)}</span>);

  return (
    <div className="h-full overflow-y-auto whitespace-pre-wrap break-words px-5 py-4 text-[15px] leading-7 text-foreground sm:px-6">
      {text ? nodes : <span className="text-zinc-400">Nothing to annotate yet.</span>}
      {result && ranges.filter((r) => r.kind === "flag").length < result.drop_off_flags.length && (
        <p className="mt-6 border-t border-border pt-3 text-xs text-muted">
          Some flagged lines were edited since the last analysis and can’t be highlighted. Re-analyze to refresh.
        </p>
      )}
    </div>
  );
}

export function ScriptEditor({
  value,
  onChange,
  format,
  pace,
  onPaceChange,
  strip,
  onStripChange,
  depth,
  onDepthChange,
  tab,
  onTabChange,
  result,
  activeFlag,
  onFlagClick,
  onAnalyze,
  analyzing,
  onCancel,
  onOpenTeleprompter,
  onSelectionRewrite,
  textareaRef,
  unavailableReason,
}: {
  value: string;
  onChange: (v: string) => void;
  format: ScriptFormat;
  pace: SpeakingPace;
  onPaceChange: (p: SpeakingPace) => void;
  strip: boolean;
  onStripChange: (v: boolean) => void;
  depth: "fast" | "deep";
  onDepthChange: (d: "fast" | "deep") => void;
  tab: EditorTab;
  onTabChange: (t: EditorTab) => void;
  result: AnalysisResult | null;
  activeFlag: number | null;
  onFlagClick: (i: number) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  onCancel: () => void;
  onOpenTeleprompter: () => void;
  onSelectionRewrite: (mode: "fix" | "deslop", start: number, end: number) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Set when analysis can't run at all (e.g. no AI provider configured). */
  unavailableReason?: string;
}) {
  const stats = useMemo(() => getScriptStats(value, format, pace, strip), [value, format, pace, strip]);
  const [sel, setSel] = useState<{ start: number; end: number } | null>(null);
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const over = stats.chars > MAX_SCRIPT_CHARS;
  const tooShort = stats.words < MIN_SCRIPT_WORDS;
  const leakCount = result ? result.drop_off_flags.filter((f) => f.drop_pct > 0).length : 0;

  const trackSelection = () => {
    const el = localRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    setSel(e - s >= 12 ? { start: s, end: e } : null);
  };

  return (
    <div className="flex h-full min-h-[440px] flex-col overflow-hidden rounded border border-border bg-background transition-colors focus-within:border-accent/40">
      {/* header */}
      <div className="flex h-12 shrink-0 items-stretch justify-between gap-2 border-b border-border bg-surface px-3 sm:px-4">
        <Tabs
          ariaLabel="Editor view"
          idPrefix="editor"
          value={tab}
          onChange={onTabChange}
          options={[
            { value: "write", label: "Write", icon: <PenLine className="size-3.5" aria-hidden /> },
            {
              value: "annotated",
              label: (
                <span className="flex items-center gap-1.5">
                  Annotated
                  {leakCount > 0 && (
                    <span className="rounded-full bg-error/10 px-1.5 font-mono text-[10px] font-semibold leading-4 text-error">{leakCount}</span>
                  )}
                </span>
              ),
              icon: <Eye className="size-3.5" aria-hidden />,
            },
          ]}
        />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onOpenTeleprompter} disabled={!value.trim()} title="Teleprompter view">
            <MonitorPlay className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Teleprompter</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("");
              onTabChange("write");
              localRef.current?.focus();
            }}
            disabled={!value}
            aria-label="Clear script"
            title="Clear script"
            className="px-2"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      {/* body */}
      <div id="editor-panel" role="tabpanel" aria-labelledby={`editor-tab-${tab}`} className="relative min-h-0 flex-1">
        {tab === "write" ? (
          <textarea
            ref={(el) => {
              localRef.current = el;
              textareaRef.current = el;
            }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onSelect={trackSelection}
            onBlur={() => setTimeout(() => setSel(null), 150)}
            spellCheck
            aria-label="Script"
            placeholder={`Paste or write your spoken script here…\n\nTip: director notes like [B-roll: drone shot] or (SFX: whoosh) are auto-detected and excluded from timing.`}
            className="absolute inset-0 h-full w-full resize-none bg-background px-5 py-4 text-[15px] leading-7 text-foreground placeholder:text-zinc-400 focus:outline-none sm:px-6"
          />
        ) : (
          <AnnotatedScript text={value} result={result} strip={strip} activeFlag={activeFlag} onFlagClick={onFlagClick} />
        )}

        {sel && tab === "write" && (
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2 rounded border border-border bg-background p-2 pl-3 shadow-lg">
            <span className="mr-auto truncate text-xs text-muted">
              <span className="font-mono font-semibold text-foreground">{sel.end - sel.start}</span> chars selected
            </span>
            <Button size="xs" variant="secondary" onMouseDown={(e) => e.preventDefault()} onClick={() => onSelectionRewrite("fix", sel.start, sel.end)}>
              <Wand2 className="size-3.5 text-accent" aria-hidden /> Rewrite for retention
            </Button>
            <Button size="xs" variant="secondary" onMouseDown={(e) => e.preventDefault()} onClick={() => onSelectionRewrite("deslop", sel.start, sel.end)}>
              <Scissors className="size-3.5 text-accent" aria-hidden /> De-Slop
            </Button>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="shrink-0 space-y-3 border-t border-border bg-surface px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="font-mono tabular-nums text-muted" aria-live="polite">
            <span className="font-semibold text-foreground">{stats.words.toLocaleString()}</span> words <span className="text-zinc-300">•</span>{" "}
            <span className="font-semibold text-foreground">{formatRuntime(stats.seconds)}</span> <span className="text-zinc-300">•</span> {stats.wpm} WPM
          </span>
          <span className={cn("font-mono tabular-nums", over ? "font-semibold text-error" : "text-zinc-400")}>
            {stats.chars.toLocaleString()} / {MAX_SCRIPT_CHARS.toLocaleString()}
          </span>
          {unavailableReason && <span className="font-medium text-error">{unavailableReason}</span>}
          {stats.notes > 0 && (
            <label className="flex cursor-pointer items-center gap-2 text-muted">
              <input type="checkbox" checked={strip} onChange={(e) => onStripChange(e.target.checked)} className="peer sr-only" />
              <span className="relative h-4 w-7 shrink-0 rounded-full bg-zinc-300 transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:left-0.5 after:top-0.5 after:size-3 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-3" />
              Strip {stats.notes} director note{stats.notes > 1 ? "s" : ""}
            </label>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            ariaLabel="Speaking pace"
            size="sm"
            value={pace}
            onChange={onPaceChange}
            options={[
              { value: "slow", label: "Slow" },
              { value: "normal", label: "Normal" },
              { value: "fast", label: "Fast" },
            ]}
          />
          <Segmented
            ariaLabel="Analysis depth"
            size="sm"
            value={depth}
            onChange={onDepthChange}
            options={[
              { value: "fast", label: "Fast", icon: <Zap className="size-3" aria-hidden />, title: "~8s — fast model" },
              { value: "deep", label: "Deep", icon: <Gauge className="size-3" aria-hidden />, title: "~20s — higher-quality model" },
            ]}
          />
          <div className="ml-auto flex items-center gap-2">
            {analyzing && (
              <Button variant="ghost" size="md" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={onAnalyze}
              loading={analyzing}
              disabled={!!unavailableReason || over || (tooShort && !analyzing)}
              title={unavailableReason ?? (tooShort ? `Add at least ${MIN_SCRIPT_WORDS} words` : undefined)}
            >
              {analyzing ? "Analyzing…" : "Analyze script"}
              {!analyzing && (
                <span className="ml-1 hidden items-center gap-0.5 sm:inline-flex">
                  <Kbd className="border-white/30 bg-white/15 text-white">
                    <Command className="size-2.5" aria-label="Cmd or Ctrl" />
                  </Kbd>
                  <Kbd className="border-white/30 bg-white/15 text-white">
                    <CornerDownLeft className="size-2.5" aria-label="Enter" />
                  </Kbd>
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
