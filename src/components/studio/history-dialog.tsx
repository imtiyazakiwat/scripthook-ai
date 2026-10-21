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
    <Dialog open={open} onOpenChange={onOpenChange} title="Analysis history" description="Stored privately in this browser — nothing is saved on our servers." className="max-w-xl">
      {history.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 py-12 text-center">
          <Clock className="size-6 text-ink-500" aria-hidden />
          <p className="mt-3 text-sm text-ink-300">No analyses yet.</p>
          <p className="text-xs text-ink-500">Your last 15 reports will appear here.</p>
        </div>
      ) : (
        <>
          <ul className="max-h-[55dvh] space-y-2 overflow-y-auto pr-1">
            {history.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => onLoad(r)}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl font-mono text-sm font-semibold"
                    style={{ color: scoreColor(r.hook_score), background: `${scoreColor(r.hook_score)}1a` }}
                  >
                    {r.hook_score}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-white">{r.script.slice(0, 90)}</span>
                    <span className="mt-0.5 block text-xs text-ink-400">
                      {FORMAT_META[r.format].short} · {r.word_count} words · {r.predicted_end_retention}% end retention · {timeAgo(r.created_at)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
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
