"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useId } from "react";
import { cn, scoreColor } from "@/lib/utils";

/** 270° radial meter with an animated count-up. */
export function ScoreGauge({
  score,
  size = 168,
  stroke = 12,
  label = "Hook Score",
  className,
  pending,
}: {
  score: number | null;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
  pending?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const value = useMotionValue(0);
  const display = useTransform(value, (v) => Math.round(v).toString());
  const dash = useTransform(value, (v) => `${(arc * v) / 100} ${c}`);
  const color = scoreColor(score ?? 0);

  useEffect(() => {
    const controls = animate(value, score ?? 0, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [score, value]);

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[225deg]" aria-hidden>
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(255 255 255 / 0.07)"
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${c}`}
          strokeLinecap="round"
        />
        {/* tick marks */}
        {Array.from({ length: 11 }).map((_, i) => {
          const a = (i / 10) * 270 * (Math.PI / 180);
          const r1 = r - stroke / 2 - 5;
          const r2 = r1 - (i % 5 === 0 ? 6 : 3);
          return (
            <line
              key={i}
              x1={size / 2 + r1 * Math.cos(a)}
              y1={size / 2 + r1 * Math.sin(a)}
              x2={size / 2 + r2 * Math.cos(a)}
              y2={size / 2 + r2 * Math.sin(a)}
              stroke="rgb(255 255 255 / 0.18)"
              strokeWidth={1.2}
            />
          );
        })}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#g-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ strokeDasharray: dash }}
          filter={`url(#glow-${id})`}
          className={cn(pending && "animate-pulse")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline gap-0.5">
          {score === null ? (
            <span className="font-mono text-4xl font-semibold text-ink-500">––</span>
          ) : (
            <motion.span className="font-mono text-[2.75rem] font-semibold leading-none tracking-tighter text-white tabular-nums">{display}</motion.span>
          )}
          <span className="text-sm font-medium text-ink-400">/100</span>
        </div>
        <span className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">{label}</span>
      </div>
    </div>
  );
}
