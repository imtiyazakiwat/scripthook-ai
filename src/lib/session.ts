import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest, NextResponse } from "next/server";
import { PLANS, isPlanId, type PlanId } from "./plans";

/**
 * Stateless, DB-free licensing (PRD FR-4.1):
 *  - plan + usage live in a signed HttpOnly JWT cookie (`auth_token`)
 *  - free-tier abuse is additionally throttled by a hashed IP + client
 *    fingerprint sliding window kept in instance memory.
 */

export const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months

export interface SessionData {
  plan: PlanId;
  /** usage window key: YYYY-MM-DD for free, YYYY-MM for paid */
  window: string;
  used: number;
  /** stripe customer / subscription for paid plans */
  cid?: string;
  sub?: string;
  /** last time the subscription was re-verified with Stripe (ms) */
  verifiedAt?: number;
  /** whether the plan came from demo billing */
  demo?: boolean;
}

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET || process.env.AI_API_KEY || "scripthook-dev-only-secret-change-me";
  return new TextEncoder().encode(s);
}

export function currentWindow(plan: PlanId, now = new Date()): string {
  const iso = now.toISOString();
  return PLANS[plan].period === "day" ? iso.slice(0, 10) : iso.slice(0, 7);
}

export function freshSession(plan: PlanId = "free"): SessionData {
  return { plan, window: currentWindow(plan), used: 0 };
}

export async function readSession(req: NextRequest): Promise<SessionData> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return freshSession();
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const plan = isPlanId(payload.plan) ? payload.plan : "free";
    const s: SessionData = {
      plan,
      window: typeof payload.window === "string" ? payload.window : currentWindow(plan),
      used: typeof payload.used === "number" ? payload.used : 0,
      cid: typeof payload.cid === "string" ? payload.cid : undefined,
      sub: typeof payload.sub === "string" ? payload.sub : undefined,
      verifiedAt: typeof payload.verifiedAt === "number" ? payload.verifiedAt : undefined,
      demo: payload.demo === true ? true : undefined,
    };
    // roll the usage window
    const w = currentWindow(plan);
    if (s.window !== w) {
      s.window = w;
      s.used = 0;
    }
    return s;
  } catch {
    return freshSession();
  }
}

export async function signSession(s: SessionData): Promise<string> {
  const { sub, ...rest } = s;
  const jwt = new SignJWT({ ...rest, ...(sub ? { sub } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`);
  return jwt.sign(secret());
}

export async function writeSession(res: NextResponse, s: SessionData): Promise<void> {
  res.cookies.set(COOKIE_NAME, await signSession(s), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function runsLeft(s: SessionData): number | null {
  const limit = PLANS[s.plan].limit;
  return limit === null ? null : Math.max(0, limit - s.used);
}

/* ───────────── IP / fingerprint sliding window (best effort) ───────────── */

const WINDOW_MS = 24 * 60 * 60 * 1000;
const hits = new Map<string, number[]>();

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

async function keysFor(req: NextRequest): Promise<string[]> {
  const salt = process.env.SESSION_SECRET || "salt";
  const keys = [`ip:${await sha256(salt + clientIp(req))}`];
  const fp = req.headers.get("x-client-fp");
  if (fp && /^[a-f0-9]{8,64}$/i.test(fp)) keys.push(`fp:${await sha256(salt + fp)}`);
  return keys;
}

function prune(list: number[], now: number) {
  while (list.length && now - list[0] > WINDOW_MS) list.shift();
}

/** Returns how many free runs the network/device identity has used in 24h. */
export async function identityUsage(req: NextRequest): Promise<number> {
  const now = Date.now();
  let max = 0;
  for (const k of await keysFor(req)) {
    const list = hits.get(k) ?? [];
    prune(list, now);
    max = Math.max(max, list.length);
  }
  return max;
}

export async function recordIdentityHit(req: NextRequest): Promise<void> {
  const now = Date.now();
  for (const k of await keysFor(req)) {
    const list = hits.get(k) ?? [];
    prune(list, now);
    list.push(now);
    hits.set(k, list);
  }
  if (hits.size > 50_000) hits.clear(); // memory guard
}

/** IP-level ceiling is looser than the per-device limit to tolerate shared networks. */
export const FREE_IDENTITY_CEILING = 6;
