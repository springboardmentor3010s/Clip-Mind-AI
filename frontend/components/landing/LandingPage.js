"use client";

import Link from "next/link";
import ThemeToggle from "../ui/ThemeToggle";
import Waveform from "../ui/Waveform";

const FEATURES = [
  {
    title: "Smart summarization",
    desc: "Condense long videos into the key points in seconds, not hours.",
  },
  {
    title: "Key moment extraction",
    desc: "Jump straight to what matters instead of scrubbing the whole timeline.",
  },
  {
    title: "Role-based workspaces",
    desc: "Purpose-built dashboards for creators, educators, learners, and admins.",
  },
  {
    title: "Automatic processing pipeline",
    desc: "Every upload is standardized, thumbnailed, and audio-extracted automatically.",
  },
  {
    title: "Secure by design",
    desc: "Token-based auth and strict per-user data isolation, from day one.",
  },
  {
    title: "Built for both themes",
    desc: "A light and dark interface that adapts to how and when you work.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Upload your video",
    desc: "Drag and drop any .mp4, .mov, .avi, or .webm file up to 2GB.",
  },
  {
    step: "02",
    title: "We process it",
    desc: "Format standardization, thumbnail generation, and audio extraction run automatically.",
  },
  {
    step: "03",
    title: "Get your insights",
    desc: "Summaries and key moments land in your dashboard, ready to explore.",
  },
];

const TESTIMONIALS = [
  {
    quote: "Cutting a two-hour lecture down to a five-minute summary used to take me all evening. Now it's instant.",
    name: "Ava R.",
    role: "Content Creator",
  },
  {
    quote: "My students get the key moments of every recorded seminar without rewatching the whole thing.",
    name: "Daniel K.",
    role: "Educator",
  },
  {
    quote: "The role-based dashboards made rolling this out to our whole team painless.",
    name: "Priya M.",
    role: "Administrator",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Up to 5 videos / month", "Basic summarization", "Community support"],
    cta: "Get started",
    href: "/register",
  },
  {
    name: "Pro",
    price: "—",
    period: "coming soon",
    features: ["Unlimited uploads", "Priority processing", "Advanced key-moment detection"],
    cta: "Coming soon",
    href: null,
    highlighted: true,
  },
  {
    name: "Team",
    price: "—",
    period: "coming soon",
    features: ["Everything in Pro", "Role-based admin controls", "Shared team workspaces"],
    cta: "Coming soon",
    href: null,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper dark:bg-ink">
      {/* Nav */}
        <header className="flex items-center justify-between border-b border-line px-6 py-4 dark:border-line-dark sm:px-10">
        <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-signal" />
            <span className="font-display text-sm font-semibold tracking-tight text-ink dark:text-paper">ClipMind AI</span>
        </div>
        <div className="flex items-center gap-4">
            <ThemeToggle />
        </div>
        </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-widest text-signal">AI-powered video intelligence</p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-ink dark:text-paper sm:text-5xl">
          Summarize videos, extract key moments, and gain insights instantly.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-ink/60 dark:text-paper/60">
          ClipMind AI turns raw footage into structured, searchable insight — automatically. Upload once, understand instantly.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-md bg-signal px-6 py-3 text-sm font-medium text-white hover:bg-signal/90"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-line px-6 py-3 text-sm font-medium text-ink hover:bg-line/20 dark:border-line-dark dark:text-paper dark:hover:bg-graphite-2"
          >
            Log in
          </Link>
        </div>
        <Waveform className="mx-auto mt-16 h-10 w-64 text-signal/50 dark:text-signal-dark/50" />
      </section>

      {/* Features */}
      <section className="border-t border-line bg-cloud px-6 py-20 dark:border-line-dark dark:bg-graphite sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Features</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink dark:text-paper">
            Everything you need to make sense of video, fast.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-lg border border-line bg-paper p-6 dark:border-line-dark dark:bg-ink">
                <span className="mb-3 inline-block h-1.5 w-1.5 rounded-full bg-signal" />
                <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">{f.title}</h3>
                <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 dark:border-line-dark sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/50 dark:text-paper/50">How it works</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink dark:text-paper">
            Three steps from raw footage to real insight.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step}>
                <p className="font-mono text-3xl font-semibold tabular-nums text-signal">{s.step}</p>
                <h3 className="mt-3 font-display text-sm font-semibold text-ink dark:text-paper">{s.title}</h3>
                <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-line bg-cloud px-6 py-20 dark:border-line-dark dark:bg-graphite sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/50 dark:text-paper/50">What people say</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink dark:text-paper">
            Trusted by early creators and teams.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-lg border border-line bg-paper p-6 dark:border-line-dark dark:bg-ink">
                <p className="text-sm text-ink/80 dark:text-paper/80">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-ink/50 dark:text-paper/50">
                  {t.name} &middot; {t.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Pricing</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink dark:text-paper">
            Start free. Upgrade when you need more.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PRICING.map((p) => (
              <div
                key={p.name}
                className={`rounded-lg border p-6 ${
                  p.highlighted
                    ? "border-signal bg-signal/5 dark:bg-signal-dark/10"
                    : "border-line bg-cloud dark:border-line-dark dark:bg-graphite"
                }`}
              >
                <h3 className="font-display text-sm font-semibold text-ink dark:text-paper">{p.name}</h3>
                <p className="mt-3">
                  <span className="font-display text-3xl font-semibold text-ink dark:text-paper">{p.price}</span>
                  <span className="ml-1 text-sm text-ink/50 dark:text-paper/50">/ {p.period}</span>
                </p>
                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink/70 dark:text-paper/70">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink/40 dark:bg-paper/40" />
                      {f}
                    </li>
                  ))}
                </ul>
                {p.href ? (
                  <Link
                    href={p.href}
                    className="mt-6 block rounded-md bg-signal px-4 py-2 text-center text-sm font-medium text-white hover:bg-signal/90"
                  >
                    {p.cta}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="mt-6 w-full cursor-not-allowed rounded-md border border-line px-4 py-2 text-sm font-medium text-ink/40 dark:border-line-dark dark:text-paper/40"
                  >
                    {p.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="border-t border-line bg-ink px-6 py-20 text-center dark:border-line-dark sm:px-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-paper sm:text-3xl">
          Ready to understand your videos in seconds?
        </h2>
        <Link
          href="/register"
          className="mt-8 inline-block rounded-md bg-signal px-6 py-3 text-sm font-medium text-white hover:bg-signal/90"
        >
          Create your free account
        </Link>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between gap-4 border-t border-line px-6 py-8 dark:border-line-dark sm:flex-row sm:px-10">
        <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-signal" />
            <span className="font-display text-sm font-semibold tracking-tight text-ink dark:text-paper">ClipMind AI</span>
        </div>
        <div className="text-center sm:text-right">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 dark:text-paper/40">
            &copy; {new Date().getFullYear()} ClipMind AI
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink/30 dark:text-paper/30">
            Built by Mohammed Danyaal Shaikh
            </p>
        </div>
       </footer>
    </div>
  );
}