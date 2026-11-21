import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { HeroPaste } from "@/components/landing/hero-paste";
import { MAX_SCRIPT_CHARS } from "@/lib/limits";
import { FORMATS } from "@/lib/schema";

const heroStats = [
  { value: String(FORMATS.length), label: "Platform presets" },
  { value: `${MAX_SCRIPT_CHARS / 1000}k`, label: "Characters per script" },
  { value: "0", label: "Signups needed" },
];

const flowSteps = [
  {
    eyebrow: "Paste",
    title: "Drop in your script",
    description: `Up to ${MAX_SCRIPT_CHARS.toLocaleString()} characters. Director notes like [B-roll] or (SFX: whoosh) are detected and left out of the timing.`,
  },
  {
    eyebrow: "Analyze",
    title: "Pick a platform and run it",
    description: "Long-form, Shorts or TikTok Shop. An AI model reads your script beat by beat at your speaking pace and estimates where viewers leave.",
  },
  {
    eyebrow: "Fix",
    title: "Patch the leaks before you film",
    description: "Click a drop on the curve, apply the AI’s rewrite in one click, or swap in a new hook. Every change can be undone.",
  },
];

const flagParts = [
  { title: "Where", description: "The exact line, quoted from your script, and its timestamp at your speaking pace." },
  { title: "How much", description: "The AI’s estimate of the share of viewers that line loses, or gains for a spike." },
  { title: "Why", description: "The viewer psychology behind the drop, in plain words." },
  { title: "The fix", description: "A rewrite of that line, ready to say, that you can apply in one click." },
];

const features = [
  "Hook Score with 4-pillar breakdown",
  "Second-by-second retention curve",
  "Inline drop-off highlights",
  "1-click Fix this beat, with undo",
  "Up to 8 hook rewrites per script",
  "De-Slop rewrites on any selection",
  "Creator voice profile",
  "Batch compare up to 5 drafts",
  "Teleprompter with mirror mode",
  "Director-note detection",
  "Local history, no account",
  "AI output only, never placeholder numbers",
];

const presets = [
  { name: "YouTube Long-form", focus: "0–30s", body: "Intro cliff, mid-video slump, housekeeping traps and end-screen exits." },
  { name: "YouTube Shorts", focus: "0–3s", body: "Scroll-stop power, punchline timing and loop-readiness. Works for Reels and TikTok too." },
  { name: "TikTok Shop", focus: "Hook → Proof → CTA", body: "Problem hook, proof bridge and a CTA that doesn’t sound like a scam." },
];

const faq = [
  {
    q: "How does it predict retention before I publish?",
    a: "An AI model reads your script beat by beat at your speaking pace, applies well-known retention patterns for your platform (intro cliffs, housekeeping drops, open loops, pattern interrupts) and estimates how many viewers stay at each second. It’s an estimate to guide your edit, not your real analytics.",
  },
  {
    q: "What happens if the AI is down?",
    a: "You get an error that says what failed, such as a timeout or a provider error. ScriptHook never fills in a report with estimated or placeholder numbers.",
  },
  { q: "Do I need an account?", a: "No. Open the studio, paste a script and analyze it. There’s no signup and nothing to unlock." },
  {
    q: "Is my script stored?",
    a: "ScriptHook has no database. Your script is sent to the AI model to generate the report. Drafts, history and your voice profile are saved only in your browser.",
  },
  {
    q: "What counts as a director note?",
    a: "Bracketed or braced notes like [B-roll: drone shot] or {cut}, and parentheticals starting with production keywords like (SFX: whoosh) or (Music: lo-fi). Toggle stripping on or off anytime.",
  },
  { q: "Which platforms are supported?", a: "YouTube long-form, YouTube Shorts (also works for Reels and TikTok) and TikTok Shop / UGC product videos." },
];

const primaryCta =
  "inline-flex items-center justify-center gap-2 bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-hover";
