"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Video,
  Upload,
  FileText,
  Sparkles,
  Clock,
  ArrowRight,
  GraduationCap,
  Users,
  ShieldCheck,
  Film,
  PlayCircle,
} from "lucide-react";

const pipeline = [
  { num: "01", icon: Upload, title: "Upload", desc: "Drop a file or paste a link — YouTube, Vimeo, or any direct video." },
  { num: "02", icon: FileText, title: "Transcribe", desc: "Whisper converts speech to a searchable, timestamped transcript." },
  { num: "03", icon: Sparkles, title: "Summarize", desc: "BART distills it into short and detailed AI summaries." },
  { num: "04", icon: Clock, title: "Highlight", desc: "Key moments are detected and marked with exact timestamps." },
];

const roles = [
  {
    icon: Film,
    name: "Content Creator",
    line: "Upload, transcribe, and summarize your own content.",
    color: "bg-navy",
  },
  {
    icon: PlayCircle,
    name: "Learner",
    line: "Read, search, and bookmark what others have published.",
    color: "bg-teal",
  },
  {
    icon: GraduationCap,
    name: "Educator",
    line: "Share summaries and track classroom engagement.",
    color: "bg-blue",
  },
  {
    icon: ShieldCheck,
    name: "Administrator",
    line: "Oversee users, content, and platform health.",
    color: "bg-amber",
  },
];

const poweredBy = ["Whisper", "BART", "FastAPI", "Next.js", "PostgreSQL", "MongoDB"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Video className="text-blue" size={22} />
          <span className="text-lg font-bold text-gray-900 tracking-tight">ClipMind AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-700 px-4 py-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold text-white bg-blue px-5 py-2 rounded-full hover:opacity-90 transition cursor-pointer"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B0F1E] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 15% 20%, rgba(79,70,229,0.35), transparent 60%), radial-gradient(500px circle at 85% 75%, rgba(20,184,166,0.25), transparent 60%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-[11px] font-mono tracking-widest text-teal uppercase mb-5">
              AI Video Intelligence
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">
              Turn long videos into
              <br />
              clear insight, instantly.
            </h1>
            <p className="text-gray-400 mt-5 max-w-md text-[15px] leading-relaxed">
              ClipMind AI transcribes, summarizes, and highlights the key moments in any
              video — so creators, educators, and learners spend less time watching and
              more time understanding.
            </p>

            <div className="flex items-center gap-3 mt-8">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 bg-blue text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Get started for free
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="border border-white/15 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-white/5 transition cursor-pointer"
              >
                Log in
              </Link>
            </div>

            <div className="flex items-center gap-2 mt-10 flex-wrap">
              <span className="text-[11px] font-mono text-gray-500 uppercase mr-1">Powered by</span>
              {poweredBy.map((tech) => (
                <span
                  key={tech}
                  className="text-[11px] font-medium text-gray-300 border border-white/10 rounded-full px-2.5 py-1"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: signature animated pipeline card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 shadow-2xl">
              <div className="flex items-center gap-1.5 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-teal/70" />
                <span className="text-[11px] font-mono text-gray-500 ml-2">lecture_09.mp4</span>
              </div>

              {/* fake video bar */}
              <div className="rounded-lg bg-black/60 aspect-video flex items-center justify-center mb-4 border border-white/5">
                <PlayCircle className="text-white/30" size={36} />
              </div>

              {/* transcript lines typing in */}
              <div className="flex flex-col gap-1.5 mb-4">
                {[
                  { w: "92%", d: 0.5 },
                  { w: "78%", d: 0.65 },
                  { w: "85%", d: 0.8 },
                ].map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: line.d, ease: "easeOut" }}
                    style={{ width: line.w, transformOrigin: "left" }}
                    className="h-2 rounded-full bg-white/10"
                  />
                ))}
              </div>

              {/* summary chip */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.1 }}
                className="rounded-lg bg-blue/10 border border-blue/30 px-3 py-2.5 mb-2"
              >
                <p className="text-[11px] font-mono text-blue uppercase tracking-wide mb-1">Summary</p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Covers three core ideas in the first four minutes, then moves into a
                  worked example.
                </p>
              </motion.div>

              {/* key moment chip */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.4 }}
                className="flex items-center gap-2 rounded-lg bg-teal/10 border border-teal/30 px-3 py-2"
              >
                <Clock size={13} className="text-teal shrink-0" />
                <span className="text-xs text-teal font-mono">04:12</span>
                <span className="text-xs text-gray-300 truncate">Key moment detected</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works — real pipeline, numbered because order matters */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-20">
        <div className="mb-12">
          <span className="text-[11px] font-mono tracking-widest text-blue uppercase">How it works</span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2 tracking-tight">
            One upload, four automatic steps.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {pipeline.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative bg-white rounded-xl border border-gray-200 p-5"
            >
              <span className="text-[11px] font-mono text-gray-300">{step.num}</span>
              <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center mt-3 mb-4">
                <step.icon className="text-blue" size={18} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{step.title}</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles — grounded in the real product's audience */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-20">
          <div className="mb-12">
            <span className="text-[11px] font-mono tracking-widest text-teal uppercase">Built for everyone in the room</span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2 tracking-tight">
              Four roles, one platform.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((role, i) => (
              <motion.div
                key={role.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center mb-4`}>
                  <role.icon className="text-white" size={18} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{role.name}</h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{role.line}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-24 text-center">
        <Users className="text-blue mx-auto mb-5" size={28} />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight max-w-lg mx-auto">
          Stop watching. Start understanding.
        </h2>
        <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm">
          Create your account and upload your first video in under a minute.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-blue text-white px-7 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition mt-7 cursor-pointer"
        >
          Get started for free
          <ArrowRight size={15} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Video className="text-blue" size={16} />
            <span className="text-sm font-semibold text-gray-700">ClipMind AI</span>
          </div>
          <p className="text-xs text-gray-400">Built for creators, educators, and lifelong learners.</p>
        </div>
      </footer>
    </div>
  );
}