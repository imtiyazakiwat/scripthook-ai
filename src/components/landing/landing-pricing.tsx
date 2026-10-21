"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PricingCards } from "@/components/pricing/pricing-cards";
import type { PlanId } from "@/lib/plans";

export function LandingPricing() {
  const router = useRouter();
  const [loading, setLoading] = useState<PlanId | null>(null);

  async function select(plan: PlanId) {
    if (plan === "free") return router.push("/studio");
    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(null);
    }
  }

  return <PricingCards onSelect={select} loadingPlan={loading} />;
}
