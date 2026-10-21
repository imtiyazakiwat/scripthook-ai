import { NextResponse, type NextRequest } from "next/server";
import { chatStream, describeAiError, getAiConfig, isAuthError, type AiConfig, type ChatMessage } from "@/lib/ai";
import { gateAnalysis, loadSession, openAccess } from "@/lib/license";
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

/** Rough size of a complete minified analysis — drives the progress bar only. */
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
        send({ type: "stage", stage: "scoring", label: `${model} is flagging drop-offs` });
      }
      if (stage === "scoring" && full.includes('"hook_variants"')) {
        stage = "rewriting";
        send({ type: "stage", stage: "rewriting", label: `${model} is writing hook rewrites` });
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

  // ── AI availability ─────────────────────────────────────────────────
  // Every number in a report comes from the model; without one there is nothing honest to show.
  const cfg = getAiConfig();
  if (!cfg) {
    return jsonError(503, "AI analysis is unavailable: no AI provider is configured on this server (AI_API_KEY is missing).", {
      code: "ai_not_configured",
    });
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
  const ctx: NormalizeContext = { durationSeconds, format, script, beats };
  const ai = cfg;

  async function run(send: Send) {
    send({ type: "meta", plan: session.plan, runs_left: runsLeft(nextSession) });
    send({ type: "stage", stage: "sanitizing", label: "Splitting your script into timed beats" });

    const messages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt(format) },
      { role: "user", content: buildUserPrompt({ script, beats, durationSeconds, wpm, voiceProfile }) },
    ];
    // Model cascade — every attempt is streamed (the proxy times out long non-streamed calls).
    const attempts = (
      depth === "deep"
        ? [
            { model: ai.deepModel, timeout: 40_000 },
            { model: ai.model, timeout: 15_000 },
          ]
        : [
            { model: ai.model, timeout: 20_000 },
            { model: ai.model, timeout: 18_000 },
            { model: ai.fallbackModel, timeout: 16_000 },
          ]
    ).filter((a): a is { model: string; timeout: number } => !!a.model);

    const failures: string[] = [];
    let analysis: ScriptAnalysis | null = null;
    let modelUsed = "";
    let authFailed = false;
    for (const [i, a] of attempts.entries()) {
      if (i === 0) send({ type: "stage", stage: "simulating", label: `Sent to ${a.model}, waiting for its report` });
      else send({ type: "retry", attempt: i + 1, of: attempts.length, model: a.model, reason: failures[failures.length - 1] });
      try {
        analysis = await runModel(ai, a.model, messages, ctx, a.timeout, send);
        modelUsed = a.model;
        break;
      } catch (err) {
        const reason = `${a.model} ${describeAiError(err, a.timeout)}`;
        failures.push(reason);
        console.error(`[analyze] attempt ${i + 1}/${attempts.length}: ${reason} —`, (err as Error)?.message);
        // Every attempt uses the same key, so a rejected key fails them all — stop now.
        if (isAuthError(err)) {
          authFailed = true;
          break;
        }
      }
    }

    // No fallback estimate: if the AI didn't produce a report, say so.
    if (!analysis) {
      send({
        type: "error",
        code: authFailed ? "ai_auth" : "ai_failed",
        message: authFailed
          ? "The AI provider rejected this server’s API key, so no report was generated."
          : failures.length > 1
            ? `The AI model failed on all ${failures.length} attempts, so no report was generated.`
            : "The AI model failed, so no report was generated.",
        details: failures,
      });
      return;
    }

    send({ type: "stage", stage: "finalizing", label: "Building your report" });
    const result: AnalysisResult = {
      ...gateAnalysis(analysis, session.plan),
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      format,
      speaking_pace,
      source: "ai",
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
        send({ type: "error", code: "server_error", message: "The server hit an unexpected error, so no report was generated." });
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
  // Open access elevates the plan in memory only — never persist it.
  if (!openAccess()) await writeSession(res, nextSession);
  return res;
}
