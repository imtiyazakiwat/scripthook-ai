import type { ScriptFormat } from "./schema";
import { clamp } from "./script";

/**
 * Baseline retention model used to synthesise/repair curves.
 * Returns retention % at time t for a given hook score.
 */
export function baselineRetention(t: number, duration: number, format: ScriptFormat, hookScore: number): number {
  const q = clamp(hookScore, 0, 100) / 100;
  if (format === "youtube_longform") {
    const introLoss = 48 - q * 30; // 18%..48% lost in the first ~30s
    const floor = 100 - introLoss;
    if (t <= 30) return 100 - introLoss * (1 - Math.exp(-t / 9)) / (1 - Math.exp(-30 / 9));
    const endRatio = 0.42 + q * 0.25;
    const span = Math.max(duration - 30, 1);
    return floor * Math.pow(endRatio, (t - 30) / span);
  }
  const hookWindow = 3;
  const introLoss = (format === "tiktok_shop" ? 50 : 55) - q * 35;
  const floor = 100 - introLoss;
  if (t <= hookWindow) return 100 - introLoss * (t / hookWindow);
  const endRatio = 0.55 + q * 0.3;
  const span = Math.max(duration - hookWindow, 1);
  return floor * Math.pow(endRatio, (t - hookWindow) / span);
}

/** Evenly spaced sample timestamps including the hook window detail. */
export function sampleTimes(duration: number, format: ScriptFormat, count = 22): number[] {
  const d = Math.max(1, Math.round(duration));
  const set = new Set<number>([0]);
  const early = format === "youtube_longform" ? [3, 7, 15, 30] : [1, 2, 3, 5];
  early.filter((t) => t < d).forEach((t) => set.add(t));
  for (let i = 1; i <= count; i++) set.add(Math.round((d * i) / count));
  set.add(d);
  return [...set].filter((t) => t >= 0 && t <= d).sort((a, b) => a - b);
}
