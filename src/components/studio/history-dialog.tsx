"use client";

import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FORMAT_META } from "@/lib/plans";
import type { AnalysisResult } from "@/lib/schema";
import { scoreColor, timeAgo } from "@/lib/utils";

export function HistoryDialog({
  open,
  onOpenChange,
  history,
  onLoad,
  onClear,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  history: AnalysisResult[];
  onLoad: (r: AnalysisResult) => void;
  onClear: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Analysis history" description="Stored privately in this browser. Nothing is saved on our servers." className="max-w-xl">
      {history.length === 0 ? (
        <div className="grid place-items-center rounded border border-dashed border-border py-12 text-center">
          <Clock className="size-6 text-zinc-400" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">No analyses yet</p>
          <p className="mt-0.5 text-xs text-muted">Your last 15 reports will appear here.</p>
        </div>
      ) : (
        <>
          <ul className="max-h-[55dvh] space-y-2 overflow-y-auto pr-1">
            {history.map((r) => {
              const color = scoreColor(r.hook_score);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onLoad(r)}
                    className="flex w-full items-center gap-3 rounded border border-border bg-surface p-3 text-left transition-colors hover:border-border-hover hover:bg-surface-hover"
                  >
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded font-mono text-sm font-bold"
                      style={{ color, background: `${color}1a` }}
                      aria-label={`Hook score ${r.hook_score}`}
                    >
                      {r.hook_score}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{r.script.slice(0, 90)}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {FORMAT_META[r.format].short} · {r.word_count} words · {r.predicted_end_retention}% end retention · {timeAgo(r.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 className="size-3.5" aria-hidden /> Clear history
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
