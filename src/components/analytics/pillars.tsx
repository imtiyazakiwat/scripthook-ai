import { Clock3, Flame, Sparkles, Target } from "lucide-react";
import type { Pillars as PillarsT } from "@/lib/schema";
import { cn } from "@/lib/utils";

const PILLARS: { key: keyof PillarsT; label: string; hint: string; icon: React.ElementType }[] = [
  { key: "curiosity_gap", label: "Curiosity Gap", hint: "Opens a high-stakes open loop", icon: Sparkles },
  { key: "speed_to_value", label: "Speed to Value", hint: "Zero preamble or housekeeping", icon: Clock3 },
  { key: "audience_clarity", label: "Audience Clarity", hint: "Viewer knows why to care", icon: Target },
  { key: "emotional_stakes", label: "Emotional Stakes", hint: "Urgency, shock, contrarian truth", icon: Flame },
];

/** Same bands as the overall score (≥70% strong, ≥40% leaky), scaled to 25. */
function tone(v: number) {
  if (v >= 17.5) return "bg-success";
  if (v >= 10) return "bg-warning";
  return "bg-error";
}

export function Pillars({ pillars }: { pillars: PillarsT }) {
  return (
    <div className="@container">
    <ul className="grid gap-x-6 gap-y-3 @sm:grid-cols-2">
      {PILLARS.map((p) => {
        const v = pillars[p.key];
        const Icon = p.icon;
        return (
          <li key={p.key} title={p.hint}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Icon className="size-3.5 text-muted" aria-hidden />
                {p.label}
              </span>
              <span className="font-mono tabular-nums text-muted">
                <span className="font-semibold text-foreground">{v}</span>/25
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-border">
              <div className={cn("h-full rounded", tone(v))} style={{ width: `${(v / 25) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
    </div>
  );
}
