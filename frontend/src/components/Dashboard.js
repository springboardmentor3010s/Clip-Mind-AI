"use client";

import { useState, useEffect } from "react";
import { Upload, FileVideo, Inbox, Trash2, Compass, Bookmark, PlayCircle } from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useTheme } from "@/context/ThemeContext";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDuration(totalSeconds) {
  if (!totalSeconds) return "0:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function StatusBadge({ status }) {
  const map = {
    completed: { label: "Completed", color: "bg-teal" },
    processing: { label: "Processing", color: "bg-amber" },
    uploaded: { label: "Uploaded", color: "bg-blue" },
    failed: { label: "Failed", color: "bg-red-500" },
  };
  const s = map[status] || map.uploaded;
  return (
    <span className={`${s.color} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
      {s.label}
    </span>
  );
}

export default function Dashboard({ username, role, onGoToUpload, onOpenStat, onNavigate, onOpenVideo }) {
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const isLearner = role === "learner";

  async function fetchAll() {
    const token = localStorage.getItem("clipmind_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const requests = [
        fetch("http://localhost:8000/api/v1/videos/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8000/api/v1/videos/my-videos", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ];
      if (isLearner) {
        requests.push(
          fetch("http://localhost:8000/api/v1/bookmarks/my-bookmarks", {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
      }
      const [statsRes, videosRes, bookmarksRes] = await Promise.all(requests);
      if (statsRes.ok) setStats(await statsRes.json());
      if (videosRes.ok) setRecentVideos((await videosRes.json()).slice(0, 5));
      if (isLearner && bookmarksRes?.ok) {
        const data = await bookmarksRes.json();
        setBookmarkCount(data.bookmarks?.length || 0);
      }
    } catch (err) {
      // backend not reachable
    }
    setLoading(false);
  }

  async function handleDelete(videoId) {
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/videos/${videoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAll();
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    fetchAll();
  }, [role]);

  const statCards = isLearner
    ? [
        { key: "uploaded", label: "Videos Available", value: stats ? String(stats.total_videos) : "0", color: "bg-navy" },
        { key: "processed", label: "Ready to Explore", value: stats ? String(stats.completed_videos) : "0", color: "bg-teal" },
        { key: "bookmarks", label: "Bookmarks Saved", value: String(bookmarkCount), color: "bg-blue" },
        { key: "duration", label: "Avg. Video Duration", value: stats ? formatDuration(stats.avg_duration_seconds) : "0:00", color: "bg-amber" },
      ]
    : [
        { key: "uploaded", label: "Videos Uploaded", value: stats ? String(stats.total_videos) : "0", color: "bg-navy" },
        { key: "processed", label: "Videos Processed", value: stats ? String(stats.completed_videos) : "0", color: "bg-teal" },
        { key: "storage", label: "Total Storage Used", value: stats ? `${stats.total_size_mb} MB` : "0 MB", color: "bg-blue" },
        { key: "duration", label: "Avg. Video Duration", value: stats ? formatDuration(stats.avg_duration_seconds) : "0:00", color: "bg-amber" },
      ];

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary}`}>
        {getGreeting()}, {username}
      </h2>
      <p className={`${textSecondary} mt-1 mb-6`}>
        {isLearner
          ? "Here's content ready for you to explore and learn from"
          : "Here's what's happening with your videos today"}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <button
            key={s.label}
            onClick={() => (isLearner && s.key === "bookmarks" ? onNavigate?.("Bookmarks") : onOpenStat(s.key))}
            className={`${cardBg} border rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 text-left cursor-pointer`}
          >
            <div className={`w-3 h-3 rounded-sm ${s.color} mb-3`} />
            <div className={`text-2xl font-bold ${textPrimary}`}>
              {stats || isLearner ? <AnimatedCounter value={s.value} /> : s.value}
            </div>
            <div className={`text-xs ${textSecondary} mt-1`}>{s.label}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLearner ? (
          <div
            onClick={() => onNavigate?.("Transcripts")}
            className={`border-2 border-dashed border-blue rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
              isDark ? "bg-blue/10 hover:bg-blue/20" : "bg-blue/5 hover:bg-blue/10"
            }`}
          >
            <Compass className="text-blue mb-3" size={36} />
            <p className={`font-semibold ${textPrimary}`}>Start exploring content</p>
            <p className={`text-sm ${textSecondary} mt-1 mb-4`}>
              Browse videos, read AI summaries, and jump straight to key moments
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.("Transcripts");
              }}
              className="bg-blue text-white px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition"
            >
              <PlayCircle size={16} />
              Browse Videos
            </button>
          </div>
        ) : (
          <div
            onClick={onGoToUpload}
            className={`border-2 border-dashed border-blue rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
              isDark ? "bg-blue/10 hover:bg-blue/20" : "bg-blue/5 hover:bg-blue/10"
            }`}
          >
            <FileVideo className="text-blue mb-3" size={36} />
            <p className={`font-semibold ${textPrimary}`}>Drag & drop video to upload</p>
            <p className={`text-sm ${textSecondary} mt-1 mb-4`}>MP4 · MOV · AVI · WebM — max 2GB</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGoToUpload();
              }}
              className="bg-blue text-white px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition"
            >
              <Upload size={16} />
              Browse Files
            </button>
          </div>
        )}

        <div className={`${cardBg} border rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md`}>
          <h3 className={`font-semibold ${textPrimary} mb-4`}>
            {isLearner ? "Recently Added" : "Recent Uploads"}
          </h3>

          {loading ? (
            <p className={`text-sm ${textSecondary}`}>Loading...</p>
          ) : recentVideos.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentVideos.map((v) => (
                <div
                  key={v.video_id}
                  onClick={() => onOpenVideo?.(v.video_id)}
                  className={`flex items-center justify-between border rounded-lg px-3 py-2.5 transition-colors group cursor-pointer ${
                    isDark ? "border-white/10 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-5 bg-navy rounded shrink-0" />
                    <span className={`text-sm ${isDark ? "text-gray-200" : "text-gray-800"} truncate`}>{v.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={v.status} />
                    {!isLearner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(v.video_id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                        title="Delete video"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                <Inbox className="text-gray-400" size={24} />
              </div>
              <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {isLearner ? "No content available yet" : "No uploads yet"}
              </p>
              <p className={`text-xs ${textSecondary} mt-1 max-w-[220px]`}>
                {isLearner
                  ? "Check back once Creators or Educators upload content."
                  : "Upload your first video to see it appear here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}