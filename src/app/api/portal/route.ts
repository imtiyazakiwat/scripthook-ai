import { NextResponse, type NextRequest } from "next/server";
import { loadSession } from "@/lib/license";
import { createPortalSession, siteOrigin, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { session } = await loadSession(req);
  if (session.demo) return NextResponse.json({ mode: "demo" });
  if (!session.cid || !stripeConfigured()) {
    return NextResponse.json({ error: "No active subscription found on this browser." }, { status: 404 });
  }
  try {
    const portal = await createPortalSession(session.cid, `${siteOrigin(req)}/studio`);
    return NextResponse.json({ url: portal.url, mode: "stripe" });
  } catch (err) {
    console.error("[portal]", err);
    return NextResponse.json({ error: "Could not open the billing portal." }, { status: 502 });
  }
}
