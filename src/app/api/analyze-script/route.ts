import { NextResponse, type NextRequest } from "next/server";
import { chatStream, getAiConfig, type AiConfig, type ChatMessage } from "@/lib/ai";
import { buildHookVariants, extractTopic, heuristicAnalysis } from "@/lib/heuristics";
import { gateAnalysis, loadSession } from "@/lib/license";
import { extractJson, normalizeAnalysis, type NormalizeContext } from "@/lib/normalize";
import { FORMAT_META, PLANS } from "@/lib/plans";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import {
  AnalyzeRequestSchema,
  MAX_SCRIPT_CHARS,
  MIN_SCRIPT_WORDS,
  type AnalysisResult,
  type AnalyzeStreamEvent,
  type ScriptAnalysis,
} from "@/lib/schema";
import { countWords, estimateSeconds, getWpm, splitBeats, stripDirectorNotes } from "@/lib/script";
import { FREE_IDENTITY_CEILING, identityUsage, recordIdentityHit, runsLeft, writeSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Rough size of a complete minified analysis — drives the progress bar. */
const EXPECTED_OUTPUT_CHARS = 6500;

type Send = (e: AnalyzeStreamEvent) => void;

function jsonError(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status });
}

/** Stream one model, emitting progress + early partials, and return a validated analysis. */
async function runModel(
  cfg: AiConfig,
  model: string,
  messages: ChatMessage[],
  ctx: NormalizeContext,
  timeoutMs: number,
  send: Send,
): Promise<ScriptAnalysis> {
  let lastPct = 0;
  let sentScore = false;
  let sentCritique = false;
  let stage: "simulating" | "scoring" | "rewriting" = "simulating";

  const text = await chatStream(
    cfg,
    { model, messages, json: true, temperature: 0.55, maxTokens: 8192, signal: AbortSignal.timeout(timeoutMs) },
    (_delta, full) => {
      const pct = Math.min(95, Math.round((full.length / EXPECTED_OUTPUT_CHARS) * 100));
      if (pct >= lastPct + 3) {
        lastPct = pct;
        send({ type: "progress", pct });
      }
      if (!sentScore) {
        const m = full.match(/"hook_score"\s*:\s*(\d{1,3})/);
        if (m) {
          sentScore = true;
          send({ type: "partial", hook_score: Math.min(100, Number(m[1])) });
        }
      }
      if (!sentCritique) {
        const m = full.match(/"hook_critique"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) {
          sentCritique = true;
          try {
            send({ type: "partial", hook_critique: JSON.parse(`"${m[1]}"`) });
          } catch {
            /* partial escape sequence — skip */
          }
        }
      }
      if (stage === "simulating" && full.includes('"drop_off_flags"')) {
        stage = "scoring";
        send({ type: "stage", stage: "scoring", label: "Flagging leaky beats" });
      }
      if (stage === "scoring" && full.includes('"hook_variants"')) {
        stage = "rewriting";
        send({ type: "stage", stage: "rewriting", label: "Writing 8 viral hook variants" });
      }
    },
  );
  return normalizeAnalysis(extractJson(text), ctx);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Request body must be valid JSON.");
  }
  const parsed = AnalyzeRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Invalid request: provide `script`, `format` and `speaking_pace`.");
  const { format, speaking_pace, strip_director_notes } = parsed.data;
  const rawScript = parsed.data.script ?? "";

  // ── Validation (PRD §6) ─────────────────────────────────────────────
  if (rawScript.length > MAX_SCRIPT_CHARS) {
    return jsonError(400, `Script exceeds ${MAX_SCRIPT_CHARS.toLocaleString()} characters.`, { code: "too_long" });
  }
  const script = strip_director_notes ? stripDirectorNotes(rawScript) : rawScript.trim();
  const wordCount = countWords(script);
  if (wordCount < MIN_SCRIPT_WORDS) {
    return jsonError(400, `Script is too short — add at least ${MIN_SCRIPT_WORDS} spoken words.`, { code: "too_short" });
  }

  // ── Licensing & rate limiting ───────────────────────────────────────
  const { session } = await loadSession(req);
  const plan = PLANS[session.plan];
  if (!plan.formats.includes(format)) {
    return jsonError(403, `The ${FORMAT_META[format].label} preset is available on Creator and Pro.`, {
      code: "plan_required",
      required: "creator",
    });
  }
  const left = runsLeft(session);
  if (left !== null && left <= 0) {
    return jsonError(429, plan.period === "day" ? "You've used today's free analyses." : "You've used this month's analyses.", {
      code: "limit_reached",
      plan: session.plan,
    });
  }
  if (session.plan === "free" && (await identityUsage(req)) >= FREE_IDENTITY_CEILING) {
    return jsonError(429, "Daily free limit reached on this network.", { code: "limit_reached", plan: session.plan });
  }

  const depth = session.plan !== "free" ? parsed.data.depth : "fast";
  const voiceProfile = plan.voiceProfiles ? parsed.data.voice_profile : undefined;
  const nextSession = { ...session, used: session.used + 1 };
  if (session.plan === "free") await recordIdentityHit(req);

  const wpm = getWpm(format, speaking_pace);
  const durationSeconds = estimateSeconds(wordCount, format, speaking_pace);
  const beats = splitBeats(script, wpm);
  const ctx: NormalizeContext = { durationSeconds, format };

  async function run(send: Send) {
    send({ type: "meta", plan: session.plan, runs_left: runsLeft(nextSession) });
    send({ type: "stage", stage: "sanitizing", label: "Calibrating pacing & beats" });

    const cfg = getAiConfig();
    let analysis: ScriptAnalysis | null = null;
    let source: AnalysisResult["source"] = "ai";
    let modelUsed: string | undefined;

    if (cfg) {
      const messages: ChatMessage[] = [
        { role: "system", content: buildSystemPrompt(format) },
        { role: "user", content: buildUserPrompt({ script, beats, durationSeconds, wpm, voiceProfile }) },
      ];
      // Model cascade — every attempt is streamed (the proxy times out long non-streamed calls).
      const attempts =
        depth === "deep"
          ? [
              { model: cfg.deepModel, timeout: 40_000 },
              { model: cfg.model, timeout: 15_000 },
            ]
          : [
              { model: cfg.model, timeout: 20_000 },
              { model: cfg.model, timeout: 18_000 },
              { model: cfg.fallbackModel, timeout: 16_000 },
            ];
      send({ type: "stage", stage: "simulating", label: "Simulating audience second-by-second" });
      for (const [i, a] of attempts.entries()) {
        if (!a.model) continue;
        if (i > 0) send({ type: "stage", stage: "simulating", label: "Retrying with backup model" });
        try {
          analysis = await runModel(cfg, a.model, messages, ctx, a.timeout, send);
          modelUsed = a.model;
          break;
        } catch (err) {
          console.error(`[analyze] ${a.model} failed:`, (err as Error).message);
        }
      }
    }

    // Deterministic offline engine — the app keeps working even if the AI is down.
    if (!analysis) {
      source = "heuristic";
      send({ type: "stage", stage: "scoring", label: "Running offline retention engine" });
      analysis = heuristicAnalysis(script, format, wpm, durationSeconds);
    }

    // Guarantee 8 hook variants
    if (analysis.hook_variants.length < 8) {
      const existing = analysis.hook_variants;
      const filler = buildHookVariants(extractTopic(script), format).filter(
        (h) => !existing.some((v) => v.framework.toLowerCase() === h.framework.toLowerCase()),
      );
      analysis.hook_variants = [...existing, ...filler].slice(0, 8);
    }

    send({ type: "stage", stage: "finalizing", label: "Rendering your retention report" });
    const result: AnalysisResult = {
      ...gateAnalysis(analysis, session.plan),
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      format,
      speaking_pace,
      source,
      model: modelUsed,
      depth,
      script,
      word_count: wordCount,
    };
    send({ type: "progress", pct: 100 });
    send({ type: "result", data: result });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send: Send = (e) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await run(send);
      } catch (err) {
        console.error("[analyze] fatal:", err);
        send({ type: "error", message: "Something went wrong while analyzing. Please try again." });
      }
      controller.close();
    },
  });

  const res = new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
  await writeSession(res, nextSession);
  return res;
}
