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
}: {
  request: RewriteRequest | null;
  onClose: () => void;
  format: ScriptFormat;
  context: string;
  voiceProfile?: string;
  onApply: (req: RewriteRequest, text: string) => void;
}) {
  const [options, setOptions] = useState<Option[] | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; details?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!request) return;
    setLoading(true);
    setError(null);
    setOptions(null);
    try {
      let res: Response;
      try {
        res = await fetch("/api/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: request.text, context, format, mode: request.mode, voice_profile: voiceProfile }),
        });
      } catch {
        setError({ message: "Couldn’t reach the ScriptHook server. Check your connection and try again." });
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { options?: Option[]; model?: string; error?: string; details?: string[] };
      if (!res.ok || !data.options?.length) {
        setError({ message: data.error || `The server answered with HTTP ${res.status}, so no rewrite was generated.`, details: data.details });
        return;
      }
      setOptions(data.options);
      setModel(data.model ?? null);
    } finally {
      setLoading(false);
    }
  }, [request, context, format, voiceProfile]);

  useEffect(() => {
    if (request) void load();
  }, [request, load]);

  const deslop = request?.mode === "deslop";

  return (
    <Dialog
      open={!!request}
      onOpenChange={(o) => !o && onClose()}
      title={deslop ? "De-Slop rewrite" : "Rewrite for retention"}
      description={deslop ? "Human, specific, conversational. AI filler removed." : "Three takes engineered to stop the drop-off."}
      className="max-w-2xl"
    >
      {request && (
        <div className="space-y-4">
          <div className="rounded border border-border bg-surface p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Original</p>
            <p className="line-clamp-4 text-sm leading-6 text-muted">{request.text}</p>
          </div>
          {loading && (
            <div className="space-y-2.5" aria-busy="true" aria-label="Writing rewrites">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded bg-surface-hover" />
              ))}
            </div>
          )}
          {error && (
            <div role="alert" className="rounded border border-error/30 bg-error/5 p-3 text-sm text-error">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{error.message}</p>
                <Button size="xs" variant="secondary" onClick={load}>
                  <RotateCcw className="size-3.5" aria-hidden /> Retry
                </Button>
              </div>
              {error.details && error.details.length > 0 && (
                <ul className="mt-2 space-y-1 font-mono text-xs text-muted">
                  {error.details.map((d, i) => (
                    <li key={i}>
                      Attempt {i + 1}: {d}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {options?.map((o, i) => (
            <div key={i} className="rounded border border-border bg-surface p-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{o.label}</span>
                {o.note && <span className="truncate text-xs text-muted">{o.note}</span>}
              </div>
              <p className="text-[15px] leading-relaxed text-foreground">{o.text}</p>
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
                  {copied === i ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                  {copied === i ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ))}
          {options && (
            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={load}>
                <RotateCcw className="size-3.5" aria-hidden /> Regenerate
              </Button>
              {model && <span className="font-mono text-xs text-zinc-400">Written by {model}</span>}
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
