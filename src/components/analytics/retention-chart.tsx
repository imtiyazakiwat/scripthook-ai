"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { baselineRetention } from "@/lib/curve";
import type { AnalysisResult } from "@/lib/schema";
import { formatTimestamp, getWpm, splitBeats } from "@/lib/script";
import { SEVERITY_META, severityOf } from "@/lib/utils";

interface Point {
  seconds: number;
  retention: number;
  benchmark: number;
  note?: string;
}

function interpolate(curve: { seconds: number; retention_pct: number }[], s: number): number {
  if (!curve.length) return 0;
  if (s <= curve[0].seconds) return curve[0].retention_pct;
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1];
    const b = curve[i];
    if (s <= b.seconds) {
      const t = (s - a.seconds) / Math.max(1, b.seconds - a.seconds);
      return a.retention_pct + (b.retention_pct - a.retention_pct) * t;
    }
  }
  return curve[curve.length - 1].retention_pct;
}

export function RetentionChart({
  result,
  activeFlag,
  onSelectFlag,
  height = 290,
}: {
  result: AnalysisResult;
  activeFlag?: number | null;
  onSelectFlag?: (i: number) => void;
  height?: number;
}) {
  const duration = result.estimated_duration_seconds;
  const beats = useMemo(() => splitBeats(result.script, getWpm(result.format, result.speaking_pace)), [result]);

  const data: Point[] = useMemo(
    () =>
      result.retention_curve.map((p) => ({
        seconds: p.seconds,
        retention: p.retention_pct,
        benchmark: Math.round(baselineRetention(p.seconds, duration, result.format, 62) * 10) / 10,
        note: p.note,
      })),
    [result, duration],
  );

  const hookWindow = result.format === "youtube_longform" ? Math.min(30, duration) : Math.min(3, duration);
  const markers = result.drop_off_flags
    .map((f, i) => ({ f, i, x: Math.min(duration, f.start_seconds ?? 0) }))
    .map((m) => ({ ...m, y: interpolate(result.retention_curve, m.x) }));

  return (
    <div style={{ height }} className="w-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 12, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="ret-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b6bff" stopOpacity={0.55} />
              <stop offset="55%" stopColor="#7c5cff" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ret-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c4b5ff" />
              <stop offset="60%" stopColor="#9a83ff" />
              <stop offset="100%" stopColor="#ff7ab6" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <ReferenceArea
            x1={0}
            x2={hookWindow}
            fill="rgba(255,77,109,0.06)"
            stroke="none"
            ifOverflow="extendDomain"
            label={{ value: "Hook window", position: "insideTopLeft", fill: "#ff8aa0", fontSize: 10, offset: 8 }}
          />
          <XAxis
            dataKey="seconds"
            type="number"
            domain={[0, duration]}
            tickFormatter={(v: number) => formatTimestamp(v)}
            tick={{ fill: "#6b6b80", fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            tickCount={7}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: "#6b6b80", fontSize: 11, fontFamily: "var(--font-geist-mono)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.25)", strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as Point;
              const beat = beats.find((b) => p.seconds >= b.start && p.seconds < b.end) ?? beats[beats.length - 1];
              return (
                <div className="max-w-[280px] rounded-xl border border-white/10 bg-ink-900/95 p-3 text-xs shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-6">
                    <span className="font-mono text-ink-300">{formatTimestamp(p.seconds)}</span>
                    <span className="font-mono text-sm font-semibold text-white">{Math.round(p.retention)}% watching</span>
                  </div>
                  {p.note && <p className="mt-1.5 font-medium text-brand-300">{p.note}</p>}
                  {beat && <p className="mt-1.5 line-clamp-3 leading-relaxed text-ink-200">“{beat.text}”</p>}
                  <p className="mt-1.5 text-[10px] text-ink-400">Niche benchmark: {Math.round(p.benchmark)}%</p>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="benchmark" stroke="rgba(255,255,255,0.22)" strokeDasharray="4 4" dot={false} strokeWidth={1.25} isAnimationActive={false} activeDot={false} />
          <Area
            type="monotone"
            dataKey="retention"
            stroke="url(#ret-stroke)"
            strokeWidth={2.5}
            fill="url(#ret-fill)"
            animationDuration={1200}
            activeDot={{ r: 5, fill: "#fff", stroke: "#7c5cff", strokeWidth: 3 }}
          />
          {markers.map(({ f, i, x, y }) => {
            const meta = SEVERITY_META[severityOf(f)];
            const active = activeFlag === i;
            return (
              <ReferenceDot
                key={i}
                x={x}
                y={y}
                ifOverflow="visible"
                shape={(props: { cx?: number; cy?: number }) => (
                  <g
                    role="button"
                    aria-label={`${meta.label} at ${f.time_range}`}
                    onClick={() => onSelectFlag?.(i)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle cx={props.cx} cy={props.cy} r={active ? 12 : 9} fill={meta.color} opacity={active ? 0.3 : 0.18} />
                    <circle cx={props.cx} cy={props.cy} r={active ? 5.5 : 4.5} fill={meta.color} stroke="#06060a" strokeWidth={2} />
                  </g>
                )}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
