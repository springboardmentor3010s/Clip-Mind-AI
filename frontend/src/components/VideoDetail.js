"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, FileText, Sparkles, Clock, GraduationCap, Loader2,
  Bookmark, BookmarkCheck, Music, HelpCircle, Play, Square,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { computeHealthScore, HealthBadge } from "@/components/HealthScore";

const TABS = [
  { key: "transcript", label: "Transcript", icon: FileText },
  { key: "summary", label: "Summary", icon: Sparkles },
  { key: "moments", label: "Key Moments", icon: Clock },
  { key: "materials", label: "Learning Materials", icon: GraduationCap },
];

const HIGHLIGHT_DURATION_MS = 4000;

export default function VideoDetail({ videoId, role, onBack, onNavigate }) {
  const { isDark } = useTheme();
  const [tab, setTab] = useState("transcript");
  const [video, setVideo] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [summary, setSummary] = useState(null);
  const [moments, setMoments] = useState(null);
  const [materials, setMaterials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [playingHighlights, setPlayingHighlights] = useState(false);

  const videoRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const highlightIndexRef = useRef(0);

  const isLearner = role === "learner";

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
    loadAll();
    return () => stopHighlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  async function loadAll() {
    setLoading(true);
    const token = localStorage.getItem("clipmind_token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const videoRes = await fetch(`http://localhost:8000/api/v1/videos/${videoId}`, { headers });
      if (videoRes.ok) setVideo(await videoRes.json());
    } catch (err) {}

    const results = await Promise.allSettled([
      fetch(`http://localhost:8000/api/v1/transcripts/${videoId}`, { headers }),
      fetch(`http://localhost:8000/api/v1/summaries/${videoId}`, { headers }),
      fetch(`http://localhost:8000/api/v1/keymoments/${videoId}`, { headers }),
      fetch(`http://localhost:8000/api/v1/materials/${videoId}`, { headers }),
      fetch(`http://localhost:8000/api/v1/bookmarks/my-bookmarks`, { headers }),
    ]);

    if (results[0].status === "fulfilled" && results[0].value.ok) setTranscript(await results[0].value.json());
    if (results[1].status === "fulfilled" && results[1].value.ok) setSummary(await results[1].value.json());
    if (results[2].status === "fulfilled" && results[2].value.ok) setMoments(await results[2].value.json());
    if (results[3].status === "fulfilled" && results[3].value.ok) setMaterials(await results[3].value.json());
    if (results[4].status === "fulfilled" && results[4].value.ok) {
      const data = await results[4].value.json();
      setBookmarked((data.bookmarks || []).some((b) => b.video_id === videoId));
    }

    setLoading(false);
  }

  async function toggleBookmark() {
    if (!video) return;
    const token = localStorage.getItem("clipmind_token");
    try {
      if (bookmarked) {
        await fetch(`http://localhost:8000/api/v1/bookmarks/${videoId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookmarked(false);
      } else {
        await fetch("http://localhost:8000/api/v1/bookmarks/add", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ video_id: videoId, video_title: video.title }),
        });
        setBookmarked(true);
      }
    } catch (err) {}
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function stopHighlights() {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    setPlayingHighlights(false);
  }

  function playHighlightAt(index) {
    const list = moments?.moments || [];
    if (index >= list.length || !videoRef.current) {
      stopHighlights();
      return;
    }
    highlightIndexRef.current = index;
    videoRef.current.currentTime = list[index].time;
    videoRef.current.play();
    highlightTimerRef.current = setTimeout(() => playHighlightAt(index + 1), HIGHLIGHT_DURATION_MS);
  }

  function toggleHighlightsReel() {
    if (playingHighlights) {
      stopHighlights();
      videoRef.current?.pause();
      return;
    }
    if (!moments?.moments?.length) return;
    setPlayingHighlights(true);
    playHighlightAt(0);
  }

  const visibleTabs = TABS.filter((t) => t.key !== "materials" || isLearner || role === "educator");
  const healthScore = video ? computeHealthScore({ transcript, summary, moments }) : null;
  const duration = video?.duration_seconds || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className={`flex items-center gap-1.5 text-sm font-semibold mb-4 ${textSecondary} hover:text-blue transition`}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          {video?.video_url ? (
            <video ref={videoRef} src={video.video_url} controls className="w-full rounded-xl bg-black aspect-video" />
          ) : (
            <div className="bg-[#101820] rounded-xl aspect-video flex items-center justify-center">
              <p className="text-gray-400 text-sm">Video unavailable</p>
            </div>
          )}

          {/* Key-moment heatmap */}
          {duration > 0 && moments?.moments?.length > 0 && (
            <div className={`relative h-2 rounded-full mt-2 ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
              {moments.moments.map((m, i) => (
                <div
                  key={i}
                  title={`${formatTime(m.time)} — ${m.label}`}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue cursor-pointer hover:scale-150 transition-transform"
                  style={{ left: `${Math.min((m.time / duration) * 100, 99)}%` }}
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = m.time;
                      videoRef.current.play();
                    }
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-3">
            <p className={`text-sm font-semibold ${textPrimary} truncate`}>{video?.title || "—"}</p>
            {healthScore != null && (video?.title) && <HealthBadge score={healthScore} />}
          </div>

          {moments?.moments?.length > 0 && (
            <button
              onClick={toggleHighlightsReel}
              className={`mt-3 w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-full transition ${
                playingHighlights
                  ? "bg-red-500 text-white hover:opacity-90"
                  : "border border-purple text-purple hover:bg-purple/10"
              }`}
            >
              {playingHighlights ? <Square size={14} /> : <Play size={14} />}
              {playingHighlights ? "Stop Highlights Reel" : "Play Highlights Reel"}
            </button>
          )}

          {isLearner && video && (
            <button
              onClick={toggleBookmark}
              className={`mt-3 w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-full transition ${
                bookmarked ? "bg-teal text-white hover:opacity-90" : "border border-blue text-blue hover:bg-blue/10"
              }`}
            >
              {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              {bookmarked ? "Bookmarked" : "Bookmark this video"}
            </button>
          )}
        </div>

        <div className={`${cardBg} border rounded-xl p-5 shadow-sm lg:col-span-2`}>
          <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full whitespace-nowrap transition ${
                    tab === t.key
                      ? "bg-blue text-white"
                      : isDark
                      ? "text-gray-300 hover:bg-white/5"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "transcript" && (
            transcript ? (
              <div className="flex flex-col gap-1 max-h-[420px] overflow-y-auto">
                {transcript.segments.map((seg, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm px-2 py-1.5">
                    <span className="text-blue font-semibold shrink-0">{formatTime(seg.start)}</span>
                    <span className={isDark ? "text-gray-300" : "text-gray-800"}>{seg.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Music}
                title="No transcript yet"
                subtitle={isLearner ? "This video doesn't have a transcript yet." : "Generate one from the Transcripts page."}
                showButton={!isLearner}
                onGo={() => onNavigate?.("Transcripts")}
                textSecondary={textSecondary}
                isDark={isDark}
              />
            )
          )}

          {tab === "summary" && (
            summary ? (
              <div className="flex flex-col gap-4">
                <div className={`${isDark ? "bg-teal/10" : "bg-teal/5"} border border-teal rounded-xl p-4`}>
                  <h4 className="text-teal font-semibold text-sm mb-2">Short Summary</h4>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>{summary.short_summary}</p>
                </div>
                <div>
                  <h4 className={`font-semibold ${textPrimary} mb-2`}>Detailed Summary</h4>
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
                    {summary.detailed_summary}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No summary yet"
                subtitle={isLearner ? "This video doesn't have a summary yet." : "Generate one from the Summaries page."}
                showButton={!isLearner}
                onGo={() => onNavigate?.("Summaries")}
                textSecondary={textSecondary}
                isDark={isDark}
              />
            )
          )}

          {tab === "moments" && (
            moments ? (
              <div className="flex flex-col gap-3">
                {moments.moments.map((m, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border ${isDark ? "border-white/10" : "border-gray-100"}`}>
                    <span className="bg-blue text-white text-xs font-bold px-3 py-1.5 rounded-md w-16 text-center shrink-0">
                      {formatTime(m.time)}
                    </span>
                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"} flex-1`}>{m.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No key moments yet"
                subtitle={isLearner ? "This video doesn't have key moments yet." : "Generate them from the Key Moments page."}
                showButton={!isLearner}
                onGo={() => onNavigate?.("Key Moments")}
                textSecondary={textSecondary}
                isDark={isDark}
              />
            )
          )}

          {tab === "materials" && (
            materials ? (
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className={`font-semibold ${textPrimary} mb-2`}>Key Points</h4>
                  <ul className="list-disc pl-5 flex flex-col gap-1">
                    {materials.key_points.map((p, i) => (
                      <li key={i} className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{p}</li>
                    ))}
                  </ul>
                </div>
                {materials.qa_pairs?.length > 0 && (
                  <div>
                    <h4 className={`font-semibold ${textPrimary} mb-2 flex items-center gap-2`}>
                      <HelpCircle size={15} /> Quiz Questions
                    </h4>
                    <div className="flex flex-col gap-2">
                      {materials.qa_pairs.map((qa, i) => (
                        <details key={i} className={`rounded-lg border ${isDark ? "border-white/10" : "border-gray-200"}`}>
                          <summary className="text-sm font-medium cursor-pointer px-3 py-2">{qa.question}</summary>
                          <p className={`text-sm px-3 pb-3 ${textSecondary}`}>{qa.answer}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No learning material yet"
                subtitle={
                  role === "educator"
                    ? "Generate it from the Learning Materials page."
                    : "Your Educator hasn't created study material for this video yet."
                }
                showButton={role === "educator"}
                onGo={() => onNavigate?.("Learning Materials")}
                textSecondary={textSecondary}
                isDark={isDark}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, showButton, onGo, textSecondary, isDark }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14">
      <Icon className="text-gray-400 mb-3" size={28} />
      <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>{title}</p>
      <p className={`text-xs ${textSecondary} mt-1 max-w-xs`}>{subtitle}</p>
      {showButton && (
        <button onClick={onGo} className="mt-4 text-xs font-semibold text-blue hover:underline">
          Go generate it →
        </button>
      )}
    </div>
  );
}