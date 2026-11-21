import { NextResponse, type NextRequest } from "next/server";
import { isPlanId } from "@/lib/plans";
import { freshSession, writeSession } from "@/lib/session";
import { retrieveCheckoutSession, siteOrigin, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe redirects here after checkout; we verify and issue the signed license cookie. */
export async function GET(req: NextRequest) {
  const origin = siteOrigin(req);
  const id = req.nextUrl.searchParams.get("session_id");
  if (!id || !stripeConfigured()) return NextResponse.redirect(`${origin}/studio?checkout=error`);
  try {
    const cs = await retrieveCheckoutSession(id);
    const sub = typeof cs.subscription === "string" ? { id: cs.subscription, status: "active" } : cs.subscription;
    const plan = cs.metadata?.plan;
    if (cs.status !== "complete" || !sub || !isPlanId(plan) || plan === "free") {
      return NextResponse.redirect(`${origin}/studio?checkout=error`);
    }
    const res = NextResponse.redirect(`${origin}/studio?checkout=success&plan=${plan}`);
    await writeSession(res, { ...freshSession(plan), cid: cs.customer, sub: sub.id, verifiedAt: Date.now() });
    return res;
  } catch (err) {
    console.error("[checkout/success]", err);
    return NextResponse.redirect(`${origin}/studio?checkout=error`);
  }
}
