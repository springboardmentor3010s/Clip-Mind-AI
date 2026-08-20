"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Sparkles, Video as VideoIcon, Loader2, AlertCircle, FileText, Clock } from "lucide-react";

const TABS = [
  { key: "summary", label: "Summary", icon: Sparkles },
  { key: "transcript", label: "Transcript", icon: FileText },
  { key: "moments", label: "Key Moments", icon: Clock },
];

export default function SharedContentPage() {
  const params = useParams();
  const shareId = params.shareId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("summary");

  useEffect(() => {
    async function fetchShared() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/sharing/view/${shareId}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.detail || "This share link is invalid or has expired.");
        } else {
          setData(json);
        }
      } catch (err) {
        setError("Could not connect to server.");
      }
      setLoading(false);
    }
    if (shareId) fetchShared();
  }, [shareId]);

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5FA] flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md shadow-sm">
          <AlertCircle className="text-red-400 mx-auto mb-3" size={32} />
          <h1 className="text-lg font-bold text-gray-900 mb-1">Link Not Found</h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5FA] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <VideoIcon className="text-blue" size={22} />
          <span className="text-lg font-bold text-gray-900">ClipMind AI</span>
          <span className="text-xs font-semibold text-gray-400 ml-1">Shared with you</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            {data.video_url ? (
              <video src={data.video_url} controls className="w-full rounded-xl bg-black aspect-video" />
            ) : (
              <div className="bg-black/80 rounded-xl aspect-video flex items-center justify-center">
                <p className="text-gray-400 text-sm">Video unavailable</p>
              </div>
            )}
            <h1 className="text-lg font-bold text-gray-900 mt-3">{data.video_title}</h1>
            <p className="text-xs text-gray-400">
              Shared on{" "}
              {new Date(data.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-1 mb-5">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition ${
                      tab === t.key ? "bg-blue text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={13} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {tab === "summary" && (
              <div className="flex flex-col gap-4">
                <div className="bg-teal/5 border border-teal rounded-xl p-4">
                  <h2 className="text-teal font-semibold text-sm mb-2">Short Summary</h2>
                  <p className="text-sm text-gray-800">{data.short_summary}</p>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 mb-2">Detailed Summary</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">{data.detailed_summary}</p>
                </div>
              </div>
            )}

            {tab === "transcript" && (
              data.segments && data.segments.length > 0 ? (
                <div className="flex flex-col gap-1 max-h-[420px] overflow-y-auto">
                  {data.segments.map((seg, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm px-2 py-1.5">
                      <span className="text-blue font-semibold shrink-0">{formatTime(seg.start)}</span>
                      <span className="text-gray-800">{seg.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-10">No transcript available for this video.</p>
              )
            )}

            {tab === "moments" && (
              data.moments && data.moments.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.moments.map((m, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
                      <span className="bg-blue text-white text-xs font-bold px-3 py-1.5 rounded-md w-16 text-center shrink-0">
                        {formatTime(m.time)}
                      </span>
                      <span className="text-sm text-gray-800 flex-1">{m.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-10">No key moments available for this video.</p>
              )
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by ClipMind AI — AI-generated video summaries
        </p>
      </div>
    </div>
  );
}