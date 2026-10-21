import {
  Activity,
  ArrowRight,
  Clapperboard,
  ClipboardPaste,
  Gauge,
  Layers,
  MonitorPlay,
  MousePointerClick,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { HeroDemo } from "@/components/landing/hero-demo";
import { LandingPricing } from "@/components/landing/landing-pricing";

const STEPS = [
  { icon: ClipboardPaste, title: "Paste your script", body: "Up to 15,000 characters. Director notes like [B-roll] are detected and excluded from timing." },
  { icon: MousePointerClick, title: "Pick your platform", body: "Long-form, Shorts or TikTok Shop — each preset simulates a different audience psychology." },
  { icon: Activity, title: "Fix the leaks", body: "See the curve, click a leak, apply the 1-click fix or swap in one of 8 rewritten hooks." },
];

const FEATURES = [
  {
    icon: Gauge,
    title: "Hook Score, 0–100",
    body: "A 4-pillar rubric — Curiosity Gap, Speed to Value, Audience Clarity and Emotional Stakes — so feedback is objective, not vibes.",
    className: "md:col-span-2",
  },
  {
    icon: Activity,
    title: "Second-by-second retention curve",
    body: "Hover any point to see the exact beat, timestamp and projected audience remaining — benchmarked against your niche.",
    className: "md:col-span-1",
  },
  {
    icon: Target,
    title: "Beat-by-beat drop-off flags",
    body: "🔴 High drops, 🟡 moderate leaks, 🟢 retention spikes — highlighted inline in your script with the psychology behind each.",
    className: "md:col-span-1",
  },
  {
    icon: Wand2,
    title: "8 viral hook rewrites",
    body: "Curiosity Loop, Contrarian, Proof-First, High-Stakes Story, Direct Question, FOMO, Speedrun and Problem-Solution Bridge — written for your script.",
    className: "md:col-span-2",
  },
  { icon: MonitorPlay, title: "Teleprompter export", body: "Time-coded, auto-scrolling at your WPM, mirror mode, .txt export.", className: "" },
  { icon: Scissors, title: "De-Slop rewrites", body: "Strip AI-sounding filler from any segment. Sounds human again.", className: "" },
  { icon: Layers, title: "Batch compare", body: "Run 5 drafts side by side and ship the winner.", className: "" },
];

const PRESETS = [
  { icon: MonitorPlay, name: "YouTube Long-form", stat: "0–30s", body: "Intro cliff, mid-video slump, housekeeping traps and end-screen exits.", accent: "#9a83ff" },
  { icon: Clapperboard, name: "YouTube Shorts", stat: "0–3s", body: "Scroll-stop power, punchline timing and loop-readiness.", accent: "#ff7ab6" },
  { icon: ShoppingBag, name: "TikTok Shop", stat: "Hook → Proof → CTA", body: "Problem hook, proof bridge and a CTA that doesn’t sound like a scam.", accent: "#fb923c" },
];

const FAQ = [
  {
    q: "How can you predict retention before I publish?",
    a: "ScriptHook simulates viewer behavior using retention patterns that are well documented across YouTube, Shorts and TikTok — intro cliffs, housekeeping drops, open loops and pattern interrupts — then applies them beat by beat to your script at your speaking pace. It’s a directional pre-flight check, not a guarantee.",
  },
  { q: "Do I need an account?", a: "No. You get 2 free analyses per day with zero signup. Paid plans are stored in a secure, signed cookie on your browser after checkout." },
  { q: "Is my script stored?", a: "No database, no training on your scripts. Your history lives only in your browser’s local storage." },
  { q: "What counts as a director note?", a: "Bracketed or braced notes like [B-roll: drone shot] or {cut}, and parentheticals starting with production keywords like (SFX: whoosh) or (Music: lo-fi). Toggle stripping on or off anytime." },
  { q: "Which platforms are supported?", a: "YouTube long-form, YouTube Shorts (also works for Reels & TikTok) and TikTok Shop / UGC product videos." },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-x-clip">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute left-1/2 top-[-280px] size-[900px] -translate-x-1/2 rounded-full bg-brand-600/25 blur-[140px]" />
        <div className="absolute right-[-200px] top-[200px] size-[500px] rounded-full bg-flare-500/10 blur-[120px]" />
      </div>

      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-ink-950/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5" aria-label="Main">
          <Logo />
          <div className="hidden items-center gap-6 text-sm text-ink-300 md:flex">
            <a href="#how" className="transition hover:text-white">How it works</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </div>
          <Link
            href="/studio"
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-medium text-ink-950 transition hover:bg-ink-100"
          >
            Open Studio <ArrowRight className="size-4" aria-hidden />
          </Link>
        </nav>
      </header>

      <main>
        {/* hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 md:pt-24 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <Link
              href="/studio"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3 text-xs text-ink-200 transition hover:border-white/20"
            >
              <span className="rounded-full bg-brand-500/20 px-2 py-0.5 font-medium text-brand-300">New</span>
              TikTok Shop preset is live
              <ArrowRight className="size-3 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl">
              Know where viewers leave — <span className="text-gradient">before you hit record.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
              Paste your script. Get a Hook Score, a simulated second-by-second retention curve, the exact lines that leak viewers, and 8 viral hook rewrites in your voice.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/studio"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#7c5cff,#6844f5_55%,#8f3df0)] px-6 text-[15px] font-medium text-white shadow-[0_0_0_1px_rgb(255_255_255/0.12)_inset,0_14px_40px_-10px_rgb(124_92_255/0.9)] transition hover:brightness-110"
              >
                <Zap className="size-4" aria-hidden /> Analyze my script — free
              </Link>
              <a href="#how" className="inline-flex h-12 items-center rounded-xl border border-white/10 px-5 text-[15px] font-medium text-ink-100 transition hover:bg-white/[0.05]">
                See how it works
              </a>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" aria-hidden /> No signup</span>
              <span>2 free analyses / day</span>
              <span>Results in seconds</span>
            </p>
          </div>
          <HeroDemo />
        </section>

        {/* problem strip */}
        <section className="border-y border-white/[0.05] bg-white/[0.015]">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
            {[
              ["The first 30 seconds", "decide whether YouTube keeps recommending your video."],
              ["3 seconds", "is all a Short or TikTok gets before the thumb moves."],
              ["Hours of editing", "can’t save a script that leaks viewers in the first line."],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-2xl font-semibold tracking-tight text-white">{k}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* how */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
          <p className="text-sm font-medium text-brand-300">How it works</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">From post-mortem to pre-production in under a minute.</h2>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card relative p-6">
                <span className="absolute right-5 top-5 font-mono text-xs text-ink-600">0{i + 1}</span>
                <span className="grid size-10 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* features bento */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24">
          <p className="text-sm font-medium text-brand-300">Features</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Everything a retention editor would tell you — instantly.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className={`card group relative overflow-hidden p-6 transition hover:border-white/15 ${f.className}`}>
                <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-brand-500/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
                <f.icon className="size-5 text-brand-300" aria-hidden />
                <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* presets */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="card overflow-hidden p-8 sm:p-10">
            <p className="text-sm font-medium text-brand-300">Platform presets</p>
            <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-white">Every platform leaks viewers differently.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {PRESETS.map((p) => (
                <div key={p.name} className="rounded-2xl border border-white/[0.07] bg-black/20 p-5">
                  <span className="grid size-9 place-items-center rounded-xl" style={{ background: `${p.accent}22`, color: p.accent }}>
                    <p.icon className="size-4.5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold text-white">{p.name}</h3>
                  <p className="mt-1 font-mono text-xs" style={{ color: p.accent }}>Focus: {p.stat}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* pricing */}
        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24">
          <div className="text-center">
            <p className="text-sm font-medium text-brand-300">Pricing</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Cheaper than one re-shoot.</h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-400">Start free. Upgrade when a better hook is worth more than a coffee.</p>
          </div>
          <div className="mt-12">
            <LandingPricing />
          </div>
        </section>

        {/* faq */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-24">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-white">Questions, answered.</h2>
          <div className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-white">
                  {f.q}
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-white/10 text-ink-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* final cta */}
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-[2rem] border border-brand-400/20 bg-[linear-gradient(135deg,rgb(124_92_255/0.22),rgb(255_79_154/0.10))] px-8 py-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
            <Sparkles className="relative mx-auto size-6 text-brand-300" aria-hidden />
            <h2 className="relative mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your next video’s retention is decided before you film it.
            </h2>
            <Link
              href="/studio"
              className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-medium text-ink-950 transition hover:bg-ink-100"
            >
              Run a free analysis <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-ink-500">
          <Logo />
          <p>© {new Date().getFullYear()} RetentionForge · Retention predictions are simulations, not guarantees.</p>
        </div>
      </footer>
    </div>
  );
}
