import "server-only";
import type { NextRequest } from "next/server";
import { PLANS, type PlanId } from "./plans";
import type { ScriptAnalysis } from "./schema";
import { freshSession, readSession, type SessionData } from "./session";
import { retrieveSubscription, stripeConfigured } from "./stripe";

const REVERIFY_MS = 12 * 60 * 60 * 1000;
const ACTIVE = new Set(["active", "trialing", "past_due"]);

/**
 * Open access (default): every visitor gets the full feature set with no
 * usage cap, so nothing is ever locked. The plan, billing and usage logic
 * below is untouched — set OPEN_ACCESS=false to enforce Free/Creator/Pro.
 */
export function openAccess(): boolean {
  return process.env.OPEN_ACCESS !== "false";
}

/**
 * Read the session and — for real Stripe subscriptions — periodically
 * re-verify the subscription is still active (stateless revocation).
 */
export async function loadSession(req: NextRequest): Promise<{ session: SessionData; changed: boolean }> {
  const session = await readSession(req);
  // Elevated in memory only. Callers must not sign this session into the cookie,
  // otherwise visitors would keep Pro after OPEN_ACCESS is turned off.
  if (openAccess()) return { session: { ...session, plan: "pro" }, changed: false };
  if (session.plan === "free" || session.demo || !session.sub || !stripeConfigured()) {
    return { session, changed: false };
  }
  if (session.verifiedAt && Date.now() - session.verifiedAt < REVERIFY_MS) return { session, changed: false };
  try {
    const sub = await retrieveSubscription(session.sub);
    if (!ACTIVE.has(sub.status)) return { session: freshSession("free"), changed: true };
    return { session: { ...session, verifiedAt: Date.now() }, changed: true };
  } catch {
    // Stripe unreachable: keep access, retry next request
    return { session, changed: false };
  }
}

const LOCKED_HOOK = "Unlock Creator to reveal this ready-to-speak hook rewrite tailored to your script.";
const LOCKED_FIX = "Upgrade to Creator to unlock the 1-click rewrite for this beat.";

/** Strip paid-only content server-side so it never reaches free clients. */
export function gateAnalysis(a: ScriptAnalysis, plan: PlanId): ScriptAnalysis {
  const def = PLANS[plan];
  let fixesShown = 0;
  return {
    ...a,
    hook_variants: a.hook_variants.map((h, i) =>
      i < def.unlockedHooks ? h : { framework: h.framework, hook_text: LOCKED_HOOK, why_it_works: "", locked: true },
    ),
    drop_off_flags: a.drop_off_flags.map((f) => {
      if (f.drop_pct <= 0) return f;
      if (fixesShown < def.unlockedFixes) {
        fixesShown++;
        return f;
      }
      return { ...f, recommended_fix: LOCKED_FIX, locked: true };
    }),
  };
}
