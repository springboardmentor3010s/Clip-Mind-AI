"use client";

import { useState, useEffect } from "react";
import { Flame, TrendingUp, Video, FileText, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function TrendingTopics() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
    const token = localStorage.getItem("clipmind_token");
    fetch("http://localhost:8000/api/v1/analytics/trending-topics", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const keywords = data?.trending_keywords || [];
  const maxCount = keywords.length ? Math.max(...keywords.map((k) => k.count)) : 1;

  const sizeFor = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return "text-3xl md:text-4xl";
    if (ratio > 0.6) return "text-2xl md:text-3xl";
    if (ratio > 0.4) return "text-xl md:text-2xl";
    if (ratio > 0.2) return "text-lg";
    return "text-base";
  };

  const colors = ["text-blue", "text-teal", "text-amber", "text-purple"];

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary} flex items-center gap-2`}>
        <Flame className="text-amber" size={22} />
        Trending Topics
      </h2>
      <p className={`${textSecondary} mt-1 mb-6`}>
        What's being discussed across every video on the platform right now.
      </p>

      {loading ? (
        <div className={`${cardBg} border rounded-xl p-14 text-center`}>
          <Loader2 className="animate-spin text-gray-400 mx-auto mb-2" size={22} />
          <p className={`text-sm ${textSecondary}`}>Analyzing platform content...</p>
        </div>
      ) : keywords.length === 0 ? (
        <div className={`${cardBg} border rounded-xl p-14 text-center`}>
          <TrendingUp className="text-gray-400 mx-auto mb-3" size={28} />
          <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            No trends yet
          </p>
          <p className={`text-xs ${textSecondary} mt-1`}>
            Once more videos are transcribed, topics will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className={`${cardBg} border rounded-xl p-5`}>
              <Video size={18} className="text-blue mb-2" />
              <p className={`text-2xl font-bold ${textPrimary}`}>{data.total_videos_analyzed}</p>
              <p className={`text-xs ${textSecondary}`}>Videos Analyzed</p>
            </div>
            <div className={`${cardBg} border rounded-xl p-5`}>
              <FileText size={18} className="text-teal mb-2" />
              <p className={`text-2xl font-bold ${textPrimary}`}>{data.total_summaries}</p>
              <p className={`text-xs ${textSecondary}`}>Summaries Generated</p>
            </div>
            <div className={`${cardBg} border rounded-xl p-5`}>
              <Flame size={18} className="text-amber mb-2" />
              <p className={`text-2xl font-bold ${textPrimary}`}>{keywords.length}</p>
              <p className={`text-xs ${textSecondary}`}>Trending Topics</p>
            </div>
          </div>

          <div className={`${cardBg} border rounded-xl p-8 shadow-sm`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${textSecondary} mb-6`}>
              Platform-wide keyword cloud
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {keywords.map((k, i) => (
                <span
                  key={k.word}
                  className={`font-bold ${sizeFor(k.count)} ${colors[i % colors.length]} transition-transform hover:scale-110 cursor-default`}
                  title={`${k.count} mentions`}
                >
                  {k.word}
                </span>
              ))}
            </div>
          </div>

          <div className={`${cardBg} border rounded-xl mt-6 shadow-sm overflow-hidden`}>
            <div className="p-5 border-b border-gray-200/10">
              <h4 className={`font-semibold ${textPrimary}`}>Ranked Breakdown</h4>
            </div>
            <div className="divide-y divide-gray-200/10">
              {keywords.map((k, i) => (
                <div key={k.word} className="px-5 py-3 flex items-center gap-4">
                  <span className={`text-xs font-mono ${textSecondary} w-6`}>{i + 1}</span>
                  <span className={`text-sm font-medium flex-1 ${textPrimary}`}>{k.word}</span>
                  <div className={`h-1.5 rounded-full flex-1 max-w-[200px] overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                    <div
                      className="h-full bg-blue rounded-full"
                      style={{ width: `${(k.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs ${textSecondary} w-16 text-right`}>{k.count} mentions</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}