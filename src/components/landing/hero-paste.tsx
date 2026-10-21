"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AUTORUN_PARAM, DRAFT_KEY } from "@/lib/history";
import { MAX_SCRIPT_CHARS, MIN_SCRIPT_WORDS } from "@/lib/limits";
import { countWords, stripDirectorNotes } from "@/lib/script";
import { cn } from "@/lib/utils";
import { AppWindow } from "./app-window";

/** Real entry point: paste a script here and the Studio analyzes it on arrival. */
export function HeroPaste() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const words = countWords(stripDirectorNotes(text));
  const tooLong = text.length > MAX_SCRIPT_CHARS;
  const ready = words >= MIN_SCRIPT_WORDS && !tooLong;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setSending(true);
    try {
      localStorage.setItem(DRAFT_KEY, text);
    } catch {
      /* storage blocked — the Studio opens empty instead */
    }
    router.push(`/studio?${AUTORUN_PARAM}=1`);
  }

  return (
    <AppWindow label="studio / new script">
      <form onSubmit={submit}>
        <label htmlFor="hero-script" className="block text-sm font-semibold text-foreground">
          Your script
        </label>
        <textarea
          id="hero-script"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={11}
          placeholder="Paste the spoken script you’re about to film…"
          aria-describedby="hero-script-count"
          className="mt-2 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm leading-6 text-foreground placeholder:text-zinc-500 focus:border-accent/40 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p id="hero-script-count" className={cn("text-xs", tooLong ? "font-semibold text-error" : "text-muted")} aria-live="polite">
            {tooLong
              ? `Over the ${MAX_SCRIPT_CHARS.toLocaleString()}-character limit`
              : `${words.toLocaleString()} spoken words${ready ? "" : ` · needs at least ${MIN_SCRIPT_WORDS}`}`}
          </p>
          <button
            type="submit"
            disabled={!ready || sending}
            className="inline-flex items-center justify-center rounded bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {sending ? "Opening Studio…" : "Analyze script"}
          </button>
        </div>
      </form>
    </AppWindow>
  );
}
