import "server-only";

/**
 * Minimal OpenAI-compatible chat client (works with the
 * sss-pluely-backend proxy, OpenAI, OpenRouter, Groq, etc.).
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  /** fast default model */
  model: string;
  /** used if the primary fails */
  fallbackModel?: string;
  /** higher-quality, slower model for "Deep analysis" */
  deepModel: string;
}

export function getAiConfig(): AiConfig | null {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  return {
    baseUrl: (process.env.AI_API_BASE_URL || "https://sss-pluely-backend.vercel.app/v1").replace(/\/+$/, ""),
    apiKey,
    model: process.env.AI_MODEL || "gemini-3.5-flash-lite",
    fallbackModel: process.env.AI_FALLBACK_MODEL || "gemini-3.8-flash",
    deepModel: process.env.AI_DEEP_MODEL || "gemini-3.8-flash",
  };
}

interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  json?: boolean;
  maxTokens?: number;
  signal?: AbortSignal;
}

/** A failed provider call, classified so the UI can say exactly what went wrong. */
export class AiError extends Error {
  readonly kind: "http" | "empty" | "truncated";
  readonly status?: number;
  constructor(kind: AiError["kind"], message: string, status?: number) {
    super(message);
    this.name = "AiError";
    this.kind = kind;
    this.status = status;
  }
}

interface Choice {
  message?: { content?: string };
  delta?: { content?: string };
  finish_reason?: string | null;
}

function body(opts: ChatOptions, stream: boolean) {
  return JSON.stringify({
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.6,
    max_tokens: opts.maxTokens ?? 8192,
    stream,
    ...(opts.json ? { response_format: { type: "json_object" } } : {}),
  });
}

async function post(cfg: AiConfig, opts: ChatOptions, stream: boolean): Promise<Response> {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: body(opts, stream),
    signal: opts.signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AiError("http", `AI provider error ${res.status}: ${text.slice(0, 300)}`, res.status);
  }
  return res;
}

/** Reject truncated or empty completions instead of passing half a report along. */
function complete(text: string, finishReason: string | null | undefined): string {
  if (finishReason === "length") throw new AiError("truncated", "AI response hit the token limit");
  if (!text.trim()) throw new AiError("empty", "AI provider returned an empty response");
  return text;
}

/** Non-streaming completion. Returns the assistant message text. */
export async function chatComplete(cfg: AiConfig, opts: ChatOptions): Promise<string> {
  const res = await post(cfg, opts, false);
  const data = (await res.json()) as { choices?: Choice[]; answer?: string };
  return complete(data.choices?.[0]?.message?.content ?? data.answer ?? "", data.choices?.[0]?.finish_reason);
}

/**
 * Streaming completion. Calls `onDelta` with each text delta and resolves
 * with the full text. Falls back gracefully if the provider ignores
 * `stream: true` and returns a regular JSON body.
 */
export async function chatStream(cfg: AiConfig, opts: ChatOptions, onDelta: (delta: string, full: string) => void): Promise<string> {
  const res = await post(cfg, opts, true);
  const ctype = res.headers.get("content-type") || "";
  if (!res.body || ctype.includes("application/json")) {
    const data = (await res.json()) as { choices?: Choice[]; answer?: string };
    const content = data.choices?.[0]?.message?.content ?? data.answer ?? "";
    if (content) onDelta(content, content);
    return complete(content, data.choices?.[0]?.finish_reason);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  let finishReason: string | null | undefined;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as { choices?: Choice[] };
        const choice = json.choices?.[0];
        if (choice?.finish_reason) finishReason = choice.finish_reason;
        const delta = choice?.delta?.content;
        if (delta) {
          full += delta;
          onDelta(delta, full);
        }
      } catch {
        /* ignore keep-alive / malformed lines */
      }
    }
  }
  return complete(full, finishReason);
}

/** The provider rejected the API key — retrying with another model can't help. */
export function isAuthError(err: unknown): boolean {
  return err instanceof AiError && (err.status === 401 || err.status === 403);
}

/**
 * Why a model attempt failed, phrased to follow the model name, e.g.
 * "gemini-3.5-flash-lite timed out after 20s". Shown to users as-is.
 */
export function describeAiError(err: unknown, timeoutMs?: number): string {
  if (err instanceof AiError) {
    if (err.kind === "truncated") return "stopped before the report was complete (token limit)";
    if (err.kind === "empty") return "returned an empty response";
    const s = err.status ?? 0;
    if (s === 401 || s === 403) return `was rejected by the AI provider (HTTP ${s}, check AI_API_KEY)`;
    if (s === 404) return "isn't available on the AI provider (HTTP 404)";
    if (s === 429) return "was rate-limited by the AI provider (HTTP 429)";
    return `failed: the AI provider returned HTTP ${s}`;
  }
  const e = (err ?? {}) as { name?: string; message?: string };
  switch (e.name) {
    case "TimeoutError":
    case "AbortError":
      return timeoutMs ? `timed out after ${Math.round(timeoutMs / 1000)}s` : "timed out";
    case "IncompleteReportError":
      return `returned an incomplete report (${e.message})`;
    case "SyntaxError":
      return "returned malformed JSON";
    case "ZodError":
      return "returned a report in an unexpected format";
  }
  if (err instanceof TypeError && e.message === "fetch failed") return "failed: the AI provider couldn't be reached";
  if (err instanceof TypeError && e.message === "terminated") return "dropped the connection mid-response";
  return "failed unexpectedly";
}
