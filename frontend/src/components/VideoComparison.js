"use client";

import { useState, useEffect } from "react";
import { GitCompare, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { computeHealthScore, HealthBadge } from "@/components/HealthScore";

export default function VideoComparison() {
  const { isDark } = useTheme();
  const [videos, setVideos] = useState([]);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [leftData, setLeftData] = useState(null);
  const [rightData, setRightData] = useState(null);

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
    const token = localStorage.getItem("clipmind_token");
    fetch("http://localhost:8000/api/v1/videos/my-videos", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setVideos(Array.isArray(data) ? data : []));
  }, []);

  async function loadSide(videoId, setter) {
    if (!videoId) {
      setter(null);
      return;
    }
    const token = localStorage.getItem("clipmind_token");
    const headers = { Authorization: `Bearer ${token}` };
    const video = videos.find((v) => v.video_id === videoId);

    const [tRes, sRes, mRes] = await Promise.allSettled([
      fetch(`http://localhost:8000/api/v1/transcripts/${videoId}`, { headers }),
      fetch(`http://localhost:8000/api/v1/summaries/${videoId}`, { headers }),
      fetch(`http://localhost:8000/api/v1/keymoments/${videoId}`, { headers }),
    ]);

    const transcript = tRes.status === "fulfilled" && tRes.value.ok ? await tRes.value.json() : null;
    const summary = sRes.status === "fulfilled" && sRes.value.ok ? await sRes.value.json() : null;
    const moments = mRes.status === "fulfilled" && mRes.value.ok ? await mRes.value.json() : null;

    setter({ video, transcript, summary, moments });
  }

  useEffect(() => {
    loadSide(leftId, setLeftData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftId]);

  useEffect(() => {
    loadSide(rightId, setRightData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightId]);

  function Column({ data, id }) {
    if (!id) {
      return (
        <div className={`${cardBg} border rounded-xl p-10 text-center flex-1`}>
          <p className={`text-sm ${textSecondary}`}>Select a video</p>
        </div>
      );
    }
    if (!data) {
      return (
        <div className={`${cardBg} border rounded-xl p-10 text-center flex-1`}>
          <Loader2 className="animate-spin text-gray-400 mx-auto" size={20} />
        </div>
      );
    }
    const score = computeHealthScore(data);
    return (
      <div className={`${cardBg} border rounded-xl p-5 flex-1`}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <h4 className={`text-sm font-semibold ${textPrimary} truncate`}>{data.video?.title}</h4>
          <HealthBadge score={score} />
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <Row label="Duration" value={data.video?.duration_seconds ? `${Math.round(data.video.duration_seconds / 60)} min` : "—"} textSecondary={textSecondary} textPrimary={textPrimary} />
          <Row label="Transcript words" value={data.transcript?.word_count ?? "—"} textSecondary={textSecondary} textPrimary={textPrimary} />
          <Row label="Compression" value={data.summary?.compression_ratio != null ? `${data.summary.compression_ratio}%` : "—"} textSecondary={textSecondary} textPrimary={textPrimary} />
          <Row label="Key moments" value={data.moments?.moments?.length ?? 0} textSecondary={textSecondary} textPrimary={textPrimary} />
        </div>
        {data.summary && (
          <div className={`mt-4 pt-4 border-t ${isDark ? "border-white/10" : "border-gray-100"}`}>
            <p className={`text-xs font-semibold ${textSecondary} mb-1`}>Short Summary</p>
            <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
              {data.summary.short_summary}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary} flex items-center gap-2`}>
        <GitCompare size={22} className="text-blue" />
        Compare Videos
      </h2>
      <p className={`${textSecondary} mt-1 mb-6`}>Put two videos side by side to see how they stack up.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select
          value={leftId}
          onChange={(e) => setLeftId(e.target.value)}
          className={`text-sm rounded-lg border px-3 py-2.5 ${
            isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-white border-gray-200 text-gray-800"
          }`}
        >
          <option value="">Select first video...</option>
          {videos.map((v) => (
            <option key={v.video_id} value={v.video_id}>{v.title}</option>
          ))}
        </select>
        <select
          value={rightId}
          onChange={(e) => setRightId(e.target.value)}
          className={`text-sm rounded-lg border px-3 py-2.5 ${
            isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-white border-gray-200 text-gray-800"
          }`}
        >
          <option value="">Select second video...</option>
          {videos.map((v) => (
            <option key={v.video_id} value={v.video_id}>{v.title}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Column data={leftData} id={leftId} />
        <Column data={rightData} id={rightId} />
      </div>
    </div>
  );
}

function Row({ label, value, textSecondary, textPrimary }) {
  return (
    <div className="flex items-center justify-between">
      <span className={textSecondary}>{label}</span>
      <span className={`font-semibold ${textPrimary}`}>{value}</span>
    </div>
  );
}