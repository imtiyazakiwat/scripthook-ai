import "server-only";
import type { PlanId } from "./plans";

/**
 * Tiny fetch-based Stripe client (no SDK, edge-friendly).
 * When STRIPE_SECRET_KEY is missing the app runs in demo billing mode.
 */

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function demoBillingEnabled(): boolean {
  if (process.env.DEMO_BILLING === "false") return false;
  if (process.env.DEMO_BILLING === "true") return true;
  return !stripeConfigured();
}

export function priceFor(plan: PlanId): string | undefined {
  if (plan === "creator") return process.env.STRIPE_PRICE_CREATOR;
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO;
  return undefined;
}

function encode(obj: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) p.append(k, String(v));
  return p.toString();
}

async function stripe<T>(method: "GET" | "POST", path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  const url = `https://api.stripe.com/v1${path}${method === "GET" && params ? `?${encode(params)}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" && params ? encode(params) : undefined,
    cache: "no-store",
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(data.error?.message || `Stripe error ${res.status}`);
  return data;
}

export interface CheckoutSession {
  id: string;
  url: string;
  status?: string;
  payment_status?: string;
  customer?: string;
  subscription?: string | { id: string; status: string };
  metadata?: Record<string, string>;
}

export function createCheckoutSession(plan: PlanId, origin: string) {
  const price = priceFor(plan);
  if (!price) throw new Error(`Missing Stripe price id for the ${plan} plan`);
  return stripe<CheckoutSession>("POST", "/checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": 1,
    allow_promotion_codes: "true",
    success_url: `${origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/studio?checkout=cancelled`,
    "metadata[plan]": plan,
    "subscription_data[metadata][plan]": plan,
  });
}

export function retrieveCheckoutSession(id: string) {
  return stripe<CheckoutSession>("GET", `/checkout/sessions/${encodeURIComponent(id)}`, { "expand[]": "subscription" });
}

export function retrieveSubscription(id: string) {
  return stripe<{ id: string; status: string; metadata?: Record<string, string> }>("GET", `/subscriptions/${encodeURIComponent(id)}`);
}

export function createPortalSession(customer: string, returnUrl: string) {
  return stripe<{ url: string }>("POST", "/billing_portal/sessions", { customer, return_url: returnUrl });
}

export function siteOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  return new URL(req.url).origin;
}
