"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, FileVideo } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const CONFIG = {
  uploaded: {
    title: "Videos Uploaded",
    subtitle: "All videos you have uploaded to ClipMind AI.",
    color: "bg-navy",
  },
  processed: {
    title: "Videos Processed",
    subtitle: "Videos successfully processed by the FFmpeg pipeline.",
    color: "bg-teal",
  },
  storage: {
    title: "Total Storage Used",
    subtitle: "Storage breakdown for each of your uploaded videos.",
    color: "bg-blue",
  },
  duration: {
    title: "Avg. Video Duration",
    subtitle: "Duration of each of your uploaded videos.",
    color: "bg-amber",
  },
};

function formatDuration(totalSeconds) {
  if (!totalSeconds) return "—";
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

export default function StatDetail({ type, onBack, onOpenVideo }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const config = CONFIG[type] || CONFIG.uploaded;
  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
    async function fetchVideos() {
      const token = localStorage.getItem("clipmind_token");
      try {
        const res = await fetch("http://localhost:8000/api/v1/videos/my-videos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          let data = await res.json();
          if (type === "processed") {
            data = data.filter((v) => v.status === "completed");
          }
          setVideos(data);
        }
      } catch (err) {
        // backend not reachable
      }
      setLoading(false);
    }
    fetchVideos();
  }, [type]);

  return (
    <div>
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-sm font-medium mb-4 ${
          isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
        } transition`}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div className={`w-3 h-3 rounded-sm ${config.color}`} />
        <h2 className={`text-2xl font-bold ${textPrimary}`}>{config.title}</h2>
      </div>
      <p className={`${textSecondary} mb-6`}>{config.subtitle}</p>

      <div className={`${cardBg} border rounded-xl shadow-sm overflow-hidden`}>
        {loading ? (
          <p className={`text-sm ${textSecondary} p-6`}>Loading...</p>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-14">
            <FileVideo className="text-gray-400 mb-3" size={28} />
            <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>No videos found</p>
            <p className={`text-xs ${textSecondary} mt-1`}>Upload a video to see it appear here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left ${isDark ? "text-gray-400 border-white/10" : "text-gray-500 border-gray-100"} border-b`}>
                <th className="px-5 py-3 font-medium">Video</th>
                <th className="px-5 py-3 font-medium">Uploaded On</th>
                <th className="px-5 py-3 font-medium">Size</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr
                  key={v.video_id}
                  onClick={() => onOpenVideo?.(v.video_id)}
                  className={`border-b last:border-0 cursor-pointer transition-colors ${
                    isDark ? "border-white/5 hover:bg-white/5" : "border-gray-50 hover:bg-gray-50"
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-4 bg-navy rounded shrink-0" />
                      <span className={isDark ? "text-gray-200" : "text-gray-800"}>{v.title}</span>
                    </div>
                  </td>
                  <td className={`px-5 py-3 ${textSecondary}`}>
                    {new Date(v.uploaded_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    ·{" "}
                    {new Date(v.uploaded_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className={`px-5 py-3 ${textSecondary}`}>{v.file_size_mb} MB</td>
                  <td className={`px-5 py-3 ${textSecondary}`}>{formatDuration(v.duration_seconds)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}