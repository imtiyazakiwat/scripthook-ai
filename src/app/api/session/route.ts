import { NextResponse, type NextRequest } from "next/server";
import { loadSession } from "@/lib/license";
import { PLANS } from "@/lib/plans";
import { freshSession, runsLeft, writeSession, type SessionData } from "@/lib/session";
import { demoBillingEnabled, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function payload(s: SessionData) {
  const def = PLANS[s.plan];
  return {
    plan: s.plan,
    runs_left: runsLeft(s),
    limit: def.limit,
    period: def.period,
    used: s.used,
    billing: stripeConfigured() ? "stripe" : "demo",
    demo_billing: demoBillingEnabled(),
    has_portal: Boolean(s.cid) || (s.demo === true && s.plan !== "free"),
  };
}

export async function GET(req: NextRequest) {
  const { session, changed } = await loadSession(req);
  const res = NextResponse.json(payload(session), { headers: { "Cache-Control": "no-store" } });
  if (changed) await writeSession(res, session);
  return res;
}

/** Demo-only: downgrade back to Free (lets you test plan transitions without Stripe). */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const { session } = await loadSession(req);
  if (body.action !== "downgrade") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  if (!session.demo) return NextResponse.json({ error: "Use the billing portal to manage your subscription." }, { status: 400 });
  const next = freshSession("free");
  const res = NextResponse.json(payload(next));
  await writeSession(res, next);
  return res;
}
