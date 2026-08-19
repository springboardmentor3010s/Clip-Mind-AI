import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const CORE = [
  {
    icon: "📤",
    title: "Upload or import",
    desc: "Drop an MP4, MOV, AVI, MKV or WebM file up to 2 GB, or paste a YouTube URL. Files are validated by signature, not just extension.",
  },
  {
    icon: "🎙️",
    title: "Speech-to-text transcription",
    desc: "OpenAI Whisper (large-v3) produces a word-accurate transcript with per-segment timestamps and automatic language detection.",
  },
  {
    icon: "✨",
    title: "Multi-layer AI summaries",
    desc: "Not one paragraph — eight. A short overview, a full narrative summary, bullet takeaways, chapters, topics, action items, a glossary and exam-style questions.",
  },
  {
    icon: "⭐",
    title: "Key moments detection",
    desc: "The most important segments, each with a title, an explanation of why it matters, a timestamp and a thumbnail rendered from that exact frame.",
  },
  {
    icon: "🔍",
    title: "Search the spoken word",
    desc: "Search across every transcript you have access to. Results come back with timestamps that jump the player straight to the moment.",
  },
  {
    icon: "🌐",
    title: "On-demand translation",
    desc: "Translate the transcript, summary and key moments into another language without touching the original. Results are cached so it is instant the second time.",
  },
];

const WORKFLOW = [
  {
    icon: "✏️",
    title: "Transcript review and editing",
    desc: "AI transcription is excellent, not infallible. Educators and creators can correct any line; timestamps stay locked so the transcript never drifts out of sync with the video. Corrected transcripts are marked human-reviewed.",
  },
  {
    icon: "📚",
    title: "Learning materials",
    desc: "Turn a lecture transcript into study notes, a quiz, flashcards or a lesson plan in one click — built from the analysis already generated, so there is no extra wait. Students see them alongside the shared video.",
  },
  {
    icon: "🔗",
    title: "Sharing that you control",
    desc: "Share to a named class or with a public link. Recipients get read-only access — they can never edit or delete. Revoke at any time and the link dies immediately.",
  },
  {
    icon: "🔖",
    title: "Bookmarks and history",
    desc: "Save a whole video or a specific highlight with a timestamp. Learning history tracks what you have watched, how often, and what you have finished.",
  },
];

const INSIGHTS = [
  {
    icon: "📊",
    title: "Content analytics",
    desc: "Views, unique viewers, bookmarks and key-moment counts per video, plus a keyword cloud aggregated from the topics the AI extracted across your library.",
  },
  {
    icon: "👨‍🏫",
    title: "Classroom analytics",
    desc: "Which students watched what, how far they got, completion counts and a 14-day engagement trend — so you can see who is falling behind.",
  },
  {
    icon: "🛡️",
    title: "Platform administration",
    desc: "User and role management, activate/deactivate, live AI job monitoring with success rates, storage utilisation by format and user, an activity feed and a full audit trail.",
  },
];

function Section({ title, subtitle, items, bg }) {
  return (
    <section className={`${bg} py-20 px-6`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center">{title}</h2>
        {subtitle && <p className="text-center text-gray-400 mt-3">{subtitle}</p>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {items.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-7 hover:border-blue-600/50 transition"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="text-xl font-bold mt-4">{f.title}</h3>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesPage() {
  return (
    <div className="bg-slate-950 text-white">
      <Navbar />

      <header className="pt-36 pb-16 px-6 text-center">
        <span className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-sm">
          Everything ClipMind AI does
        </span>
        <h1 className="mt-6 text-4xl md:text-6xl font-extrabold">
          From raw footage to <span className="text-blue-500">structured knowledge</span>
        </h1>
        <p className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto">
          A complete pipeline: ingest, transcribe, summarise, detect highlights,
          then share and measure — with role-appropriate access at every step.
        </p>
      </header>

      <Section
        title="Core AI pipeline"
        subtitle="What happens automatically the moment you upload."
        items={CORE}
        bg="bg-slate-900/40"
      />
      <Section
        title="Workflow and collaboration"
        subtitle="Turning AI output into something a class can actually use."
        items={WORKFLOW}
        bg="bg-slate-950"
      />
      <Section
        title="Insights and operations"
        subtitle="Understand engagement and keep the platform healthy."
        items={INSIGHTS}
        bg="bg-slate-900/40"
      />

      <section className="bg-slate-950 py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to try it?</h2>
        <p className="text-gray-400 mt-3">
          Create an account and process your first video in minutes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-semibold transition"
          >
            Get Started
          </Link>
          <Link
            to="/contact"
            className="border border-slate-700 hover:border-blue-500 hover:text-blue-400 px-8 py-4 rounded-xl font-semibold transition"
          >
            Ask a question
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default FeaturesPage;
