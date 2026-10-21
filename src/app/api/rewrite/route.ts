import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { chatComplete, describeAiError, getAiConfig, isAuthError } from "@/lib/ai";
import { loadSession } from "@/lib/license";
import { extractJson } from "@/lib/normalize";
import { PLANS } from "@/lib/plans";
import { buildRewritePrompt } from "@/lib/prompts";
import { FORMATS } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Two 25s attempts must fit inside the function limit.
export const maxDuration = 60;

const ATTEMPT_TIMEOUT_MS = 25_000;
const LABELS = ["Tight", "Natural", "Bold"];

const Body = z.object({
  text: z.string().min(3).max(2500),
  context: z.string().max(4000).optional(),
  format: z.enum(FORMATS).default("youtube_longform"),
  mode: z.enum(["deslop", "fix"]).default("deslop"),
  voice_profile: z.string().max(1500).optional(),
});

interface RewriteOption {
  label: string;
  text: string;
  note: string;
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Select 3–2,500 characters of script to rewrite." }, { status: 400 });

  const { session } = await loadSession(req);
  const plan = PLANS[session.plan];
  const { mode } = parsed.data;
  if (mode === "deslop" && !plan.deslop) {
    return NextResponse.json({ error: "De-Slop rewrites are a Pro feature.", code: "plan_required", required: "pro" }, { status: 403 });
  }
  if (mode === "fix" && session.plan === "free") {
    return NextResponse.json({ error: "Beat rewrites are available on Creator and Pro.", code: "plan_required", required: "creator" }, { status: 403 });
  }

  const cfg = getAiConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "AI rewrites are unavailable: no AI provider is configured on this server (AI_API_KEY is missing).", code: "ai_not_configured" },
      { status: 503 },
    );
  }

  const { system, user } = buildRewritePrompt({
    ...parsed.data,
    voiceProfile: plan.voiceProfiles ? parsed.data.voice_profile : undefined,
  });

  const failures: string[] = [];
  for (const model of [cfg.model, cfg.fallbackModel].filter(Boolean) as string[]) {
    try {
      const text = await chatComplete(cfg, {
        model,
        json: true,
        temperature: 0.8,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const data = extractJson(text) as { options?: Partial<RewriteOption>[] };
      const options = (Array.isArray(data.options) ? data.options : [])
        .filter((o) => typeof o?.text === "string" && o.text.trim())
        .slice(0, 3)
        .map((o, i) => ({ label: o.label?.trim() || LABELS[i], text: o.text!.trim(), note: o.note?.trim() || "" }));
      if (options.length) return NextResponse.json({ options, model });
      failures.push(`${model} returned no usable rewrites`);
    } catch (err) {
      const reason = `${model} ${describeAiError(err, ATTEMPT_TIMEOUT_MS)}`;
      failures.push(reason);
      console.error(`[rewrite] ${reason} —`, (err as Error)?.message);
      if (isAuthError(err)) {
        return NextResponse.json(
          { error: "The AI provider rejected this server’s API key, so no rewrite was generated.", code: "ai_auth", details: failures },
          { status: 502 },
        );
      }
    }
  }
  return NextResponse.json({ error: "The AI model didn't return a rewrite.", code: "ai_failed", details: failures }, { status: 502 });
}
