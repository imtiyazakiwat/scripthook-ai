"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const PRESETS = [
  { label: "Energetic & punchy", text: "High energy, short punchy sentences, lots of direct 'you' address, playful exaggeration, quick jokes. Never corporate." },
  { label: "Calm educator", text: "Calm, clear and confident. Explains with simple analogies, avoids hype words, sounds like a trusted teacher." },
  { label: "Sarcastic & witty", text: "Dry humor, self-deprecating, sarcastic asides, casual slang, calls out bad advice bluntly." },
  { label: "Storyteller", text: "Narrative-first, vivid sensory details, builds tension, uses 'and then…' cliffhangers and personal anecdotes." },
  { label: "Honest UGC reviewer", text: "Casual, best-friend tone, honest about flaws, specific details, never sounds like an ad." },
];

export function VoiceDialog({
  open,
  onOpenChange,
  value,
  onSave,
  isPro,
  onUpgrade,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string;
  onSave: (v: string) => void;
  isPro: boolean;
  onUpgrade: () => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Creator voice profile"
      description="Describe how you talk — or paste a past script. Every hook and fix will be written in this voice."
      className="max-w-xl"
    >
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setDraft(p.text)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-ink-200 transition hover:border-brand-400/40 hover:text-white"
          >
            {p.label}
          </button>
        ))}
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, 1500))}
        rows={7}
        placeholder="e.g. Fast-talking, Gen-Z slang, roasts bad gear advice, always ends sections with a question…"
        className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-relaxed text-ink-100 placeholder:text-ink-500 focus:border-brand-400/50 focus:outline-none"
      />
      <p className="mt-1 text-right font-mono text-[11px] text-ink-500">{draft.length}/1500</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        {!isPro ? (
          <p className="text-xs text-amber-300/90">Voice profiles apply on the Pro plan.</p>
        ) : (
          <span className="text-xs text-ink-500">Saved locally in this browser.</span>
        )}
        <div className="flex gap-2">
          {!isPro && (
            <Button size="sm" variant="secondary" onClick={onUpgrade}>
              Upgrade
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              onSave(draft.trim());
              onOpenChange(false);
              toast.success(draft.trim() ? "Voice profile saved" : "Voice profile cleared");
            }}
          >
            Save voice
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
