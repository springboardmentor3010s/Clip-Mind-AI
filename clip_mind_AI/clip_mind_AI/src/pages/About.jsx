import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ROLE_SHOWCASE } from "../lib/site";

const PIPELINE = [
  { step: "01", title: "Ingest", desc: "A local upload or a YouTube link, validated by file signature and size." },
  { step: "02", title: "Normalise", desc: "FFmpeg re-encodes to web-friendly H.264 at up to 720p, so playback and seeking are reliable and storage stays sane." },
  { step: "03", title: "Transcribe", desc: "Audio is extracted at 16 kHz mono and passed to Whisper large-v3, which returns text, per-segment timings and the detected language." },
  { step: "04", title: "Analyse", desc: "A large language model reads the transcript and returns a structured, multi-section analysis — grounded strictly in what was actually said." },
  { step: "05", title: "Extract highlights", desc: "Key moments are pulled from the same analysis, then a thumbnail is rendered from each timestamp." },
  { step: "06", title: "Deliver", desc: "Everything lands in a role-appropriate dashboard, searchable, shareable and measurable." },
];

const STACK = [
  { label: "Frontend", value: "React 19 · Vite · Tailwind CSS · React Router" },
  { label: "Backend", value: "Django 5 · Django REST Framework · JWT auth" },
  { label: "Async processing", value: "Celery · Redis" },
  { label: "Data", value: "PostgreSQL" },
  { label: "Speech-to-text", value: "OpenAI Whisper (large-v3)" },
  { label: "Summarisation", value: "LLM analysis with automatic provider fallback" },
  { label: "Media", value: "FFmpeg · yt-dlp" },
  { label: "Delivery", value: "Docker · Docker Compose · Gunicorn · nginx" },
];

const PRINCIPLES = [
  {
    icon: "🎯",
    title: "Grounded, not invented",
    desc: "The model is instructed to base every sentence on the transcript and never to introduce facts it does not support. Timestamps must fall inside the video's real duration.",
  },
  {
    icon: "🔒",
    title: "Private by default",
    desc: "Nothing is visible to anyone else until you share it. Video files are served through short-lived signed URLs, so an unshared video cannot be fetched even by direct address.",
  },
  {
    icon: "👤",
    title: "Humans stay in the loop",
    desc: "AI transcription is a starting point. Transcripts can be corrected by hand without breaking timings, and a corrected transcript is clearly marked as human-reviewed.",
  },
  {
    icon: "⚡",
    title: "Work while you wait",
    desc: "Processing runs on a background worker, not in the request. Upload and carry on — progress streams back stage by stage.",
  },
];

function About() {
  return (
    <div className="bg-slate-950 text-white">
      <Navbar />

      <header className="pt-36 pb-16 px-6 text-center">
        <span className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-sm">
          About the platform
        </span>
        <h1 className="mt-6 text-4xl md:text-6xl font-extrabold">
          Long videos hold the answer.<br />
          <span className="text-blue-500">Finding it shouldn't take an hour.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
          A recorded lecture, a two-hour meeting, a conference talk — the useful
          part is often ninety seconds buried somewhere in the middle. ClipMind AI
          reads the whole thing for you: it transcribes what was said, explains what
          it means, and points to the exact moments worth watching.
        </p>
      </header>

      {/* Problem → approach */}
      <section className="bg-slate-900/40 py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-red-400">The problem</h2>
            <ul className="mt-5 space-y-3 text-gray-400 text-sm leading-relaxed">
              <li>• Video is the densest format to produce and the slowest to consume.</li>
              <li>• You cannot skim it, and you cannot Ctrl-F it.</li>
              <li>• Students rewatch entire lectures to find one definition.</li>
              <li>• Creators have no idea which parts of their content land.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-emerald-400">The approach</h2>
            <ul className="mt-5 space-y-3 text-gray-400 text-sm leading-relaxed">
              <li>• Make every spoken word searchable and timestamped.</li>
              <li>• Summarise at several depths, so you choose how much detail you need.</li>
              <li>• Surface the handful of moments that actually matter.</li>
              <li>• Measure engagement so teaching can adapt to it.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center">How it works</h2>
          <p className="text-center text-gray-400 mt-3">
            Six stages, fully automatic, from upload to insight.
          </p>

          <div className="mt-12 space-y-4">
            {PIPELINE.map((p) => (
              <div
                key={p.step}
                className="flex gap-5 bg-slate-900 border border-slate-800 rounded-2xl p-6"
              >
                <span className="text-2xl font-black text-blue-500/60 shrink-0">{p.step}</span>
                <div>
                  <h3 className="font-bold text-lg">{p.title}</h3>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-slate-900/40 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center">What we optimise for</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-7">
                <span className="text-3xl">{p.icon}</span>
                <h3 className="text-xl font-bold mt-4">{p.title}</h3>
                <p className="text-gray-400 mt-2 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Who it's for</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {ROLE_SHOWCASE.map((r) => (
              <div
                key={r.role}
                className={`bg-slate-900 border ${r.ring} rounded-2xl p-6 text-center`}
              >
                <span className="text-4xl">{r.icon}</span>
                <h3 className={`font-bold mt-3 ${r.color}`}>{r.role}</h3>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">{r.tagline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="bg-slate-900/40 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center">Under the hood</h2>
          <p className="text-center text-gray-400 mt-3">
            Built on production-grade, open technology.
          </p>
          <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
            {STACK.map((s) => (
              <div
                key={s.label}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-6 py-4"
              >
                <span className="font-semibold text-sm">{s.label}</span>
                <span className="text-gray-400 text-sm sm:text-right">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">See it on your own video</h2>
        <p className="text-gray-400 mt-3">Upload one file and judge the output yourself.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-semibold transition"
          >
            Create an account
          </Link>
          <Link
            to="/features"
            className="border border-slate-700 hover:border-blue-500 hover:text-blue-400 px-8 py-4 rounded-xl font-semibold transition"
          >
            Explore features
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default About;
