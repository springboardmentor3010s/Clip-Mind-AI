import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_ROOT } from "../lib/api";
import { seekAndPlay } from "../lib/player";

const TABS = [
  { key: "summary", label: "Summary", icon: "✨" },
  { key: "transcript", label: "Transcript", icon: "📄" },
  { key: "moments", label: "Key Moments", icon: "⏱️" },
];

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Public share page at /shared/:token — intentionally unauthenticated.
 *
 * Uses a bare axios client rather than the app's `api` instance, because the
 * shared client attaches a JWT and would redirect to /login on 401. A visitor
 * here may have no account at all.
 */
function SharedVideo() {
  const { token } = useParams();
  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("summary");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_ROOT}/api/v1/videos/shared/${token}`);
        if (res.data.success) setVideo(res.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "This share link is invalid or has been revoked."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const jumpTo = (seconds) => {
    if (videoRef.current) seekAndPlay(videoRef.current, seconds);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white text-xl animate-pulse">Loading shared video…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center">
          <p className="text-5xl mb-4">🔗</p>
          <h2 className="text-2xl font-bold text-white">Link unavailable</h2>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const sections = video.summary?.content || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <header className="flex items-center gap-3 mb-8">
          <span className="text-2xl">🎬</span>
          <h1 className="text-2xl font-bold text-blue-500">ClipMind AI</h1>
          <span className="text-sm text-gray-500">Shared with you</span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Player */}
          <div>
            <div className="bg-black rounded-2xl overflow-hidden aspect-video">
              {video.video_file_url ? (
                <video
                  ref={videoRef}
                  src={video.video_file_url}
                  controls
                  className="w-full h-full"
                />
              ) : video.youtube_id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtube_id}`}
                  title={video.title}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  Video unavailable
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold mt-4">{video.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Shared by {video.shared_by} ·{" "}
              {new Date(video.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* AI output */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex gap-2 mb-5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    tab === t.key
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="max-h-[28rem] overflow-y-auto pr-1">
              {tab === "summary" && (
                <div className="space-y-4 text-sm">
                  {sections.short_summary && (
                    <p className="text-gray-200 italic">{sections.short_summary}</p>
                  )}
                  {sections.detailed_summary && (
                    <p className="text-gray-400 whitespace-pre-wrap">
                      {sections.detailed_summary}
                    </p>
                  )}
                  {!!sections.bullet_summary?.length && (
                    <ul className="list-disc list-inside text-gray-400 space-y-1">
                      {sections.bullet_summary.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                  )}
                  {!sections.short_summary && !sections.detailed_summary && (
                    <p className="text-gray-500">No summary available.</p>
                  )}
                </div>
              )}

              {tab === "transcript" && (
                <div className="space-y-2">
                  {(video.transcript?.segments || []).map((seg, i) => (
                    <button
                      key={i}
                      onClick={() => jumpTo(seg.start)}
                      className="w-full text-left flex gap-3 hover:bg-slate-800/60 rounded-lg p-2 transition"
                    >
                      <span className="text-blue-400 text-xs font-mono shrink-0 pt-0.5">
                        {formatSeconds(seg.start)}
                      </span>
                      <span className="text-sm text-gray-300">{seg.text}</span>
                    </button>
                  ))}
                  {!video.transcript?.segments?.length && (
                    <p className="text-gray-500 text-sm">No transcript available.</p>
                  )}
                </div>
              )}

              {tab === "moments" && (
                <div className="space-y-3">
                  {(video.key_moments || []).map((moment) => (
                    <button
                      key={moment.id}
                      onClick={() => jumpTo(moment.timestamp_seconds)}
                      className="w-full text-left flex gap-3 items-start hover:bg-slate-800/60 rounded-lg p-3 transition"
                    >
                      <span className="bg-blue-600 text-xs font-bold px-2.5 py-1 rounded shrink-0">
                        {formatSeconds(moment.timestamp_seconds)}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{moment.title}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">
                          {moment.description}
                        </span>
                      </span>
                    </button>
                  ))}
                  {!video.key_moments?.length && (
                    <p className="text-gray-500 text-sm">No key moments detected.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-12">
          Powered by ClipMind AI — AI-generated video summaries
        </p>
      </div>
    </div>
  );
}

export default SharedVideo;
