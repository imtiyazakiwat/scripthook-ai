"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Copy,
  Infinity as InfinityIcon,
  ListOrdered,
  Lock,
  ShoppingBag,
  Sparkles,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HookVariant } from "@/lib/schema";
import { cn, copyText } from "@/lib/utils";

const ICONS: [string, React.ElementType, string][] = [
  ["curiosity", InfinityIcon, "#9a83ff"],
  ["contrarian", Zap, "#ffb547"],
  ["proof", Trophy, "#2ee6a6"],
  ["story", BookOpen, "#ff7ab6"],
  ["stakes", BookOpen, "#ff7ab6"],
  ["question", CircleHelp, "#7dd3fc"],
  ["fomo", Timer, "#ff4d6d"],
  ["speedrun", ListOrdered, "#c4b5ff"],
  ["listicle", ListOrdered, "#c4b5ff"],
  ["bridge", ShoppingBag, "#fb923c"],
  ["problem", ShoppingBag, "#fb923c"],
];

function FrameworkIcon({ framework }: { framework: string }) {
  const hit = ICONS.find(([k]) => framework.toLowerCase().includes(k));
  const Icon = hit?.[1] ?? Sparkles;
  const color = hit?.[2] ?? "#9a83ff";
  return (
    <span className="grid size-7 place-items-center rounded-lg" style={{ background: `${color}1f`, color }} aria-hidden>
      <Icon className="size-3.5" />
    </span>
  );
}

function HookCard({
  hook,
  index,
  onUse,
  onCopied,
  onUpgrade,
}: {
  hook: HookVariant;
  index: number;
  onUse: (text: string) => void;
  onCopied: () => void;
  onUpgrade: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.035]",
        hook.locked && "overflow-hidden",
      )}
    >
      <header className="mb-2.5 flex items-center gap-2">
        <FrameworkIcon framework={hook.framework} />
        <span className="text-[12px] font-semibold text-ink-100">{hook.framework}</span>
        <span className="ml-auto font-mono text-[11px] text-ink-500">#{index + 1}</span>
      </header>

      {hook.locked ? (
        <>
          <p className="select-none text-[15px] font-medium leading-relaxed text-white blur-[6px]" aria-hidden>
            I spent three years doing this wrong before one tiny change doubled everything overnight.
          </p>
          <div className="absolute inset-0 grid place-items-center bg-ink-950/30">
            <Button size="xs" variant="primary" onClick={onUpgrade}>
              <Lock className="size-3" aria-hidden /> Unlock with Creator
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[15px] font-medium leading-relaxed text-white">“{hook.hook_text}”</p>
          {hook.why_it_works && <p className="mt-2 text-[12.5px] leading-relaxed text-ink-400">{hook.why_it_works}</p>}
          <footer className="mt-auto flex items-center gap-1.5 pt-3">
            <Button
              size="xs"
              variant={copied ? "success" : "secondary"}
              onClick={async () => {
                if (await copyText(hook.hook_text)) {
                  setCopied(true);
                  onCopied();
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
        </>
      )}
    </motion.article>
  );
}

export function HookVariants({
  hooks,
  onUse,
  onUpgrade,
}: {
  hooks: HookVariant[];
  onUse: (text: string) => void;
  onUpgrade: () => void;
}) {
  const locked = hooks.filter((h) => h.locked).length;
  return (
    <div className="space-y-3">
      {locked > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-500/25 bg-[linear-gradient(110deg,rgb(124_92_255/0.14),rgb(255_79_154/0.08))] p-3.5">
          <p className="text-[13px] text-ink-100">
            <span className="font-semibold text-white">{locked} more viral hooks</span> written for this script are ready.
          </p>
          <Button size="xs" variant="primary" className="ml-auto" onClick={onUpgrade}>
            Unlock all 8
          </Button>
        </div>
      )}
      <div className="grid gap-3 xl:grid-cols-2">
        {hooks.map((h, i) => (
          <HookCard key={`${h.framework}-${i}`} hook={h} index={i} onUse={onUse} onCopied={() => {}} onUpgrade={onUpgrade} />
        ))}
      </div>
    </div>
  );
}
