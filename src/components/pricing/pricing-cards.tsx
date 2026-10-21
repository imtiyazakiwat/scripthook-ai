"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingCards({
  current,
  onSelect,
  loadingPlan,
  compact,
}: {
  current?: PlanId;
  onSelect: (plan: PlanId) => void;
  loadingPlan?: PlanId | null;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-4", compact ? "md:grid-cols-3" : "lg:grid-cols-3")}>
      {(Object.keys(PLANS) as PlanId[]).map((id) => {
        const p = PLANS[id];
        const featured = id === "creator";
        const isCurrent = current === id;
        return (
          <div
            key={id}
            className={cn(
              "relative flex flex-col rounded-3xl border p-6",
              featured
                ? "border-brand-400/40 bg-[linear-gradient(180deg,rgb(124_92_255/0.16),rgb(124_92_255/0.03))] shadow-[0_30px_80px_-30px_rgb(124_92_255/0.6)]"
                : "border-white/[0.08] bg-white/[0.02]",
            )}
          >
            {featured && (
              <span className="absolute -top-3 left-6 rounded-full bg-[linear-gradient(90deg,#7c5cff,#ff4f9a)] px-3 py-1 text-[11px] font-semibold text-white shadow-lg">
                Most popular
              </span>
            )}
            <h3 className="text-base font-semibold text-white">{p.name}</h3>
            <p className="mt-0.5 text-[13px] text-ink-400">{p.tagline}</p>
            <p className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-white">${p.price}</span>
              <span className="text-sm text-ink-400">{p.price ? "/mo" : "forever"}</span>
            </p>
            <ul className="mt-5 space-y-2.5 text-[13.5px]">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-ink-200">
                  <Check className={cn("mt-0.5 size-4 shrink-0", featured ? "text-brand-300" : "text-ink-400")} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              <Button
                className="w-full"
                variant={featured ? "primary" : "secondary"}
                disabled={isCurrent}
                loading={loadingPlan === id}
                onClick={() => onSelect(id)}
              >
                {isCurrent ? "Current plan" : id === "free" ? "Start free" : `Get ${p.name}`}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
