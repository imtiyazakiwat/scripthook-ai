# ScriptHook AI (RetentionForge)

Pre-production script simulator for YouTube, Shorts and TikTok Shop creators. Paste a script and an AI model returns:

- **Hook Score (0–100)** from a 4-pillar rubric (Curiosity Gap, Speed to Value, Audience Clarity, Emotional Stakes)
- **A predicted retention curve**, second by second
- **Drop-off flags for each beat** (high / moderate / spike), highlighted inline, each with a 1-click "Fix this beat"
- **Up to 8 hook rewrites**, one per framework, that you can copy or use as your opener
- **A teleprompter** that auto-scrolls at your WPM, with mirror mode and .txt export
- **Batch compare** (up to 5 drafts), **De-Slop** segment rewrites and a **creator voice profile**

Every number in a report comes from the model. If the AI can't be reached or returns an incomplete report, the UI shows an error naming each failed attempt. Nothing is estimated, filled in or sampled.

Built with Next.js 15 (App Router), Tailwind v4, Recharts and Zod. It has **no database** and deploys to Vercel as-is.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in AI_API_KEY and SESSION_SECRET
npm run dev                  # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run build` | Production build |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit tests for script parsing, model-output validation and gating (vitest) |

## Deploy to Vercel

Import the repo and set these environment variables (see `.env.example`):

- `AI_API_KEY` (required) and optionally `AI_API_BASE_URL`, `AI_MODEL`, `AI_FALLBACK_MODEL`, `AI_DEEP_MODEL`
- `SESSION_SECRET` (required in production): a long random string
- `OPEN_ACCESS` (optional): every feature is unlocked with no usage cap by default. Set to `false` to enforce the Free / Creator / Pro plans.
- Stripe (optional, only used when `OPEN_ACCESS=false`): `STRIPE_SECRET_KEY`, `STRIPE_PRICE_CREATOR`, `STRIPE_PRICE_PRO`, `NEXT_PUBLIC_SITE_URL`

If no Stripe key is set, plans run in **demo billing** mode: choosing a plan activates it instantly with no card.

## How it works

```
POST /api/analyze-script  →  validate (20 words – 15k chars) → AI configured? (else 503)
                          →  license/limits (signed cookie + IP/fingerprint, when OPEN_ACCESS=false)
                          →  sanitize director notes → split into timed beats (WPM per platform/pace)
                          →  stream LLM (OpenAI-compatible) → JSON repair → strict validation
                          →  retry / fallback model → otherwise an `error` event listing each failed attempt
                          →  server-side gating of paid content → NDJSON stream to the UI
```

- **AI**: any OpenAI-compatible `/v1/chat/completions` endpoint. It defaults to `gemini-3.5-flash-lite` (≈6s), with `gemini-3.8-flash` used as the fallback and for "Deep" mode.
- **Validation**: a response missing the hook score, the retention curve (or its end), the drop-off list or the hook list is rejected, and the next attempt runs. Flags without a size, or without a timestamp that can be found in the script, are dropped rather than guessed.
- **Licensing**: an HS256-signed HttpOnly `auth_token` cookie holds the plan and usage. The free tier allows 2 runs/day, with an extra IP/fingerprint ceiling. Stripe subscriptions are re-verified every 12h.
- **History, drafts and voice profile** are stored in localStorage only.

### API

| Route | Purpose |
| --- | --- |
| `POST /api/analyze-script` | `{ script, format, speaking_pace, strip_director_notes?, voice_profile?, depth? }` returns an NDJSON stream (`meta`, `stage`, `retry`, `progress`, `partial`, `result`, or `error` with per-attempt `details`). Errors before streaming: `400` (too short/long), `403` (preset locked), `429` (limit reached), `503` (no AI provider configured) |
| `POST /api/rewrite` | `{ text, mode: "fix" \| "deslop" }` returns 3 rewrite options and the model used, or `502` with per-attempt `details` |
| `GET /api/status` | Whether an AI provider is configured and which models will run (no provider call) |
| `GET /api/session` | Current plan and runs left |
| `POST /api/checkout` · `GET /api/checkout/success` · `POST /api/portal` | Stripe Checkout, license cookie issuance and the billing portal |

See [`FUTURE_FEATURES.md`](./FUTURE_FEATURES.md) for the roadmap.
