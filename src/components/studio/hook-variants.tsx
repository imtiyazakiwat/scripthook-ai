"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Copy,
  Infinity as InfinityIcon,
  ListOrdered,
  ShoppingBag,
  Sparkles,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HookVariant } from "@/lib/schema";
import { copyText } from "@/lib/utils";

const ICONS: [string, React.ElementType][] = [
  ["curiosity", InfinityIcon],
  ["contrarian", Zap],
  ["proof", Trophy],
  ["story", BookOpen],
  ["stakes", BookOpen],
  ["question", CircleHelp],
  ["fomo", Timer],
  ["speedrun", ListOrdered],
  ["listicle", ListOrdered],
  ["bridge", ShoppingBag],
  ["problem", ShoppingBag],
];

function FrameworkIcon({ framework }: { framework: string }) {
  const Icon = ICONS.find(([k]) => framework.toLowerCase().includes(k))?.[1] ?? Sparkles;
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded bg-accent/10 text-accent" aria-hidden>
      <Icon className="size-3.5" />
    </span>
  );
}

function HookCard({ hook, index, onUse }: { hook: HookVariant; index: number; onUse: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <article className="flex flex-col rounded border border-border bg-surface p-4">
      <header className="mb-2.5 flex items-center gap-2">
        <FrameworkIcon framework={hook.framework} />
        <span className="text-sm font-semibold text-foreground">{hook.framework}</span>
        <span className="ml-auto font-mono text-xs text-zinc-400">#{index + 1}</span>
      </header>
      <p className="text-[15px] font-medium leading-relaxed text-foreground">“{hook.hook_text}”</p>
      {hook.why_it_works && <p className="mt-2 text-xs leading-5 text-muted">{hook.why_it_works}</p>}
      <footer className="mt-auto flex items-center gap-1.5 pt-3">
        <Button
          size="xs"
          variant={copied ? "success" : "secondary"}
          onClick={async () => {
            if (await copyText(hook.hook_text)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }
          }}
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? "Copied" : "Copy hook"}
        </Button>
        <Button size="xs" variant="ghost" onClick={() => onUse(hook.hook_text)} title="Replace your first line with this hook">
          Use as opener <ArrowRight className="size-3.5" aria-hidden />
        </Button>
      </footer>
    </article>
  );
}

export function HookVariants({ hooks, onUse }: { hooks: HookVariant[]; onUse: (text: string) => void }) {
  if (!hooks.length) {
    return <div className="panel rounded p-6 text-center text-sm text-muted">The AI didn’t return any hook rewrites in this report.</div>;
  }
  return (
    <div className="grid gap-3 @2xl:grid-cols-2">
      {hooks.map((h, i) => (
        <HookCard key={`${h.framework}-${i}`} hook={h} index={i} onUse={onUse} />
      ))}
    </div>
  );
}
