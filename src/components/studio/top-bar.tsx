"use client";

import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import type { AiStatus } from "@/hooks/use-ai-status";
import { FORMAT_META } from "@/lib/plans";
import type { ScriptFormat } from "@/lib/schema";
import { cn } from "@/lib/utils";

/** What the AI chip says, and how confident we can be about it. */
function chip(ai: AiStatus, depth: "fast" | "deep", lastRun: "none" | "ok" | "failed") {
  if (ai.state === "checking") return { dot: "bg-zinc-300", label: "Checking AI…", title: "Checking whether an AI provider is configured" };
  if (ai.state === "missing") return { dot: "bg-error", label: "AI not configured", title: "No AI provider is configured on this server, so analysis can’t run" };
  if (ai.state === "unknown") return { dot: "bg-zinc-300", label: "AI status unknown", title: "Couldn’t check the AI status. Analysis will report any problem." };
  const model = depth === "deep" ? ai.deepModel : ai.model;
  if (lastRun === "failed") return { dot: "bg-error", label: model, title: `The last analysis failed. Model: ${model}` };
  if (lastRun === "ok") return { dot: "bg-success", label: model, title: `The last analysis succeeded. Model: ${model}` };
  return { dot: "bg-zinc-300", label: model, title: `Analyses run on ${model}. Not used yet in this session.` };
}

/** Page title, mobile menu toggle and the AI model / status chip. */
export function TopBar({
  onMenuClick,
  menuOpen,
  format,
  aiStatus,
  depth,
  lastRun,
}: {
  onMenuClick: () => void;
  menuOpen: boolean;
  format: ScriptFormat;
  aiStatus: AiStatus;
  depth: "fast" | "deep";
  lastRun: "none" | "ok" | "failed";
}) {
  const c = chip(aiStatus, depth, lastRun);
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-controls="studio-sidebar"
          aria-expanded={menuOpen}
          className="shrink-0 rounded border border-border px-2.5 py-1.5 text-sm text-muted transition-colors hover:text-foreground lg:hidden"
        >
          Menu
        </button>
        <Link href="/" className="flex shrink-0 items-center lg:hidden" aria-label="ScriptHook AI home">
          <LogoMark className="size-6" />
        </Link>
        <h1 className="truncate text-base font-semibold sm:text-lg">Studio</h1>
        <span className="hidden truncate text-sm text-muted md:inline">{FORMAT_META[format].label}</span>
      </div>

      <div
        className={cn(
          "flex min-w-0 items-center gap-2 rounded border px-2.5 py-1.5 text-xs font-medium",
          aiStatus.state === "missing" ? "border-error/30 bg-error/5 text-error" : "border-border text-muted",
        )}
        title={c.title}
        role="status"
      >
        <span className={cn("size-2 shrink-0 rounded-full", c.dot)} aria-hidden />
        <span className="sr-only">{c.title}. </span>
        <span className="truncate font-mono">{c.label}</span>
      </div>
    </header>
  );
}
