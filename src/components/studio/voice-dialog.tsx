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
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string;
  onSave: (v: string) => void;
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
      description="Describe how you talk, or paste a past script. Every hook and fix is written in this voice."
      className="max-w-xl"
    >
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setDraft(p.text)}
            className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground"
          >
            {p.label}
          </button>
        ))}
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, 1500))}
        rows={7}
        aria-label="Voice profile"
        placeholder="e.g. Fast-talking, Gen-Z slang, roasts bad gear advice, always ends sections with a question…"
        className="mt-3 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none"
      />
      <p className="mt-1 text-right font-mono text-[11px] text-zinc-400">{draft.length}/1500</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Saved locally in this browser.</span>
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
    </Dialog>
  );
}
