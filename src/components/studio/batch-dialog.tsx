"use client";

import { Crown, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { analyzeScript, type AnalyzeError } from "@/hooks/use-analyzer";
import type { AnalysisResult, ScriptFormat, SpeakingPace } from "@/lib/schema";
import { countWords } from "@/lib/script";
import { cn, scoreColor } from "@/lib/utils";

type Slot =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: AnalysisResult }
  | { status: "error"; message: string; details?: string[] };

export function BatchDialog({
  open,
  onOpenChange,
  initialScript,
  format,
  pace,
  strip,
  voiceProfile,
  onOpenResult,
  unavailableReason,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialScript: string;
  format: ScriptFormat;
  pace: SpeakingPace;
  strip: boolean;
  voiceProfile?: string;
  onOpenResult: (r: AnalysisResult) => void;
  /** Set when analysis can't run at all (e.g. no AI provider configured). */
  unavailableReason?: string;
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
        const e = err as AnalyzeError;
        next[i] = { status: "error", message: e.code === "ai_failed" || e.code === "ai_auth" ? "AI failed, no report" : e.message, details: e.details };
      }
      setSlots([...next]);
    }
    setRunning(false);
  }

  const done = slots.flatMap((s, i) => (s.status === "done" ? [{ i, r: s.result }] : []));
  const best = done.length ? done.reduce((a, b) => (b.r.hook_score > a.r.hook_score ? b : a)) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Batch compare"
      description="Test up to 5 drafts or hook variations side by side. Same preset and pace for a fair fight."
      className="max-w-3xl"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {scripts.map((_, i) => (
          <div key={i} className="relative">
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={cn(
                "h-8 rounded border px-3 pr-7 text-xs font-medium transition-colors",
                active === i ? "border-orange-200 bg-orange-50 text-orange-700" : "border-border text-muted hover:border-border-hover hover:text-foreground",
              )}
            >
              Draft {i + 1}
              {!valid[i] && <span className="ml-1 font-normal text-zinc-400">· empty</span>}
            </button>
            {scripts.length > 1 && (
              <button
                type="button"
                aria-label={`Remove draft ${i + 1}`}
                onClick={() => {
                  setScripts((s) => s.filter((_, j) => j !== i));
                  setSlots([]);
                  setActive((a) => Math.max(0, a >= i ? a - 1 : a));
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-foreground"
              >
                <X className="size-3" aria-hidden />
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
        aria-label={`Draft ${active + 1}`}
        placeholder={`Paste draft ${active + 1}…`}
        className="mt-3 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={unavailableReason ? "text-xs font-medium text-error" : "text-xs text-muted"}>
          {unavailableReason ?? `${valid.filter(Boolean).length} of ${scripts.length} drafts ready`}
        </p>
        <Button variant="primary" onClick={run} loading={running} disabled={!!unavailableReason || !valid.some(Boolean)}>
          Run batch
        </Button>
      </div>

      {slots.length > 0 && (
        <div className="mt-5 rounded border border-border bg-surface p-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-zinc-500">
                <th className="pb-2 pr-3 font-medium">Draft</th>
                <th className="px-3 pb-2 font-medium">Hook</th>
                <th className="px-3 pb-2 font-medium">End ret.</th>
                <th className="hidden px-3 pb-2 font-medium sm:table-cell">Biggest leak</th>
                <th className="pb-2 pl-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s, i) => {
                const top = s.status === "done" ? [...s.result.drop_off_flags].sort((a, b) => b.drop_pct - a.drop_pct)[0] : null;
                return (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        {best?.i === i && done.length > 1 && <Crown className="size-3.5 text-accent" aria-label="Best" />}
                        Draft {i + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold">
                      {s.status === "loading" ? (
                        <Loader2 className="size-4 animate-spin text-accent" aria-label="Analyzing" />
                      ) : s.status === "done" ? (
                        <span style={{ color: scoreColor(s.result.hook_score) }}>{s.result.hook_score}</span>
                      ) : s.status === "error" ? (
                        <span className="block text-xs font-normal text-error">
                          {s.message}
                          {s.details?.map((d, j) => (
                            <span key={j} className="mt-0.5 block font-mono text-[11px] text-muted">
                              {d}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted">{s.status === "done" ? `${s.result.predicted_end_retention}%` : "—"}</td>
                    <td className="hidden max-w-[240px] truncate px-3 py-2.5 text-muted sm:table-cell">{top ? `“${top.flagged_text}”` : "—"}</td>
                    <td className="py-2.5 pl-3 text-right">
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