const secondaryCta =
  "inline-flex items-center justify-center border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-100";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-6 lg:px-8" aria-label="Main">
          <Logo />
          <div className="hidden items-center gap-7 md:flex">
            {[
              ["How it works", "#how"],
              ["Features", "#features"],
              ["Presets", "#presets"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900">
                {label}
              </a>
            ))}
          </div>
          <Link href="/studio" className="inline-flex items-center justify-center gap-2 bg-accent px-4 py-2 text-sm font-bold text-white transition hover:bg-accent-hover">
            Open Studio
          </Link>
        </nav>
      </header>

      <main>
        {/* hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-16 pt-12 sm:px-6 sm:pt-18 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-600">
              YouTube · Shorts · TikTok Shop
            </div>

            <h1 className="mt-7 text-balance text-5xl font-black leading-[1.02] text-zinc-900 sm:text-6xl lg:text-7xl">
              Know where viewers leave before you hit record
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
              Paste your script. An AI model gives it a Hook Score, a second-by-second retention estimate, the exact lines that leak viewers, and
              rewritten hooks in your voice. No signup.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/studio" className={primaryCta}>
                Open Studio
              </Link>
              <a href="#how" className={secondaryCta}>
                See how it works
              </a>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="border border-zinc-200 bg-zinc-50 p-4">
                  <dt className="text-2xl font-black text-zinc-900">{stat.value}</dt>
                  <dd className="mt-1 text-xs leading-5 text-zinc-500">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroPaste />
        </section>

        {/* how */}
        <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-orange-600">How it works</p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-zinc-900 sm:text-5xl">A script in, a retention report out</h2>
              <p className="mt-5 text-base leading-8 text-zinc-600">Three steps. See the drop before your audience does.</p>
            </div>

            <div className="grid gap-4">
              {flowSteps.map((step) => (
                <article key={step.title} className="grid gap-4 border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-[120px_1fr]">
                  <p className="text-sm font-bold text-orange-600">{step.eyebrow}</p>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* breakdown */}
        <section className="border-y border-zinc-200 bg-zinc-50 py-20">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase text-orange-600">The breakdown</p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-zinc-900 sm:text-5xl">See exactly where they leave</h2>
              <p className="mt-5 text-base leading-8 text-zinc-600">
                Every line the AI expects to lose viewers is highlighted in your script and listed with what it found. Spikes show you what to keep.
              </p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              {flagParts.map((part) => (
                <div key={part.title} className="border border-zinc-200 bg-white p-5">
                  <dt className="text-sm font-bold text-orange-600">{part.title}</dt>
                  <dd className="mt-2 text-sm leading-6 text-zinc-600">{part.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* features */}
        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-orange-600">What’s included</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-zinc-900 sm:text-5xl">Everything, no tiers</h2>
            <p className="mt-5 text-base leading-8 text-zinc-600">There is nothing to unlock. Every preset, rewrite and tool is available from your first script.</p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-700">
                {feature}
              </div>
            ))}
          </div>
        </section>

        {/* presets */}
        <section id="presets" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 pb-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase text-orange-600">Platform presets</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-zinc-900 sm:text-5xl">Every platform leaks viewers differently</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {presets.map((p) => (
              <article key={p.name} className="border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-bold text-orange-600">Focus: {p.focus}</p>
                <h3 className="mt-2 text-xl font-bold text-zinc-900">{p.name}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* faq */}
        <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-5 pb-20 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase text-orange-600">FAQ</p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-zinc-900">Questions, answered</h2>
          <div className="mt-8 space-y-3">
            {faq.map((f) => (
              <details key={f.q} className="group border border-zinc-200 bg-zinc-50 p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-zinc-900">
                  {f.q}
                  <span className="grid size-6 shrink-0 place-items-center border border-zinc-200 bg-white text-zinc-500 group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* final cta */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 border border-orange-200 bg-orange-50 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="max-w-3xl text-4xl font-black leading-tight text-zinc-900 sm:text-5xl">
                Your next video’s retention is decided before you film it
              </h2>
              <p className="mt-4 text-base text-zinc-600">Paste a script and get the AI’s report in seconds.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/studio" className={primaryCta}>
                Open Studio
              </Link>
              <a href="#features" className={secondaryCta}>
                See what’s included
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-zinc-500 sm:px-6 lg:px-8">
          <span className="font-semibold text-zinc-600">ScriptHook AI</span>
          <p>Retention figures are AI estimates, not real analytics.</p>
        </div>
      </footer>
    </div>
  );
}
