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
  /** higher-quality, slower model for Pro "Deep analysis" */
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

function body(cfg: AiConfig, opts: ChatOptions, stream: boolean) {
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
    body: body(cfg, opts, stream),
    signal: opts.signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI provider error ${res.status}: ${text.slice(0, 300)}`);
  }
  return res;
}

/** Non-streaming completion. Returns the assistant message text. */
export async function chatComplete(cfg: AiConfig, opts: ChatOptions): Promise<string> {
  const res = await post(cfg, opts, false);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    answer?: string;
  };
  const content = data.choices?.[0]?.message?.content ?? data.answer;
  if (!content) throw new Error("AI provider returned an empty response");
  return content;
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
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; answer?: string };
    const content = data.choices?.[0]?.message?.content ?? data.answer ?? "";
    onDelta(content, content);
    return content;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
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
        const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onDelta(delta, full);
        }
      } catch {
        /* ignore keep-alive / malformed lines */
      }
    }
  }
  return full;
}
