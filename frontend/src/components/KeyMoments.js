"use client";

import { useState, useRef } from "react";
import { Clock, Sparkles, Loader2, Search, Film } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import VideoSelector from "@/components/VideoSelector";

export default function KeyMoments({ role }) {
  const { isDark } = useTheme();
  const isLearner = role === "learner";
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [moments, setMoments] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [visualScenes, setVisualScenes] = useState(null);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [visualError, setVisualError] = useState("");

  const videoRef = useRef(null);

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  const momentColors = ["bg-blue", "bg-amber", "bg-purple", "bg-teal", "bg-navy", "bg-red-500"];

  async function handleSelectVideo(v) {
    setSelectedVideo(v);
    setMoments(null);
    setTranscript(null);
    setVisualScenes(null);
    setError("");
    setVisualError("");
    setSearch("");
    setSearchResults([]);

    const token = localStorage.getItem("clipmind_token");

    try {
      const res = await fetch(`http://localhost:8000/api/v1/keymoments/${v.video_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMoments(await res.json());
    } catch (err) {}

    try {
      const res = await fetch(`http://localhost:8000/api/v1/transcripts/${v.video_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTranscript(await res.json());
    } catch (err) {}

    try {
      const res = await fetch(`http://localhost:8000/api/v1/keymoments/${v.video_id}/visual`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setVisualScenes(await res.json());
    } catch (err) {}
  }

  async function generateMoments() {
    if (!selectedVideo) return;
    setGenerating(true);
    setError("");
    const token = localStorage.getItem("clipmind_token");

    try {
      const res = await fetch("http://localhost:8000/api/v1/keymoments/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ video_id: selectedVideo.video_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to generate key moments.");
        setGenerating(false);
        return;
      }
      setMoments(data);
    } catch (err) {
      setError("Could not connect to server. Make sure the backend is running.");
    }
    setGenerating(false);
  }

  async function generateVisualScenes() {
    if (!selectedVideo) return;
    setGeneratingVisual(true);
    setVisualError("");
    const token = localStorage.getItem("clipmind_token");

    try {
      const res = await fetch("http://localhost:8000/api/v1/keymoments/generate-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ video_id: selectedVideo.video_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVisualError(data.detail || "Failed to detect visual scenes.");
        setGeneratingVisual(false);
        return;
      }
      setVisualScenes(data);
    } catch (err) {
      setVisualError("Could not connect to server.");
    }
    setGeneratingVisual(false);
  }

  function seekTo(seconds) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function handleSearch(query) {
    setSearch(query);
    if (!transcript || !query.trim()) {
      setSearchResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matches = transcript.segments.filter((s) => s.text.toLowerCase().includes(q));
    setSearchResults(matches);
  }

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary}`}>Key Moments &amp; Highlight Reports</h2>
      <p className={`${textSecondary} mt-1 mb-4`}>
        Automatically detects important video segments and generates a highlight report.
      </p>

      <VideoSelector onSelect={handleSelectVideo} selectedVideo={selectedVideo} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {selectedVideo?.video_url ? (
            <video
              key={selectedVideo.video_id}
              ref={videoRef}
              src={selectedVideo.video_url}
              controls
              className="w-full rounded-xl bg-black aspect-video"
            />
          ) : (
            <div className="bg-[#101820] rounded-xl aspect-video flex items-center justify-center">
              <p className="text-gray-400 text-sm">No video selected</p>
            </div>
          )}
          <p className={`text-sm font-semibold ${textPrimary} mt-3 truncate`}>
            {selectedVideo?.title || "—"}
          </p>

          {!isLearner && (
            <div className={`${cardBg} border rounded-xl p-4 mt-4`}>
              <button
                onClick={generateMoments}
                disabled={!selectedVideo || generating}
                className="w-full flex items-center justify-center gap-2 bg-blue text-white text-sm font-semibold py-2.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    {moments ? "Regenerate Key Moments" : "Detect Key Moments"}
                  </>
                )}
              </button>
              {!transcript && selectedVideo && (
                <p className={`text-[11px] ${textSecondary} mt-2 text-center`}>
                  Generate a transcript first for best results.
                </p>
              )}
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
          )}

          {!isLearner && (
            <div className={`${cardBg} border rounded-xl p-4 mt-4`}>
              <button
                onClick={generateVisualScenes}
                disabled={!selectedVideo || generatingVisual}
                className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? "border border-white/10 text-gray-200 hover:bg-white/5" : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {generatingVisual ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Scanning video...
                  </>
                ) : (
                  <>
                    <Film size={15} />
                    {visualScenes ? "Rescan Visual Scenes" : "Detect Visual Scenes"}
                  </>
                )}
              </button>
              <p className={`text-[11px] ${textSecondary} mt-2 text-center`}>
                Analyzes actual video frames for cuts and scene changes.
              </p>
              {visualError && <p className="text-xs text-red-500 mt-2">{visualError}</p>}
            </div>
          )}

          {transcript && (
            <div className={`${cardBg} border rounded-xl p-4 mt-4`}>
              <label className={`text-xs font-semibold ${textSecondary} mb-1.5 block`}>
                Search in video
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Type a keyword..."
                  className={`w-full text-sm pl-8 pr-3 py-2 rounded-lg border ${
                    isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                />
              </div>

              {search && (
                <div className="mt-3">
                  <p className={`text-[11px] ${textSecondary} mb-2`}>
                    {searchResults.length} match{searchResults.length !== 1 ? "es" : ""}
                  </p>
                  <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => seekTo(r.start)}
                        className={`text-left text-xs rounded-lg px-2.5 py-2 transition-colors ${
                          isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-blue font-semibold mr-1.5">{formatTime(r.start)}</span>
                        <span className={isDark ? "text-gray-300" : "text-gray-700"}>{r.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
            <h4 className={`font-semibold ${textPrimary} mb-4 flex items-center gap-2`}>
              <Clock size={16} />
              Highlight Report — Detected Important Segments
            </h4>

            {!moments ? (
              <div className="flex flex-col items-center justify-center text-center py-14">
                <Sparkles className="text-gray-400 mb-3" size={28} />
                <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  No key moments yet
                </p>
                <p className={`text-xs ${textSecondary} mt-1 max-w-xs`}>
                  {isLearner
                    ? "This video doesn't have key moments generated yet."
                    : "Select a video with a transcript, then click Detect Key Moments."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {moments.moments.map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                      isDark ? "border-white/10 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`${momentColors[i % momentColors.length]} text-white text-xs font-bold px-3 py-1.5 rounded-md w-16 text-center shrink-0`}
                    >
                      {formatTime(m.time)}
                    </span>
                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"} flex-1`}>
                      {m.label}
                    </span>
                    <button
                      onClick={() => seekTo(m.time)}
                      disabled={!selectedVideo}
                      className="text-xs text-blue font-semibold hover:underline shrink-0 disabled:opacity-40"
                    >
                      Jump to
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
            <h4 className={`font-semibold ${textPrimary} mb-4 flex items-center gap-2`}>
              <Film size={16} />
              Visual Scene Changes
            </h4>

            {!visualScenes ? (
              <div className="flex flex-col items-center justify-center text-center py-14">
                <Film className="text-gray-400 mb-3" size={28} />
                <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  No visual scenes detected yet
                </p>
                <p className={`text-xs ${textSecondary} mt-1 max-w-xs`}>
                  {isLearner
                    ? "This video hasn't been scanned for scene changes yet."
                    : "Click Detect Visual Scenes to scan actual video frames for cuts and transitions."}
                </p>
              </div>
            ) : visualScenes.scenes.length === 0 ? (
              <p className={`text-sm ${textSecondary} text-center py-8`}>
                No significant scene changes detected — this video may be mostly static.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {visualScenes.scenes.map((s, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                      isDark ? "border-white/10 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <span className="bg-purple text-white text-xs font-bold px-3 py-1.5 rounded-md w-16 text-center shrink-0">
                      {formatTime(s.time)}
                    </span>
                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"} flex-1`}>
                      {s.label}
                    </span>
                    <button
                      onClick={() => seekTo(s.time)}
                      disabled={!selectedVideo}
                      className="text-xs text-blue font-semibold hover:underline shrink-0 disabled:opacity-40"
                    >
                      Jump to
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}