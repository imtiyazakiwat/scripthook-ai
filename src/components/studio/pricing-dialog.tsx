"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { Dialog } from "@/components/ui/dialog";
import type { SessionInfo } from "@/hooks/use-session";
import type { PlanId } from "@/lib/plans";

export type UpgradeReason = "limit" | "format" | "hooks" | "fixes" | "teleprompter" | "batch" | "deslop" | "voice" | "deep" | "manual";

const COPY: Record<UpgradeReason, { title: string; body: string }> = {
  limit: { title: "You’ve hit your analysis limit", body: "Upgrade to keep stress-testing scripts before you film." },
  format: { title: "Unlock Shorts & TikTok Shop presets", body: "Platform-tuned simulations for 0–3s scroll-stops, loops and shop CTAs." },
  hooks: { title: "Unlock all 8 viral hook rewrites", body: "Every framework, written for your script, ready to copy." },
  fixes: { title: "Unlock 1-click beat fixes", body: "Replace every leaky line with a rewrite in your voice." },
  teleprompter: { title: "Unlock the Teleprompter", body: "Time-coded, auto-scrolling, mirror-ready script view for filming." },
  batch: { title: "Batch compare is a Pro feature", body: "Analyze up to 5 script drafts side by side and pick the winner." },
  deslop: { title: "De-Slop rewrites are a Pro feature", body: "Strip AI-sounding filler from any segment while keeping your meaning." },
  voice: { title: "Creator voice profiles are Pro", body: "Every hook and fix written in your tone, rhythm and vocabulary." },
  deep: { title: "Deep analysis is for paid plans", body: "A slower, higher-precision model for scripts that really matter." },
  manual: { title: "Choose your plan", body: "Pre-production retention diagnostics for every upload." },
};

export function PricingDialog({
  open,
  onOpenChange,
  reason,
  session,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reason: UpgradeReason;
  session: SessionInfo | null;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState<PlanId | null>(null);
  const copy = COPY[reason];

  async function select(plan: PlanId) {
    if (plan === "free") {
      onOpenChange(false);
      return;
    }
    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; mode?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");
      if (data.mode === "demo") {
        onChanged();
        onOpenChange(false);
        toast.success(`${plan === "pro" ? "Pro" : "Creator"} unlocked`, { description: "Demo billing — no card was charged." });
        window.history.replaceState(null, "", "/studio");
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={copy.title} description={copy.body} className="max-w-4xl p-6 sm:p-8">
      <PricingCards current={session?.plan} onSelect={select} loadingPlan={loading} compact />
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-ink-400">
        <ShieldCheck className="size-3.5" aria-hidden />
        {session?.billing === "demo"
          ? "Demo billing mode — plans activate instantly, no card required."
          : "Secure checkout by Stripe · Cancel anytime · No account needed"}
      </p>
    </Dialog>
  );
}
