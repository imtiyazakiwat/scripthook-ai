"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  locked?: boolean;
  title?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  size?: "sm" | "md";
  className?: string;
  ariaLabel: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("relative inline-flex items-center gap-0.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              active ? "text-white" : "text-ink-300 hover:text-ink-100",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 -z-10 rounded-lg bg-white/[0.1] shadow-[0_1px_0_0_rgb(255_255_255/0.08)_inset,0_4px_12px_-4px_rgb(0_0_0/0.6)]"
              />
            )}
            {o.icon}
            {o.label}
            {o.locked && (
              <svg viewBox="0 0 16 16" className="size-3 text-ink-400" aria-label="Locked" fill="currentColor">
                <path d="M5 7V5a3 3 0 1 1 6 0v2h.5A1.5 1.5 0 0 1 13 8.5v5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5v-5A1.5 1.5 0 0 1 4.5 7H5Zm1.5 0h3V5a1.5 1.5 0 1 0-3 0v2Z" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
