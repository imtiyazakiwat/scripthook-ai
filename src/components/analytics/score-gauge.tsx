import { cn, scoreColor } from "@/lib/utils";

/** Round so server (Node) and client (browser) serialize identical SVG attributes — avoids hydration mismatches. */
const p = (n: number) => Math.round(n * 1000) / 1000;

/** Flat 270° radial meter. Track in the border token, arc in the score's state color. */
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
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const value = score === null ? null : Math.max(0, Math.min(100, Math.round(score)));
  const center = size / 2;

  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={value === null ? `${label}: calculating` : `${label}: ${value} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[225deg]" aria-hidden>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={stroke}
          strokeDasharray={`${p(arc)} ${p(c)}`}
          strokeLinecap="round"
        />
        {Array.from({ length: 11 }).map((_, i) => {
          const a = (i / 10) * 270 * (Math.PI / 180);
          const r1 = r - stroke / 2 - 5;
          const r2 = r1 - (i % 5 === 0 ? 6 : 3);
          return (
            <line
              key={i}
              x1={p(center + r1 * Math.cos(a))}
              y1={p(center + r1 * Math.sin(a))}
              x2={p(center + r2 * Math.cos(a))}
              y2={p(center + r2 * Math.sin(a))}
              stroke="#d4d4d8"
              strokeWidth={1.2}
            />
          );
        })}
        {value !== null && value > 0 && (
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke={scoreColor(value)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${p((arc * value) / 100)} ${p(c)}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-baseline gap-0.5">
          {value === null ? (
            <span className={cn("font-mono font-semibold text-zinc-300", pending && "animate-pulse")} style={{ fontSize: Math.round(size * 0.22) }}>
              ––
            </span>
          ) : (
            <span className="font-black leading-none tracking-tight text-foreground tabular-nums" style={{ fontSize: Math.round(size * 0.26) }}>
              {value}
            </span>
          )}
          <span className={cn("font-medium text-muted", size >= 140 ? "text-sm" : "text-xs")}>/100</span>
        </div>
        <span className={cn("mt-1 font-semibold uppercase tracking-wider text-muted", size >= 140 ? "text-[11px]" : "text-[9px]")}>{label}</span>
      </div>
    </div>
  );
}
