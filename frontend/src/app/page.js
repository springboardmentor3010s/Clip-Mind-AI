"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Video, Upload, FileText, Sparkles, Clock, BarChart3 } from "lucide-react";

const features = [
  { icon: Upload, label: "Upload any video" },
  { icon: FileText, label: "Get accurate transcripts" },
  { icon: Sparkles, label: "AI-generated summaries" },
  { icon: Clock, label: "Key moments with timestamps" },
  { icon: BarChart3, label: "Content analytics" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5FA] flex flex-col">
      {/* Top nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <Video className="text-blue" size={24} />
          <span className="text-lg font-bold text-gray-900">ClipMind AI</span>
        </div>
        <div className="flex items-center gap-3">
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
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 -mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-2xl leading-tight">
            Turn long videos into clear insights, instantly.
          </h1>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">
            AI-powered transcripts, summaries, and key moments — built for creators,
            educators, and teams who don&apos;t have time to watch everything.
          </p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <Link
              href="/register"
              className="bg-blue text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition cursor-pointer"
            >
              Get started for free
            </Link>
            <Link
              href="/login"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-full text-sm font-semibold hover:bg-gray-100 transition cursor-pointer"
            >
              Log in
            </Link>
          </div>
        </motion.div>

        {/* Feature strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition"
              >
                <feature.icon className="text-blue" size={32} />
                <h3 className="text-lg font-semibold text-gray-900 mt-4">{feature.label}</h3>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}