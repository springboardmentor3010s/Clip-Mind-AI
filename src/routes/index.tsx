import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiLayers,
  FiLock,
  FiPlay,
  FiUploadCloud,
  FiZap,
} from "react-icons/fi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "ClipMind AI — Video Summarization & Key Moments Detection",
      },
      {
        name: "description",
        content:
          "AI-powered video summarization platform for transcription, summaries, key moments, timestamps and analytics.",
      },
      {
        property: "og:title",
        content:
          "ClipMind AI — Video Summarization & Key Moments Detection",
      },
      {
        property: "og:description",
        content:
          "Transform lectures, seminars and interviews into searchable transcripts, concise summaries, key moments and analytics.",
      },
    ],
  }),
  component: HomePage,
});

const capabilities = [
  {
    icon: FiFileText,
    title: "Timestamp-aligned transcripts",
    description:
      "Convert recorded lectures, seminars and interviews into searchable, time-aligned transcripts.",
  },
  {
    icon: FiZap,
    title: "AI-powered summaries",
    description:
      "Generate concise summaries, key findings, topic labels and content abstractions from the transcript.",
  },
  {
    icon: FiLayers,
    title: "Key moments & timestamps",
    description:
      "Identify important segments and surface ranked moments that can be revisited instantly.",
  },
  {
    icon: FiBarChart2,
    title: "Session analytics",
    description:
      "Explore speaker distribution, keyword frequency and engagement patterns for every recording.",
  },
];

const workflow = [
  {
    number: "01",
    icon: FiUploadCloud,
    title: "Upload",
    description:
      "Submit a lecture, seminar, interview or other supported recording.",
  },
  {
    number: "02",
    icon: FiFileText,
    title: "Transcribe",
    description:
      "Speech is converted into searchable, timestamp-aligned transcript segments.",
  },
  {
    number: "03",
    icon: FiZap,
    title: "Summarize",
    description:
      "AI generates structured summaries, findings, topics and follow-up actions.",
  },
  {
    number: "04",
    icon: FiLayers,
    title: "Extract moments",
    description:
      "Important segments are ranked and exposed as timestamped key moments.",
  },
  {
    number: "05",
    icon: FiBarChart2,
    title: "Analyze",
    description:
      "Review keywords, speakers and engagement analytics for the session.",
  },
];

const roles = [
  {
    title: "Content Creator",
    description:
      "Upload, process and manage recordings, summaries, highlights and analytics.",
  },
  {
    title: "Learner",
    description:
      "Review videos, transcripts, summaries and important moments for efficient learning.",
  },
  {
    title: "Educator",
    description:
      "Transform long-form educational recordings into concise learning resources.",
  },
  {
    title: "Administrator",
    description:
      "Manage users, roles, platform activity and system-level operations.",
  },
];

const highlights = [
  "Secure user authentication",
  "Role-based access control",
  "Video upload and processing",
  "Transcript generation",
  "AI summarization",
  "Key moment extraction",
  "Keyword and content analytics",
  "Persistent recording history",
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background bg-mesh text-foreground">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <FiZap className="text-white" />
            </div>

            <div>
              <div className="font-display text-lg font-semibold">
                ClipMind AI
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Video intelligence platform
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a
              href="#capabilities"
              className="transition-colors hover:text-foreground"
            >
              Capabilities
            </a>
            <a
              href="#workflow"
              className="transition-colors hover:text-foreground"
            >
              Workflow
            </a>
            <a
              href="#roles"
              className="transition-colors hover:text-foreground"
            >
              Roles
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-primary px-4 text-sm font-medium text-white shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(124,92,255,0.18),transparent_32%),radial-gradient(circle_at_20%_15%,rgba(86,154,255,0.10),transparent_26%)]" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-20 md:px-8 md:pt-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />
                AI-powered video understanding
              </div>

              <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
  <span className="text-gradient">ClipMind AI:</span>{" "}
  Video Summarization & Key Moments Detection Platform
