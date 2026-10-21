"use client";

import { Clapperboard, Crown, History, Layers, Mic2, MonitorPlay, ShoppingBag, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import type { SessionInfo } from "@/hooks/use-session";
import { FORMAT_META, PLANS } from "@/lib/plans";
import type { ScriptFormat } from "@/lib/schema";
import { cn } from "@/lib/utils";

const FORMAT_ICONS: Record<ScriptFormat, React.ReactNode> = {
  youtube_longform: <MonitorPlay className="size-3.5" aria-hidden />,
  youtube_shorts: <Clapperboard className="size-3.5" aria-hidden />,
  tiktok_shop: <ShoppingBag className="size-3.5" aria-hidden />,
};

function RunsCounter({ session, compact }: { session: SessionInfo | null; compact?: boolean }) {
  if (!session) return <div className="skeleton h-8 w-40 rounded-full" />;
  const { runs_left, limit, plan, period } = session;
  if (limit === null) {
    return (
      <div className="flex h-8 items-center gap-2 rounded-full border border-spike/20 bg-spike/10 px-3 text-xs font-medium text-spike">
        <Sparkles className="size-3.5" aria-hidden /> Unlimited runs
      </div>
    );
  }
  const left = runs_left ?? 0;
  const pct = limit ? left / limit : 0;
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium",
        left === 0 ? "border-leak-high/25 bg-leak-high/10 text-leak-high" : "border-white/10 bg-white/[0.04] text-ink-200",
      )}
      aria-live="polite"
    >
      <svg viewBox="0 0 18 18" className="size-4 -rotate-90" aria-hidden>
        <circle cx="9" cy="9" r={r} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="2.5" />
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          stroke={left === 0 ? "#ff4d6d" : "#9a83ff"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          className="transition-all duration-700"
        />
      </svg>
      <span className="whitespace-nowrap tabular-nums">
        {compact ? `${left}/${limit} left` : `${left} of ${limit} ${plan === "free" ? "free runs" : "runs"} left`}
        <span className="hidden text-ink-400 xl:inline">{period === "day" ? " today" : " this month"}</span>
      </span>
    </div>
  );
}

export function TopBar({
  format,
  onFormatChange,
  session,
  onUpgrade,
  onManageBilling,
  onOpenHistory,
  onOpenBatch,
  onOpenVoice,
  historyCount,
}: {
  format: ScriptFormat;
  onFormatChange: (f: ScriptFormat) => void;
  session: SessionInfo | null;
  onUpgrade: () => void;
  onManageBilling: () => void;
  onOpenHistory: () => void;
  onOpenBatch: () => void;
  onOpenVoice: () => void;
  historyCount: number;
}) {
  const plan = PLANS[session?.plan ?? "free"];
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-3 px-3 sm:px-5">
        <Logo
          href="/"
          suffix={
            <span className="ml-1 hidden rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-400 sm:inline">
              Studio
            </span>
          }
        />

        <div className="mx-auto hidden md:block">
          <Segmented
            ariaLabel="Platform preset"
            value={format}
            onChange={onFormatChange}
            options={(Object.keys(FORMAT_META) as ScriptFormat[]).map((f) => ({
              value: f,
              label: FORMAT_META[f].short,
              icon: FORMAT_ICONS[f],
              locked: !plan.formats.includes(f),
              title: FORMAT_META[f].description,
            }))}
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <div className="hidden sm:block">
            <RunsCounter session={session} />
          </div>
          <div className="mx-1 hidden h-5 w-px bg-white/10 lg:block" />
          <Button variant="ghost" size="sm" onClick={onOpenHistory} aria-label="History" title="Analysis history" className="relative px-2">
            <History className="size-4" />
            {historyCount > 0 && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-brand-400" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpenBatch} aria-label="Batch compare" title="Batch compare (Pro)" className="hidden px-2 sm:inline-flex">
            <Layers className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpenVoice} aria-label="Creator voice" title="Creator voice profile (Pro)" className="hidden px-2 sm:inline-flex">
            <Mic2 className="size-4" />
          </Button>
          {session?.plan && session.plan !== "free" ? (
            <Button variant="secondary" size="sm" onClick={onManageBilling} className="ml-1">
              <Crown className="size-3.5 text-amber-300" aria-hidden />
              {plan.name}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={onUpgrade} className="ml-1">
              <Sparkles className="size-3.5" aria-hidden />
              Upgrade
            </Button>
          )}
        </div>
      </div>
      {/* mobile preset row */}
      <div className="flex items-center justify-between gap-2 border-t border-white/[0.04] px-3 py-2 md:hidden">
        <Segmented
          ariaLabel="Platform preset"
          size="sm"
          value={format}
          onChange={onFormatChange}
          className="no-scrollbar max-w-full overflow-x-auto"
          options={(Object.keys(FORMAT_META) as ScriptFormat[]).map((f) => ({
            value: f,
            label: { youtube_longform: "Long", youtube_shorts: "Shorts", tiktok_shop: "Shop" }[f],
            icon: FORMAT_ICONS[f],
            locked: !plan.formats.includes(f),
          }))}
        />
        <div className="shrink-0 sm:hidden">
          <RunsCounter session={session} compact />
        </div>
      </div>
    </header>
  );
}
