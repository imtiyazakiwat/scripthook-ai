import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { chatComplete, getAiConfig } from "@/lib/ai";
import { loadSession } from "@/lib/license";
import { extractJson } from "@/lib/normalize";
import { PLANS } from "@/lib/plans";
import { buildRewritePrompt } from "@/lib/prompts";
import { FORMATS } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
  if (!cfg) return NextResponse.json({ error: "AI provider is not configured." }, { status: 503 });

  const { system, user } = buildRewritePrompt({
    ...parsed.data,
    voiceProfile: plan.voiceProfiles ? parsed.data.voice_profile : undefined,
  });

  for (const model of [cfg.model, cfg.fallbackModel].filter(Boolean) as string[]) {
    try {
      const text = await chatComplete(cfg, {
        model,
        json: true,
        temperature: 0.8,
        signal: AbortSignal.timeout(25_000),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const data = extractJson(text) as { options?: Partial<RewriteOption>[] };
      const options = (data.options ?? [])
        .filter((o) => typeof o?.text === "string" && o.text.trim())
        .slice(0, 3)
        .map((o, i) => ({ label: o.label?.trim() || ["Tight", "Natural", "Bold"][i], text: o.text!.trim(), note: o.note?.trim() || "" }));
      if (options.length) return NextResponse.json({ options });
    } catch (err) {
      console.error(`[rewrite] ${model} failed:`, (err as Error).message);
    }
  }
  return NextResponse.json({ error: "The rewrite engine is busy. Please try again." }, { status: 502 });
}
