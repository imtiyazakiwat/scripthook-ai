import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DropOffFlag } from "./schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export type Severity = "high" | "moderate" | "low" | "spike";

export function severityOf(flag: Pick<DropOffFlag, "drop_pct">): Severity {
  if (flag.drop_pct < 0) return "spike";
  if (flag.drop_pct >= 40) return "high";
  if (flag.drop_pct >= 15) return "moderate";
  return "low";
}

export const SEVERITY_META: Record<Severity, { label: string; color: string; text: string; bg: string; ring: string; dot: string }> = {
  high: { label: "High drop", color: "#ff4d6d", text: "text-leak-high", bg: "bg-leak-high/10", ring: "ring-leak-high/30", dot: "bg-leak-high" },
  moderate: { label: "Moderate drop", color: "#ffb547", text: "text-leak-mid", bg: "bg-leak-mid/10", ring: "ring-leak-mid/30", dot: "bg-leak-mid" },
  low: { label: "Minor leak", color: "#c8c8d6", text: "text-ink-200", bg: "bg-white/5", ring: "ring-white/15", dot: "bg-ink-300" },
  spike: { label: "Retention spike", color: "#2ee6a6", text: "text-spike", bg: "bg-spike/10", ring: "ring-spike/30", dot: "bg-spike" },
};

export const CATEGORY_LABEL: Record<string, string> = {
  housekeeping_greeting: "Housekeeping / greeting",
  delayed_value_promise: "Delayed payoff",
  unsupported_claim: "Unsupported claim",
  monotone_pacing: "Monotone pacing",
  weak_cta: "Weak CTA",
  retention_spike: "Pattern interrupt",
  other: "Momentum leak",
};

export function scoreColor(score: number): string {
  if (score >= 75) return "#2ee6a6";
  if (score >= 55) return "#9a83ff";
  if (score >= 40) return "#ffb547";
  return "#ff4d6d";
}

/** Stable-ish device fingerprint (hashed client side, re-hashed + salted on the server). */
export async function clientFingerprint(): Promise<string> {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      String(navigator.hardwareConcurrency ?? ""),
      String((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? ""),
    ].join("|");
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 40);
  } catch {
    return "";
  }
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
