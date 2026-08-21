"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AnalyticsHeader() {
  const router = useRouter();

  const handleRefresh = () => {
    // Reload the entire page so all analytics data is fetched again
    window.location.reload();

    // If later you convert this page to server components,
    // you can use:
    // router.refresh();
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 text-white shadow-xl p-8">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

        {/* Left Section */}
        <div>

          <h1 className="text-4xl font-bold">
            📊 AI Video Analytics Dashboard
          </h1>

          <p className="text-blue-100 mt-3 text-lg">
            Analyze transcripts, summaries, keywords and key moments generated
            by ClipMind AI.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">

            <Link
              href="/dashboard/summary"
              className="bg-white/20 hover:bg-white/30 transition px-4 py-2 rounded-full text-sm"
            >
              🤖 AI Summary
            </Link>

            <Link
              href="/dashboard/transcript"
              className="bg-white/20 hover:bg-white/30 transition px-4 py-2 rounded-full text-sm"
            >
              📝 Transcript
            </Link>

            <Link
              href="/dashboard/key-moments"
              className="bg-white/20 hover:bg-white/30 transition px-4 py-2 rounded-full text-sm"
            >
              ⭐ Key Moments
            </Link>

            <Link
              href="/dashboard/keywords"
              className="bg-white/20 hover:bg-white/30 transition px-4 py-2 rounded-full text-sm"
            >
              🏷 Keywords
            </Link>

          </div>

        </div>

        {/* Right Section */}
        <div className="flex flex-col items-end gap-4">

          <div className="bg-green-500 px-5 py-2 rounded-full font-semibold shadow-lg">
            ✅ Processing Completed
          </div>

          <button
            onClick={handleRefresh}
            className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-xl font-semibold shadow-md transition-all duration-300 hover:scale-105"
          >
            🔄 Refresh Analytics
          </button>

        </div>

      </div>

    </div>
  );
}