</h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                ClipMind AI transforms recorded lectures, seminars and
                interviews into timestamp-aligned transcripts, structured
                summaries, ranked key moments and per-session analytics.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-primary px-6 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
                >
                  Start using ClipMind
                  <FiArrowRight />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <FiPlay />
                  Open workspace
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-primary" />
                  Secure authentication
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-primary" />
                  Role-based access
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-primary" />
                  End-to-end media workflow
                </div>
              </div>
            </div>

            {/* HERO PRODUCT CARD */}
            <div className="relative">
              <div className="absolute -inset-8 rounded-[3rem] bg-primary/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-3xl border border-border bg-card/90 p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Active recording
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      Lecture — Introduction to AI
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                    Processed
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Processing pipeline</span>
                    <span className="font-mono-num">100%</span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-full rounded-full bg-gradient-primary" />
                  </div>

                  <div className="mt-5 grid grid-cols-5 gap-2">
                    {workflow.map((step) => {
                      const Icon = step.icon;

                      return (
                        <div
                          key={step.number}
                          className="rounded-xl border border-border bg-card p-2.5 text-center"
                        >
                          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="text-sm" />
                          </div>
                          <div className="mt-2 text-[10px] font-medium text-muted-foreground">
                            {step.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Metric label="Transcript segments" value="13" />
                  <Metric label="Key moments" value="6" />
                  <Metric label="Duration" value="01:04" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CAPABILITIES */}
        <section id="capabilities" className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
            <SectionHeading
              eyebrow="Capabilities"
              title="One recording. Every insight you need."
              description="The platform turns a single upload into a complete video-understanding workflow."
            />

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {capabilities.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-border bg-card p-6 transition-transform hover:-translate-y-1"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-primary">
                      <Icon />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section id="workflow" className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
            <SectionHeading
              eyebrow="Workflow"
              title="From upload to insight in five stages."
              description="Each stage builds on the previous one, keeping the complete analysis reproducible from a single recording."
            />

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {workflow.map((step) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.number}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono-num text-primary">
                        {step.number}
                      </span>

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon />
                      </div>
                    </div>

                    <h3 className="mt-6 font-semibold">{step.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ROLES */}
        <section id="roles" className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
            <SectionHeading
              eyebrow="Designed for different users"
              title="Four roles. One shared intelligence platform."
              description="ClipMind AI supports the user roles defined for the platform while keeping access controlled."
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {roles.map((role) => (
                <div
                  key={role.title}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FiLock />
                  </div>

                  <h3 className="mt-5 font-semibold">{role.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PLATFORM HIGHLIGHTS */}
        <section className="border-t border-border/60">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-primary">
                Platform foundation
              </div>

              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">
                Built around the complete video lifecycle.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                ClipMind combines authentication, media processing, AI
                analysis and a persistent workspace so outputs remain
                accessible after processing.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                  FastAPI backend
                </span>
                <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                  React frontend
                </span>
                <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                  JWT authentication
                </span>
                <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                  Whisper transcription
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4"
                >
                  <FiCheckCircle className="shrink-0 text-primary" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-5 py-20 text-center md:px-8">
            <div className="mx-auto max-w-2xl">
              <div className="text-xs uppercase tracking-[0.16em] text-primary">
                Start exploring
              </div>

              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Make every minute of video useful.
              </h2>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Upload a recording and let ClipMind AI turn it into a
                structured, searchable knowledge workspace.
              </p>

              <div className="mt-7 flex justify-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-primary px-5 text-sm font-semibold text-white shadow-glow"
                >
                  Create account
                  <FiArrowRight />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-medium"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <span className="font-semibold text-foreground">ClipMind AI</span>
            <span className="ml-2">
              Video summarization & key moments detection platform.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-foreground">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono-num text-lg font-semibold">{value}</div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.16em] text-primary">
        {eyebrow}
      </div>

      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
        {description}
      </p>
    </div>
  );
}