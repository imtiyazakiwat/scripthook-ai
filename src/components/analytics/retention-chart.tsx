"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalysisResult } from "@/lib/schema";
import { formatTimestamp, getWpm, splitBeats } from "@/lib/script";
import { SEVERITY_META, severityOf } from "@/lib/utils";

// Chart colors follow the design tokens (see globals.css): accent series,
// border-colored grid, muted axis text.
const SERIES_COLOR = "#f97316";
const GRID_COLOR = "#e4e4e7";
const AXIS_TEXT = "#71717a";

interface Point {
  seconds: number;
  retention: number;
  note?: string;
}

/** Position a flag marker on the AI's curve (linear between the AI's own points). */
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

  // Only the points the model returned — plotted as straight segments, nothing smoothed in between.
  const data: Point[] = useMemo(
    () => result.retention_curve.map((p) => ({ seconds: p.seconds, retention: p.retention_pct, note: p.note })),
    [result],
  );

  const hookWindow = result.format === "youtube_longform" ? Math.min(30, duration) : Math.min(3, duration);
  const markers = result.drop_off_flags
    .map((f, i) => ({ f, i, x: Math.min(duration, f.start_seconds ?? 0) }))
    .map((m) => ({ ...m, y: interpolate(result.retention_curve, m.x) }));

  return (
    <div style={{ height }} className="w-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
          <ReferenceArea
            x1={0}
            x2={hookWindow}
            fill={SERIES_COLOR}
            fillOpacity={0.07}
            stroke="none"
            ifOverflow="extendDomain"
            label={{ value: "Hook window", position: "insideTopLeft", fill: "#ea580c", fontSize: 11, offset: 8 }}
          />
          <XAxis
            dataKey="seconds"
            type="number"
            domain={[0, duration]}
            tickFormatter={(v: number) => formatTimestamp(v)}
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            stroke={GRID_COLOR}
            tickLine={false}
            tickCount={7}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const pt = payload[0].payload as Point;
              const beat = beats.find((b) => pt.seconds >= b.start && pt.seconds < b.end) ?? beats[beats.length - 1];
              return (
                <div className="max-w-[280px] rounded border border-border bg-background px-3 py-2 text-xs shadow-lg">
                  <div className="flex items-center justify-between gap-6">
                    <span className="font-mono text-muted">{formatTimestamp(pt.seconds)}</span>
                    <span className="font-semibold text-foreground">{Math.round(pt.retention)}% watching</span>
                  </div>
                  {pt.note && <p className="mt-1.5 font-medium text-accent">{pt.note}</p>}
                  {beat && <p className="mt-1.5 line-clamp-3 leading-relaxed text-foreground">“{beat.text}”</p>}
                </div>
              );
            }}
          />
          <Area
            type="linear"
            dataKey="retention"
            stroke={SERIES_COLOR}
            strokeWidth={2}
            fill={SERIES_COLOR}
            fillOpacity={0.08}
            isAnimationActive={false}
            dot={{ r: 2.5, fill: SERIES_COLOR, stroke: SERIES_COLOR }}
            activeDot={{ r: 4, fill: SERIES_COLOR, stroke: "#ffffff", strokeWidth: 2 }}
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
                    tabIndex={0}
                    aria-label={`${meta.label} at ${f.time_range}`}
                    onClick={() => onSelectFlag?.(i)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelectFlag?.(i)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle cx={props.cx} cy={props.cy} r={active ? 12 : 9} fill={meta.color} opacity={active ? 0.25 : 0.14} />
                    <circle cx={props.cx} cy={props.cy} r={active ? 5.5 : 4.5} fill={meta.color} stroke="#ffffff" strokeWidth={2} />
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
