import { NextResponse } from "next/server";
import { getAiConfig } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Whether analysis can run at all, so the UI can say so before anyone pastes a script.
 * Reports configuration only — it does not call the provider.
 */
export function GET() {
  const cfg = getAiConfig();
  return NextResponse.json(
    cfg
      ? { ai: { configured: true, model: cfg.model, fallback_model: cfg.fallbackModel ?? null, deep_model: cfg.deepModel } }
      : { ai: { configured: false } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
