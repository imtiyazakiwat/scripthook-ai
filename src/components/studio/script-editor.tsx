"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, Command, CornerDownLeft, Eye, FileText, Gauge, MonitorPlay, PenLine, Scissors, Trash2, Wand2, Zap } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Segmented } from "@/components/ui/segmented";
import { FORMAT_META } from "@/lib/plans";
import { SAMPLE_SCRIPTS, type SampleScript } from "@/lib/samples";
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
        <span key={`n${k}`} className="rounded bg-white/[0.04] px-0.5 text-ink-500 line-through decoration-ink-500/60" title="Director note — not spoken, excluded from timing">
          {chunk}
        </span>,
      );
    } else {
      const f = result!.drop_off_flags[r.index!];
      const sev = severityOf(f);
      const meta = SEVERITY_META[sev];
      const active = activeFlag === r.index;
      nodes.push(
        <mark
          key={`f${k}`}
          role="button"
          tabIndex={0}
          onClick={() => onFlagClick(r.index!)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onFlagClick(r.index!)}
          title={`${meta.label} · ${f.time_range}`}
          className={cn(
            "cursor-pointer rounded-[5px] bg-transparent px-0.5 text-inherit underline decoration-2 underline-offset-[5px] transition-all",
            active && "ring-2",
            meta.ring,
          )}
          style={{
            textDecorationColor: meta.color,
            backgroundColor: `${meta.color}${active ? "33" : "1a"}`,
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
    <div className="h-full overflow-y-auto px-5 py-4 text-[15px] leading-7 whitespace-pre-wrap break-words text-ink-100 sm:px-6">
      {text ? nodes : <span className="text-ink-500">Nothing to annotate yet.</span>}
      {result && ranges.filter((r) => r.kind === "flag").length < result.drop_off_flags.length && (
        <p className="mt-6 border-t border-white/5 pt-3 text-xs text-ink-500">
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
  canDeep,
  tab,
  onTabChange,
  result,
  activeFlag,
  onFlagClick,
  onAnalyze,
  analyzing,
  onCancel,
  onLoadSample,
  onOpenTeleprompter,
  onSelectionRewrite,
  textareaRef,
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
  canDeep: boolean;
  tab: EditorTab;
  onTabChange: (t: EditorTab) => void;
  result: AnalysisResult | null;
  activeFlag: number | null;
  onFlagClick: (i: number) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  onCancel: () => void;
  onLoadSample: (s: SampleScript) => void;
  onOpenTeleprompter: () => void;
  onSelectionRewrite: (mode: "fix" | "deslop", start: number, end: number) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const stats = useMemo(() => getScriptStats(value, format, pace, strip), [value, format, pace, strip]);
  const [sel, setSel] = useState<{ start: number; end: number } | null>(null);
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const over = stats.chars > MAX_SCRIPT_CHARS;
  const tooShort = stats.words < MIN_SCRIPT_WORDS;

  const trackSelection = () => {
    const el = localRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    setSel(e - s >= 12 ? { start: s, end: e } : null);
  };

  return (
    <div className="card flex h-full min-h-[460px] flex-col overflow-hidden">
      {/* header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2.5 sm:px-4">
        <Segmented
          ariaLabel="Editor mode"
          size="sm"
          value={tab}
          onChange={onTabChange}
          options={[
            { value: "write", label: "Write", icon: <PenLine className="size-3.5" aria-hidden /> },
            {
              value: "annotated",
              label: (
                <span className="flex items-center gap-1.5">
                  Annotated
                  {result && result.drop_off_flags.length > 0 && (
                    <span className="rounded-full bg-leak-high/20 px-1.5 font-mono text-[10px] leading-4 text-leak-high">
                      {result.drop_off_flags.filter((f) => f.drop_pct > 0).length}
                    </span>
                  )}
                </span>
              ),
              icon: <Eye className="size-3.5" aria-hidden />,
            },
          ]}
        />
        <div className="ml-auto flex items-center gap-1">
          <Menu
            align="end"
            trigger={({ toggle }) => (
              <Button variant="ghost" size="sm" onClick={toggle} aria-haspopup="menu">
                <BookOpen className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">Samples</span>
                <ChevronDown className="size-3 opacity-60" aria-hidden />
              </Button>
            )}
          >
            {(close) => (
              <>
                <p className="px-3 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-500">Load a sample script</p>
                {SAMPLE_SCRIPTS.map((s) => (
                  <MenuItem
                    key={s.id}
                    onClick={() => {
                      onLoadSample(s);
                      close();
                    }}
                  >
                    <FileText className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
                    <span>
                      <span className="block font-medium text-white">{s.title}</span>
                      <span className="text-xs text-ink-400">{FORMAT_META[s.format].label}</span>
                    </span>
                  </MenuItem>
                ))}
              </>
            )}
          </Menu>
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
      <div className="relative min-h-0 flex-1">
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
            className="absolute inset-0 h-full w-full resize-none bg-transparent px-5 py-4 text-[15px] leading-7 text-ink-100 placeholder:text-ink-500 focus:outline-none sm:px-6"
          />
        ) : (
          <AnnotatedScript text={value} result={result} strip={strip} activeFlag={activeFlag} onFlagClick={onFlagClick} />
        )}

        <AnimatePresence>
          {sel && tab === "write" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-ink-850/95 p-2 pl-3 shadow-2xl backdrop-blur-xl"
            >
              <span className="mr-auto truncate text-xs text-ink-300">
                <span className="font-mono text-ink-400">{sel.end - sel.start}</span> chars selected
              </span>
              <Button size="xs" variant="secondary" onMouseDown={(e) => e.preventDefault()} onClick={() => onSelectionRewrite("fix", sel.start, sel.end)}>
                <Wand2 className="size-3.5 text-brand-300" aria-hidden /> Rewrite for retention
              </Button>
              <Button size="xs" variant="secondary" onMouseDown={(e) => e.preventDefault()} onClick={() => onSelectionRewrite("deslop", sel.start, sel.end)}>
                <Scissors className="size-3.5 text-flare-400" aria-hidden /> De-Slop
                <span className="rounded bg-amber-300/15 px-1 text-[9px] font-semibold uppercase text-amber-300">Pro</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* footer */}
      <div className="space-y-3 border-t border-white/[0.06] bg-black/20 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="font-mono tabular-nums text-ink-200" aria-live="polite">
            <span className="text-white">{stats.words.toLocaleString()}</span> words <span className="text-ink-500">•</span>{" "}
            <span className="text-white">{formatRuntime(stats.seconds)}</span> <span className="text-ink-500">•</span> {stats.wpm} WPM
          </span>
          <span className={cn("font-mono tabular-nums", over ? "text-leak-high" : "text-ink-500")}>
            {stats.chars.toLocaleString()} / {MAX_SCRIPT_CHARS.toLocaleString()}
          </span>
          {stats.notes > 0 && (
            <label className="flex cursor-pointer items-center gap-2 text-ink-300">
              <input type="checkbox" checked={strip} onChange={(e) => onStripChange(e.target.checked)} className="peer sr-only" />
              <span className="relative h-4 w-7 rounded-full bg-white/10 transition peer-checked:bg-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 after:absolute after:left-0.5 after:top-0.5 after:size-3 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-3" />
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
              { value: "deep", label: "Deep", icon: <Gauge className="size-3" aria-hidden />, locked: !canDeep, title: "~20s — higher-quality model (Creator & Pro)" },
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
              disabled={over || (tooShort && !analyzing)}
              title={tooShort ? `Add at least ${MIN_SCRIPT_WORDS} words` : undefined}
              className={cn(!analyzing && !tooShort && !over && "animate-pulse-ring")}
            >
              {analyzing ? "Analyzing…" : "Analyze Script"}
              {!analyzing && (
                <span className="ml-1 hidden items-center gap-0.5 sm:inline-flex">
                  <Kbd><Command className="size-2.5" aria-label="Cmd or Ctrl" /></Kbd>
                  <Kbd><CornerDownLeft className="size-2.5" aria-label="Enter" /></Kbd>
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
