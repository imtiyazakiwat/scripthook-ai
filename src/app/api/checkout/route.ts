import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { loadSession } from "@/lib/license";
import { freshSession, writeSession } from "@/lib/session";
import { createCheckoutSession, demoBillingEnabled, siteOrigin, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ plan: z.enum(["creator", "pro"]) });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose the Creator or Pro plan." }, { status: 400 });
  const { plan } = parsed.data;

  if (stripeConfigured()) {
    try {
      const checkout = await createCheckoutSession(plan, siteOrigin(req));
      return NextResponse.json({ url: checkout.url, mode: "stripe" });
    } catch (err) {
      console.error("[checkout]", err);
      return NextResponse.json({ error: (err as Error).message || "Could not start checkout." }, { status: 502 });
    }
  }

  if (!demoBillingEnabled()) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }

  // Demo billing: instantly activate the plan in the signed cookie.
  const { session } = await loadSession(req);
  const next = { ...freshSession(plan), demo: true, used: session.plan === plan ? session.used : 0 };
  const res = NextResponse.json({ url: `/studio?checkout=success&plan=${plan}`, mode: "demo" });
  await writeSession(res, next);
  return res;
}
