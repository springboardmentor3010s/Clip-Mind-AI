"use client";

import { Play } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const keyMoments = [
  { time: "02:14", label: "Intro to AI Ethics", color: "bg-blue" },
  { time: "09:47", label: "Bias in Datasets", color: "bg-amber" },
  { time: "18:32", label: "Case Study: Hiring Model", color: "bg-purple" },
  { time: "24:10", label: "Responsible Deployment", color: "bg-teal" },
];

const transcriptLines = [
  { time: "00:02", text: "Welcome everyone to today's session" },
  { time: "00:08", text: "on responsible AI development." },
  { time: "00:34", text: "We'll start with the foundations" },
  { time: "00:41", text: "of fairness and accountability." },
  { time: "01:12", text: "Let's look at a real dataset" },
  { time: "01:20", text: "that shows historical bias." },
  { time: "01:55", text: "Notice how the sampling skews" },
  { time: "02:03", text: "toward one demographic group." },
];

export default function TranscriptSummary() {
  const { isDark } = useTheme();
  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <div>
      <h2 className={`text-xl font-bold ${textPrimary} mb-4`}>lecture_ai_ethics.mp4</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Video player mock */}
          <div className="bg-[#101820] rounded-xl aspect-video flex items-center justify-center relative">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="text-white" fill="white" size={22} />
            </div>
            <span className="absolute bottom-3 left-4 text-xs text-gray-300">12:04 / 28:40</span>
          </div>

          {/* Short summary */}
          <div className={`${isDark ? "bg-teal/10" : "bg-teal/5"} border border-teal rounded-xl p-4 mt-4`}>
            <h4 className="text-teal font-semibold text-sm mb-2">Short Summary</h4>
            <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>
              This lecture covers core principles of AI ethics, bias mitigation, and responsible
              deployment practices for real-world ML systems.
            </p>
          </div>

          {/* Key moments */}
          <h4 className={`font-semibold ${textPrimary} mt-6 mb-3`}>Key Moments</h4>
          <div className="flex flex-col gap-2">
            {keyMoments.map((m) => (
              <div key={m.time} className="flex items-center gap-3">
                <span className={`${m.color} text-white text-xs font-bold px-3 py-1.5 rounded-md w-16 text-center`}>
                  {m.time}
                </span>
                <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transcript panel */}
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm h-fit`}>
          <h4 className={`font-semibold ${textPrimary} mb-4`}>Live Transcript</h4>
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
            {transcriptLines.map((l, i) => (
              <p key={i} className="text-sm">
                <span className="text-blue font-semibold mr-2">{l.time}</span>
                <span className={isDark ? "text-gray-300" : "text-gray-800"}>{l.text}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}