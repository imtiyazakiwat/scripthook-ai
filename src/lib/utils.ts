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

/** Severity → design-token state colors (error / warning / muted / success). */
export const SEVERITY_META: Record<Severity, { label: string; color: string; text: string; bg: string; dot: string }> = {
  high: { label: "High drop", color: "#dc2626", text: "text-error", bg: "bg-error/10", dot: "bg-error" },
  moderate: { label: "Moderate drop", color: "#d97706", text: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
  low: { label: "Minor leak", color: "#71717a", text: "text-muted", bg: "bg-surface-hover", dot: "bg-zinc-400" },
  spike: { label: "Retention spike", color: "#16a34a", text: "text-success", bg: "bg-success/10", dot: "bg-success" },
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

/** State color for a 0–100 score, aligned with the verdict bands (strong ≥70, leaky ≥40). */
export function scoreColor(score: number): string {
  if (score >= 70) return "#16a34a";
  if (score >= 40) return "#d97706";
  return "#dc2626";
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
