"use client";

import { motion } from "framer-motion";
import { Clock3, Flame, Sparkles, Target } from "lucide-react";
import type { Pillars as PillarsT } from "@/lib/schema";

const PILLARS: { key: keyof PillarsT; label: string; hint: string; icon: React.ElementType }[] = [
  { key: "curiosity_gap", label: "Curiosity Gap", hint: "Opens a high-stakes open loop", icon: Sparkles },
  { key: "speed_to_value", label: "Speed to Value", hint: "Zero preamble or housekeeping", icon: Clock3 },
  { key: "audience_clarity", label: "Audience Clarity", hint: "Viewer knows why to care", icon: Target },
  { key: "emotional_stakes", label: "Emotional Stakes", hint: "Urgency, shock, contrarian truth", icon: Flame },
];

function barColor(v: number) {
  if (v >= 19) return "linear-gradient(90deg,#1fbf8a,#2ee6a6)";
  if (v >= 13) return "linear-gradient(90deg,#6844f5,#9a83ff)";
  if (v >= 8) return "linear-gradient(90deg,#e09a2c,#ffb547)";
  return "linear-gradient(90deg,#d63655,#ff4d6d)";
}

export function Pillars({ pillars }: { pillars: PillarsT }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {PILLARS.map((p, i) => {
        const v = pillars[p.key];
        const Icon = p.icon;
        return (
          <li key={p.key} className="group" title={p.hint}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-ink-200">
                <Icon className="size-3.5 text-ink-400" aria-hidden />
                {p.label}
              </span>
              <span className="font-mono tabular-nums text-ink-300">
                <span className="text-white">{v}</span>/25
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: barColor(v) }}
                initial={{ width: 0 }}
                animate={{ width: `${(v / 25) * 100}%` }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
