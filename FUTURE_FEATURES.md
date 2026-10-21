# Future Features & Roadmap

Ideas to pick up after the MVP, roughly in priority order.

## Infra & reliability
- **Durable rate limiting** — swap the in-memory IP/fingerprint limiter (`src/lib/session.ts`) for Upstash Redis / Vercel KV sliding windows so limits hold across serverless instances.
- **Stripe webhooks** — `customer.subscription.deleted/updated` → revocation list in KV so cancellations take effect instantly (today: re-verified every 12h).
- **Restore purchase** — email magic link (Resend) that re-issues the license cookie on a new device.
- **Prompt caching + result cache** — hash `(script, format, pace)` → cached analysis for repeat runs.
- **Observability** — Sentry + structured logs for model latency, JSON repair rate and fallback rate.

## Product
- **Optional accounts** (Supabase Auth) with cloud history, shared team workspaces and script folders.
- **YouTube Studio import** — OAuth pull of real retention curves to calibrate predictions per channel (closes the loop: predicted vs actual).
- **Thumbnail + title pairing** — score the title/thumbnail promise against the first 5 seconds of the script ("promise–payoff match").
- **Audio/video upload** — Whisper transcription (`whisper-large-v3-turbo` is already on the provider) to analyze recorded drafts.
- **Live linting while typing** — run the offline heuristic engine on keystroke to underline greetings/CTAs before analysis.
- **B-roll & pattern-interrupt planner** — suggest cut points every N seconds where attention dips.
- **Loop builder for Shorts** — generate endings that flow back into the first line.
- **Multi-language analysis** (Hindi, Spanish, Portuguese) with locale-specific WPM.
- **Chrome extension** — analyze scripts directly in Google Docs / Notion.
- **Export** — PDF report for agency clients, Google Docs export, SRT with timecodes.
- **A/B hook tester** — share a link where an audience votes on hook variants.
- **Agency seats & white-label reports** for ghostwriters.
- **Annual plans, coupons, lifetime deal** for launch.

## Quality
- Playwright E2E suite in CI, visual regression snapshots.
- Model eval set: 100 scripts with known real retention to track prediction accuracy.
- Accessibility audit (axe) and keyboard-only pass on the chart.
