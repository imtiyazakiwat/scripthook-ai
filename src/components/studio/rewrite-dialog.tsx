"use client";

import { Check, Copy, RotateCcw, Scissors, Wand2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ScriptFormat } from "@/lib/schema";
import { copyText } from "@/lib/utils";

export interface RewriteRequest {
  mode: "fix" | "deslop";
  text: string;
  start: number;
  end: number;
}

interface Option {
  label: string;
  text: string;
  note: string;
}

export function RewriteDialog({
  request,
  onClose,
  format,
  context,
  voiceProfile,
  onApply,
  onPlanRequired,
}: {
  request: RewriteRequest | null;
  onClose: () => void;
  format: ScriptFormat;
  context: string;
  voiceProfile?: string;
  onApply: (req: RewriteRequest, text: string) => void;
  onPlanRequired: (mode: "fix" | "deslop") => void;
}) {
  const [options, setOptions] = useState<Option[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!request) return;
    setLoading(true);
    setError(null);
    setOptions(null);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: request.text, context, format, mode: request.mode, voice_profile: voiceProfile }),
      });
      const data = (await res.json()) as { options?: Option[]; error?: string; code?: string };
      if (res.status === 403 && data.code === "plan_required") {
        onClose();
        onPlanRequired(request.mode);
        return;
      }
      if (!res.ok || !data.options) throw new Error(data.error || "Rewrite failed");
      setOptions(data.options);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [request, context, format, voiceProfile, onClose, onPlanRequired]);

  useEffect(() => {
    if (request) void load();
  }, [request, load]);

  const deslop = request?.mode === "deslop";

  return (
    <Dialog
      open={!!request}
      onOpenChange={(o) => !o && onClose()}
      title={deslop ? "De-Slop rewrite" : "Rewrite for retention"}
      description={deslop ? "Human, specific, conversational — AI filler removed." : "Three takes engineered to stop the drop-off."}
      className="max-w-2xl"
    >
      {request && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-ink-500">Original</p>
            <p className="line-clamp-4 text-[13.5px] leading-relaxed text-ink-300">{request.text}</p>
          </div>
          {loading && (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          )}
          {error && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-leak-high/20 bg-leak-high/5 p-3 text-sm text-leak-high">
              {error}
              <Button size="xs" variant="secondary" onClick={load}>
                <RotateCcw className="size-3.5" aria-hidden /> Retry
              </Button>
            </div>
          )}
          {options?.map((o, i) => (
            <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-brand-300">{o.label}</span>
                {o.note && <span className="truncate text-xs text-ink-400">{o.note}</span>}
              </div>
              <p className="text-[14.5px] leading-relaxed text-white">{o.text}</p>
              <div className="mt-3 flex gap-1.5">
                <Button size="xs" variant="primary" onClick={() => onApply(request, o.text)}>
                  {deslop ? <Scissors className="size-3.5" aria-hidden /> : <Wand2 className="size-3.5" aria-hidden />} Replace in script
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={async () => {
                    if (await copyText(o.text)) {
                      setCopied(i);
                      setTimeout(() => setCopied(null), 1200);
                    }
                  }}
                >
                  {copied === i ? <Check className="size-3.5 text-spike" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                  {copied === i ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ))}
          {options && (
            <Button variant="ghost" size="sm" onClick={load}>
              <RotateCcw className="size-3.5" aria-hidden /> Regenerate
            </Button>
          )}
        </div>
      )}
    </Dialog>
  );
}
