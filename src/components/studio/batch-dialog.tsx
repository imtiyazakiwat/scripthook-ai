"use client";

import { Crown, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { analyzeScript, type AnalyzeError } from "@/hooks/use-analyzer";
import type { AnalysisResult, ScriptFormat, SpeakingPace } from "@/lib/schema";
import { countWords } from "@/lib/script";
import { cn, scoreColor } from "@/lib/utils";

type Slot = { status: "idle" } | { status: "loading" } | { status: "done"; result: AnalysisResult } | { status: "error"; message: string };

export function BatchDialog({
  open,
  onOpenChange,
  initialScript,
  format,
  pace,
  strip,
  voiceProfile,
  onOpenResult,
  onFinished,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialScript: string;
  format: ScriptFormat;
  pace: SpeakingPace;
  strip: boolean;
  voiceProfile?: string;
  onOpenResult: (r: AnalysisResult) => void;
  onFinished: () => void;
}) {
  const [scripts, setScripts] = useState<string[]>(() => [initialScript, ""]);
  const [active, setActive] = useState(0);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [running, setRunning] = useState(false);

  const valid = scripts.map((s) => countWords(s) >= 20);

  async function run() {
    setRunning(true);
    const next: Slot[] = scripts.map(() => ({ status: "idle" }));
    setSlots([...next]);
    for (let i = 0; i < scripts.length; i++) {
      if (!valid[i]) {
        next[i] = { status: "error", message: "Needs 20+ words" };
        setSlots([...next]);
        continue;
      }
      next[i] = { status: "loading" };
      setSlots([...next]);
      try {
        const result = await analyzeScript({ script: scripts[i], format, speaking_pace: pace, strip_director_notes: strip, voice_profile: voiceProfile });
        next[i] = { status: "done", result };
      } catch (err) {
        next[i] = { status: "error", message: (err as AnalyzeError).message };
      }
      setSlots([...next]);
    }
    setRunning(false);
    onFinished();
  }

  const done = slots.flatMap((s, i) => (s.status === "done" ? [{ i, r: s.result }] : []));
  const best = done.length ? done.reduce((a, b) => (b.r.hook_score > a.r.hook_score ? b : a)) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Batch compare"
      description="Test up to 5 drafts or hook variations side by side. Same preset & pace for a fair fight."
      className="max-w-3xl"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {scripts.map((_, i) => (
          <div key={i} className="relative">
            <button
              onClick={() => setActive(i)}
              className={cn(
                "h-8 rounded-lg border px-3 pr-7 text-xs font-medium transition",
                active === i ? "border-brand-400/40 bg-brand-500/15 text-white" : "border-white/10 text-ink-300 hover:text-white",
              )}
            >
              Draft {i + 1}
              {!valid[i] && <span className="ml-1 text-ink-500">· empty</span>}
            </button>
            {scripts.length > 1 && (
              <button
                aria-label={`Remove draft ${i + 1}`}
                onClick={() => {
                  setScripts((s) => s.filter((_, j) => j !== i));
                  setSlots([]);
                  setActive((a) => Math.max(0, a >= i ? a - 1 : a));
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-500 hover:text-white"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ))}
        {scripts.length < 5 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setScripts((s) => [...s, ""]);
              setActive(scripts.length);
            }}
          >
            <Plus className="size-3.5" aria-hidden /> Add draft
          </Button>
        )}
      </div>
      <textarea
        value={scripts[active] ?? ""}
        onChange={(e) => setScripts((s) => s.map((v, j) => (j === active ? e.target.value.slice(0, 15000) : v)))}
        rows={8}
        placeholder={`Paste draft ${active + 1}…`}
        className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-relaxed text-ink-100 placeholder:text-ink-500 focus:border-brand-400/50 focus:outline-none"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-ink-500">{valid.filter(Boolean).length} of {scripts.length} drafts ready</p>
        <Button variant="primary" onClick={run} loading={running} disabled={!valid.some(Boolean)}>
          Run batch
        </Button>
      </div>

      {slots.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08]">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-3 py-2 font-medium">Draft</th>
                <th className="px-3 py-2 font-medium">Hook</th>
                <th className="px-3 py-2 font-medium">End ret.</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Biggest leak</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {slots.map((s, i) => {
                const top = s.status === "done" ? [...s.result.drop_off_flags].sort((a, b) => b.drop_pct - a.drop_pct)[0] : null;
                return (
                  <tr key={i} className="border-t border-white/[0.06]">
                    <td className="px-3 py-2.5 font-medium text-white">
                      <span className="flex items-center gap-1.5">
                        {best?.i === i && done.length > 1 && <Crown className="size-3.5 text-amber-300" aria-label="Best" />}
                        Draft {i + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      {s.status === "loading" ? (
                        <Loader2 className="size-4 animate-spin text-brand-300" />
                      ) : s.status === "done" ? (
                        <span style={{ color: scoreColor(s.result.hook_score) }}>{s.result.hook_score}</span>
                      ) : s.status === "error" ? (
                        <span className="text-xs text-leak-high">{s.message}</span>
                      ) : (
                        <span className="text-ink-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-ink-200">{s.status === "done" ? `${s.result.predicted_end_retention}%` : "—"}</td>
                    <td className="hidden max-w-[240px] truncate px-3 py-2.5 text-ink-300 sm:table-cell">{top ? `“${top.flagged_text}”` : "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      {s.status === "done" && (
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => {
                            onOpenResult(s.result);
                            onOpenChange(false);
                          }}
                        >
                          Open
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Dialog>
  );
}
