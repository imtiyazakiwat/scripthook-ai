"use client";

import { ArrowDown, ArrowUp, Download, FlipHorizontal2, Minus, Pause, Play, Plus, Printer, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import type { ScriptFormat, SpeakingPace } from "@/lib/schema";
import { formatRuntime, formatTimestamp, getWpm, splitBeats, stripDirectorNotes } from "@/lib/script";
import { cn } from "@/lib/utils";

/** Full-screen, time-coded, auto-scrolling teleprompter (FR-3.3). Light controls, dark reading stage. */
export function Teleprompter({
  open,
  onClose,
  script,
  format,
  pace,
}: {
  open: boolean;
  onClose: () => void;
  script: string;
  format: ScriptFormat;
  pace: SpeakingPace;
}) {
  const clean = useMemo(() => stripDirectorNotes(script), [script]);
  const wpm = getWpm(format, pace);
  const beats = useMemo(() => splitBeats(clean, wpm), [clean, wpm]);
  const paragraphs = useMemo(() => {
    const map = new Map<number, typeof beats>();
    beats.forEach((b) => map.set(b.paragraph, [...(map.get(b.paragraph) ?? []), b]));
    return [...map.values()];
  }, [beats]);
  const total = beats.length ? beats[beats.length - 1].end : 0;

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fontSize, setFontSize] = useState(44);
  const [mirror, setMirror] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  const reset = useCallback(() => {
    setPlaying(false);
    elapsedRef.current = 0;
    setElapsed(0);
    scroller.current?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Scroll so the active beat sits on the reading line, paced by WPM.
  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    const tick = (t: number) => {
      if (last.current !== null) {
        elapsedRef.current = Math.min(total, elapsedRef.current + ((t - last.current) / 1000) * speed);
        setElapsed(elapsedRef.current);
        const sc = scroller.current;
        const ct = content.current;
        if (sc && ct) {
          const beat = beats.find((b) => elapsedRef.current < b.end) ?? beats[beats.length - 1];
          const el = ct.querySelector<HTMLElement>(`[data-beat="${beat?.index}"]`);
          if (el && beat) {
            const within = (elapsedRef.current - beat.start) / Math.max(0.01, beat.end - beat.start);
            const target = el.offsetTop + el.offsetHeight * within - sc.clientHeight * 0.38;
            sc.scrollTop += (target - sc.scrollTop) * 0.12;
          }
        }
        if (elapsedRef.current >= total) setPlaying(false);
      }
      last.current = t;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, speed, beats, total]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowUp") setSpeed((s) => Math.min(2, +(s + 0.1).toFixed(1)));
      else if (e.key === "ArrowDown") setSpeed((s) => Math.max(0.5, +(s - 0.1).toFixed(1)));
      else if (e.key.toLowerCase() === "m") setMirror((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const exportText = () => {
    const lines = paragraphs.map((p) => `[${formatTimestamp(p[0].start)}]\n${p.map((b) => b.text).join(" ")}`).join("\n\n");
    const blob = new Blob([`TELEPROMPTER SCRIPT — ${formatRuntime(total)} @ ${wpm} WPM\n\n${lines}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teleprompter-script.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;
  const activeBeat = beats.find((b) => elapsed < b.end)?.index ?? -1;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black print:static print:bg-white" role="dialog" aria-modal="true" aria-label="Teleprompter">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-3 py-2 print:hidden sm:px-5">
        <Button variant="primary" size="sm" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} autoFocus>
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          {playing ? "Pause" : "Roll"}
        </Button>
        <Button variant="ghost" size="sm" onClick={reset} aria-label="Restart">
          <RotateCcw className="size-4" aria-hidden />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" aria-hidden />
        <div className="flex items-center gap-1 text-xs text-muted">
          Speed
          <Button variant="ghost" size="xs" onClick={() => setSpeed((s) => Math.max(0.5, +(s - 0.1).toFixed(1)))} aria-label="Slower">
            <Minus className="size-3" aria-hidden />
          </Button>
          <span className="w-9 text-center font-mono font-semibold text-foreground">{speed.toFixed(1)}×</span>
          <Button variant="ghost" size="xs" onClick={() => setSpeed((s) => Math.min(2, +(s + 0.1).toFixed(1)))} aria-label="Faster">
            <Plus className="size-3" aria-hidden />
          </Button>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted">
          Size
          <Button variant="ghost" size="xs" onClick={() => setFontSize((f) => Math.max(24, f - 4))} aria-label="Smaller text">
            <Minus className="size-3" aria-hidden />
          </Button>
          <span className="w-8 text-center font-mono font-semibold text-foreground">{fontSize}</span>
          <Button variant="ghost" size="xs" onClick={() => setFontSize((f) => Math.min(84, f + 4))} aria-label="Larger text">
            <Plus className="size-3" aria-hidden />
          </Button>
        </div>
        <Button variant={mirror ? "secondary" : "ghost"} size="sm" onClick={() => setMirror((m) => !m)} aria-pressed={mirror}>
          <FlipHorizontal2 className="size-4" aria-hidden /> Mirror
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-xs text-muted sm:inline">
            {formatTimestamp(elapsed)} / {formatTimestamp(total)}
          </span>
          <Button variant="ghost" size="sm" onClick={exportText} title="Download time-coded .txt">
            <Download className="size-4" aria-hidden />
            <span className="hidden md:inline">Export</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.print()} title="Print" aria-label="Print">
            <Printer className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close teleprompter">
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
      <div className="h-1 bg-zinc-800 print:hidden">
        <div className="h-full bg-accent" style={{ width: `${total ? (elapsed / total) * 100 : 0}%` }} />
      </div>

      {/* reading area */}
      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-[38%] z-10 h-px bg-accent/50 print:hidden" aria-hidden>
          <span className="absolute -top-1.5 left-2 size-3 rotate-45 border-r-2 border-t-2 border-accent" />
        </div>
        <div ref={scroller} className="no-scrollbar h-full overflow-y-auto print:overflow-visible">
          <div
            ref={content}
            className={cn("relative mx-auto max-w-5xl px-6 pb-[60vh] pt-[36vh] sm:px-12 print:p-0", mirror && "-scale-x-100")}
            style={{ fontSize }}
          >
            {paragraphs.map((p, i) => (
              <div key={i} className="mb-[0.9em] grid grid-cols-[auto_1fr] gap-x-6">
                <span className="pt-[0.35em] font-mono text-sm text-accent print:text-black">{formatTimestamp(p[0].start)}</span>
                <p className="font-semibold leading-[1.35] tracking-tight print:text-black">
                  {p.map((b) => (
                    <span
                      key={b.index}
                      data-beat={b.index}
                      className={cn(
                        "transition-colors duration-300",
                        activeBeat === -1 || (!playing && elapsed === 0)
                          ? "text-white"
                          : b.index < activeBeat
                            ? "text-white/35"
                            : b.index === activeBeat
                              ? "text-white"
                              : "text-white/70",
                      )}
                    >
                      {b.text}{" "}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border bg-background py-2 text-[11px] text-muted print:hidden">
        <span className="flex items-center gap-1">
          <Kbd>Space</Kbd> play/pause
        </span>
        <span className="flex items-center gap-1">
          <Kbd>
            <ArrowUp className="size-2.5" aria-label="Up" />
          </Kbd>
          <Kbd>
            <ArrowDown className="size-2.5" aria-label="Down" />
          </Kbd>{" "}
          speed
        </span>
        <span className="flex items-center gap-1">
          <Kbd>M</Kbd> mirror
        </span>
        <span className="flex items-center gap-1">
          <Kbd>Esc</Kbd> close
        </span>
      </div>
    </div>
  );
}
