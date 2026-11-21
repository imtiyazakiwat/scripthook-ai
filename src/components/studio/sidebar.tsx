"use client";

import { Clapperboard, History, Layers, Mic2, MonitorPlay, ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { FORMAT_META } from "@/lib/plans";
import { FORMATS, type ScriptFormat } from "@/lib/schema";
import { cn } from "@/lib/utils";

const FORMAT_ICONS: Record<ScriptFormat, React.ElementType> = {
  youtube_longform: MonitorPlay,
  youtube_shorts: Clapperboard,
  tiktok_shop: ShoppingBag,
};

const FORMAT_FOCUS: Record<ScriptFormat, string> = {
  youtube_longform: "0–30s",
  youtube_shorts: "0–3s",
  tiktok_shop: "Hook → CTA",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{children}</p>;
}

function NavButton({
  icon: Icon,
  label,
  onClick,
  active,
  meta,
  badge,
  pressed,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
  meta?: string;
  badge?: string;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        "flex w-full items-center gap-2.5 rounded px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-surface-hover font-medium text-foreground" : "text-muted hover:bg-surface-hover hover:text-foreground",
      )}
    >
      <Icon className={cn("size-4 shrink-0 transition-colors", active ? "text-accent" : "text-muted")} aria-hidden />
      <span className="flex-1 truncate">{label}</span>
      {meta && <span className="font-mono text-[11px] text-zinc-500">{meta}</span>}
      {badge && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">{badge}</span>}
    </button>
  );
}

/** Studio navigation: platform presets and tools. A drawer below `lg`, static above. */
export function Sidebar({
  open,
  onClose,
  format,
  onFormatChange,
  onOpenBatch,
  onOpenVoice,
  onOpenHistory,
  historyCount,
  hasVoice,
}: {
  open: boolean;
  onClose: () => void;
  format: ScriptFormat;
  onFormatChange: (f: ScriptFormat) => void;
  onOpenBatch: () => void;
  onOpenVoice: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  hasVoice: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} aria-hidden />}

      <aside
        id="studio-sidebar"
        aria-label="Studio navigation"
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-64 max-w-[85vw] shrink-0 flex-col border-r border-border bg-surface transition-[transform,visibility] duration-200 ease-out",
          "lg:static lg:visible lg:z-auto lg:h-full lg:translate-x-0",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="border-b border-border px-6 py-5">
          <Logo size="sm" />
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <div>
            <SectionLabel>Platform</SectionLabel>
            <div className="space-y-1" role="group" aria-label="Platform preset">
              {FORMATS.map((f) => (
                <NavButton
                  key={f}
                  icon={FORMAT_ICONS[f]}
                  label={FORMAT_META[f].label}
                  meta={FORMAT_FOCUS[f]}
                  active={format === f}
                  pressed={format === f}
                  onClick={() => onFormatChange(f)}
                />
              ))}
            </div>
            <p className="px-3 pt-3 text-xs leading-5 text-muted">{FORMAT_META[format].description}</p>
          </div>

          <div>
            <SectionLabel>Tools</SectionLabel>
            <div className="space-y-1">
              <NavButton icon={Layers} label="Batch compare" onClick={onOpenBatch} />
              <NavButton icon={Mic2} label="Voice profile" onClick={onOpenVoice} badge={hasVoice ? "On" : undefined} />
              <NavButton icon={History} label="History" onClick={onOpenHistory} badge={historyCount ? String(historyCount) : undefined} />
            </div>
          </div>
        </nav>

        <div className="border-t border-border px-6 py-4">
          <p className="flex items-start gap-2 text-xs leading-5 text-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Scripts, drafts and history stay in this browser.
          </p>
        </div>
      </aside>
    </>
  );
}
