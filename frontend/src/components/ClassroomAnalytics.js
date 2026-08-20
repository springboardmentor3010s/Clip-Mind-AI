"use client";

import { useState, useEffect } from "react";
import { Users, Eye, Video, Loader2, TrendingUp, Award, Activity } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ClassroomAnalytics() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/analytics/classroom", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setError(json.detail || "Failed to load classroom analytics.");
      }
    } catch (err) {
      setError("Could not connect to server.");
    }
    setLoading(false);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function eventLabel(type) {
    const map = {
      view: "watched",
      transcript_generated: "generated a transcript on",
      summary_generated: "generated a summary on",
    };
    return map[type] || type.replace(/_/g, " ");
  }

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary}`}>Classroom Analytics</h2>
      <p className={`${textSecondary} mt-1 mb-6`}>See how students are engaging with your uploaded videos.</p>

      {loading ? (
        <div className={`${cardBg} border rounded-xl p-10 text-center`}>
          <Loader2 className="animate-spin text-gray-400 mx-auto mb-2" size={22} />
          <p className={`text-sm ${textSecondary}`}>Loading analytics...</p>
        </div>
      ) : error ? (
        <div className={`${cardBg} border rounded-xl p-10 text-center`}>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : !data || data.total_videos === 0 ? (
        <div className={`${cardBg} border rounded-xl p-10 text-center`}>
          <Users className="text-gray-400 mx-auto mb-3" size={28} />
          <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>No data yet</p>
          <p className={`text-xs ${textSecondary} mt-1`}>Upload videos to start tracking student engagement.</p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className={`${cardBg} border rounded-xl p-5`}>
              <Video size={18} className="text-blue mb-2" />
              <p className={`text-2xl font-bold ${textPrimary}`}>{data.total_videos}</p>
              <p className={`text-xs ${textSecondary}`}>Total Videos</p>
            </div>
            <div className={`${cardBg} border rounded-xl p-5`}>
              <Eye size={18} className="text-teal mb-2" />
              <p className={`text-2xl font-bold ${textPrimary}`}>{data.total_student_views}</p>
              <p className={`text-xs ${textSecondary}`}>Total Student Views</p>
            </div>
            <div className={`${cardBg} border rounded-xl p-5`}>
              <Users size={18} className="text-amber mb-2" />
              <p className={`text-2xl font-bold ${textPrimary}`}>{data.unique_students}</p>
              <p className={`text-xs ${textSecondary}`}>Unique Students</p>
            </div>
            <div className={`${cardBg} border rounded-xl p-5`}>
              <TrendingUp size={18} className="text-purple mb-2" />
              <p className={`text-2xl font-bold ${textPrimary}`}>{data.avg_views_per_video}</p>
              <p className={`text-xs ${textSecondary}`}>Avg Views / Video</p>
            </div>
          </div>

          {/* Top Video Highlight */}
          {data.top_video && (
            <div className={`${isDark ? "bg-amber/10 border-amber/30" : "bg-amber/5 border-amber/30"} border rounded-xl p-5 mb-6 flex items-center gap-4`}>
              <div className="w-11 h-11 rounded-full bg-amber flex items-center justify-center shrink-0">
                <Award size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${textSecondary}`}>Top Performing Video</p>
                <p className={`text-sm font-bold ${textPrimary} truncate`}>{data.top_video.title}</p>
                <p className={`text-xs ${textSecondary}`}>
                  {data.top_video.views} views · {data.top_video.unique_students} students
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Engagement Trend Chart */}
            <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
              <h4 className={`font-semibold ${textPrimary} mb-4 flex items-center gap-2`}>
                <Activity size={16} />
                Engagement — Last 14 Days
              </h4>
              <TrendChart data={data.engagement_trend} isDark={isDark} textSecondary={textSecondary} />
            </div>

            {/* Per-Video Bar Comparison */}
            <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
              <h4 className={`font-semibold ${textPrimary} mb-4`}>Views by Video</h4>
              <BarComparison data={data.per_video} isDark={isDark} textPrimary={textPrimary} textSecondary={textSecondary} />
            </div>
          </div>

          {/* Per-Video Table */}
          <div className={`${cardBg} border rounded-xl p-5 shadow-sm mb-6`}>
            <h4 className={`font-semibold ${textPrimary} mb-4`}>Per-Video Engagement</h4>
            <div className="flex flex-col gap-2">
              {data.per_video.map((v) => (
                <div
                  key={v.video_id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg ${
                    isDark ? "bg-white/5" : "bg-gray-50"
                  }`}
                >
                  <p className={`text-sm font-medium truncate flex-1 ${textPrimary}`}>{v.title}</p>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-xs ${textSecondary}`}>{v.views} views</span>
                    <span className={`text-xs ${textSecondary}`}>{v.unique_students} students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className={`${cardBg} border rounded-xl shadow-sm overflow-hidden`}>
            <div className="p-5 border-b border-gray-200/10">
              <h4 className={`font-semibold ${textPrimary}`}>Recent Student Activity</h4>
            </div>
            {data.recent_activity.length === 0 ? (
              <p className={`text-sm ${textSecondary} p-6`}>No student activity yet.</p>
            ) : (
              <div className="divide-y divide-gray-200/10">
                {data.recent_activity.map((a, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                    <p className={`text-sm ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                      <span className="font-semibold">{a.username}</span>{" "}
                      <span className={textSecondary}>{eventLabel(a.event_type)}</span>{" "}
                      <span className="font-medium">{a.video_title}</span>
                    </p>
                    <span className={`text-xs ${textSecondary} shrink-0`}>{formatDate(a.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TrendChart({ data, isDark, textSecondary }) {
  if (!data || data.length === 0) return <p className={`text-sm ${textSecondary}`}>No data yet.</p>;

  const width = 500;
  const height = 140;
  const padding = 10;
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.count / maxCount) * (height - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 140 }}>
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#trendGradient)" />
      <path d={pathD} fill="none" stroke="#4F46E5" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#4F46E5">
          <title>{`${p.date}: ${p.count} events`}</title>
        </circle>
      ))}
    </svg>
  );
}

function BarComparison({ data, isDark, textPrimary, textSecondary }) {
  if (!data || data.length === 0) return <p className={`text-sm ${textSecondary}`}>No data yet.</p>;

  const top5 = data.slice(0, 5);
  const maxViews = Math.max(...top5.map((v) => v.views), 1);

  return (
    <div className="flex flex-col gap-3">
      {top5.map((v) => (
        <div key={v.video_id}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs truncate max-w-[70%] ${textPrimary}`}>{v.title}</span>
            <span className={`text-xs font-semibold ${textSecondary}`}>{v.views}</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
            <div
              className="h-full bg-blue rounded-full transition-all"
              style={{ width: `${(v.views / maxViews) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}