"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Music, Download, Sparkles, Loader2, Copy, Check, Edit3, FileText, List, Bookmark, BookmarkCheck } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import VideoSelector from "@/components/VideoSelector";
import VideoInsights from "@/components/VideoInsights";

const LANGUAGES = [
  { code: "auto", label: "Auto-detect" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
  { code: "pt", label: "Portuguese" },
];

export default function Transcripts({ role }) {
  const { isDark } = useTheme();
  const isLearner = role === "learner";
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [language, setLanguage] = useState("auto");
  const [translateTo, setTranslateTo] = useState("auto");
  const [transcript, setTranscript] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showClean, setShowClean] = useState(false);
  const [cleanSegments, setCleanSegments] = useState(null);
  const [loadingClean, setLoadingClean] = useState(false);
  const [keywords, setKeywords] = useState(null);
  const [chapters, setChapters] = useState(null);
  const [showChapters, setShowChapters] = useState(false);

  const videoRef = useRef(null);
  const segmentRefs = useRef([]);

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  function handleSelectVideo(v) {
    setSelectedVideo(v);
    setTranscript(null);
    setError("");
    setActiveIndex(-1);
    setCleanSegments(null);
    setShowClean(false);
    setKeywords(null);
    setChapters(null);
    setShowChapters(false);
    setBookmarked(false);
    checkExistingTranscript(v.video_id);
  }

  async function checkExistingTranscript(videoId) {
    setCheckingExisting(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/transcripts/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTranscript(data);
        fetchExtras(videoId);
      }
    } catch (err) {
      // no existing transcript
    }
    setCheckingExisting(false);
  }

  async function toggleBookmark() {
    if (!selectedVideo) return;
    setBookmarking(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      if (bookmarked) {
        await fetch(`http://localhost:8000/api/v1/bookmarks/${selectedVideo.video_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookmarked(false);
      } else {
        await fetch("http://localhost:8000/api/v1/bookmarks/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ video_id: selectedVideo.video_id, video_title: selectedVideo.title }),
        });
        setBookmarked(true);
      }
    } catch (err) {
      // ignore
    }
    setBookmarking(false);
  }

  async function fetchExtras(videoId) {
    const token = localStorage.getItem("clipmind_token");
    try {
      const [kwRes, chRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/transcripts/${videoId}/keywords`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:8000/api/v1/transcripts/${videoId}/chapters`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (kwRes.ok) setKeywords((await kwRes.json()).keywords);
      if (chRes.ok) setChapters((await chRes.json()).chapters);
    } catch (err) {
      // ignore
    }
  }

  async function generateTranscript() {
    if (!selectedVideo) return;
    setGenerating(true);
    setError("");
    const token = localStorage.getItem("clipmind_token");

    try {
      const res = await fetch("http://localhost:8000/api/v1/transcripts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          video_id: selectedVideo.video_id,
          language,
          translate_to: translateTo,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to generate transcript.");
        setGenerating(false);
        return;
      }
      setTranscript(data);
      fetchExtras(selectedVideo.video_id);
    } catch (err) {
      setError("Could not connect to server. Make sure the backend is running.");
    }
    setGenerating(false);
  }

  function downloadFile(url, suggestedName) {
    const token = localStorage.getItem("clipmind_token");
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const objUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objUrl;
        a.download = suggestedName;
        a.click();
        window.URL.revokeObjectURL(objUrl);
      });
  }

  function downloadTxt() {
    if (!selectedVideo) return;
    downloadFile(
      `http://localhost:8000/api/v1/transcripts/${selectedVideo.video_id}/download`,
      `${selectedVideo.title.split(".")[0]}_transcript.txt`
    );
  }

  function downloadSrt() {
    if (!selectedVideo) return;
    downloadFile(
      `http://localhost:8000/api/v1/transcripts/${selectedVideo.video_id}/download-srt`,
      `${selectedVideo.title.split(".")[0]}.srt`
    );
  }

  function copyTranscript() {
    if (!transcript) return;
    const fullText = transcript.segments.map((s) => s.text).join(" ");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function seekTo(seconds) {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  }

  function startEdit(index, currentText) {
    setEditingIndex(index);
    setEditText(currentText);
  }

  async function saveEdit(index) {
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/transcripts/segment", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          video_id: selectedVideo.video_id,
          segment_index: index,
          text: editText,
        }),
      });
      if (res.ok) {
        const updated = { ...transcript };
        updated.segments[index].text = editText;
        setTranscript(updated);
      }
    } catch (err) {
      // ignore
    }
    setEditingIndex(null);
  }

  async function toggleCleanMode() {
    if (!showClean && !cleanSegments && selectedVideo) {
      setLoadingClean(true);
      const token = localStorage.getItem("clipmind_token");
      try {
        const res = await fetch(`http://localhost:8000/api/v1/transcripts/${selectedVideo.video_id}/clean`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCleanSegments(data.segments);
        }
      } catch (err) {
        // ignore
      }
      setLoadingClean(false);
    }
    setShowClean(!showClean);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !transcript) return;

    function onTimeUpdate() {
      const t = video.currentTime;
      const idx = transcript.segments.findIndex((s) => t >= s.start && t <= s.end);
      if (idx !== -1 && idx !== activeIndex) {
        setActiveIndex(idx);
        segmentRefs.current[idx]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, activeIndex]);

  const displaySegments = showClean && cleanSegments ? cleanSegments : transcript?.segments;

  const filteredSegments = displaySegments
    ?.map((s, i) => ({ ...s, originalIndex: i }))
    .filter((s) => s.text.toLowerCase().includes(search.toLowerCase()));

  const wordCount = transcript ? transcript.segments.reduce((acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length, 0) : 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary}`}>Transcripts</h2>
      <p className={`${textSecondary} mt-1 mb-4`}>
        Real AI-generated transcript using OpenAI Whisper — choose the spoken language and an optional translation.
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
          {selectedVideo?.audio_url && (
            <a
              href={selectedVideo.audio_url}
              download
              className="mt-3 flex items-center justify-center gap-2 bg-blue text-white text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 transition w-fit"
            >
              <Download size={14} />
              Download Audio (MP3)
            </a>
          )}

          {/* Language + Generate — hidden for Learners */}
          {!isLearner && (
            <div className={`${cardBg} border rounded-xl p-4 mt-4`}>
              <label className={`text-xs font-semibold ${textSecondary} mb-1.5 block`}>Spoken Language in Video</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`w-full text-sm rounded-lg border px-3 py-2 mb-3 ${
                  isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>

              <label className={`text-xs font-semibold ${textSecondary} mb-1.5 block`}>Translate Transcript To</label>
              <select
                value={translateTo}
                onChange={(e) => setTranslateTo(e.target.value)}
                className={`w-full text-sm rounded-lg border px-3 py-2 mb-3 ${
                  isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              >
                <option value="auto">Same as spoken language</option>
                {LANGUAGES.filter((l) => l.code !== "auto").map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>

              <button
                onClick={generateTranscript}
                disabled={!selectedVideo || generating}
                className="w-full flex items-center justify-center gap-2 bg-blue text-white text-sm font-semibold py-2.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Generate Transcript
                  </>
                )}
              </button>
              {generating && (
                <p className={`text-[11px] ${textSecondary} mt-2 text-center`}>
                  This may take a few minutes depending on video length.
                </p>
              )}
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
          )}

          {/* Bookmark — only for Learners */}
          {isLearner && selectedVideo && (
            <div className={`${cardBg} border rounded-xl p-4 mt-4`}>
              <button
                onClick={toggleBookmark}
                disabled={bookmarking}
                className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-full transition disabled:opacity-50 ${
                  bookmarked
                    ? "bg-teal text-white hover:opacity-90"
                    : "border border-blue text-blue hover:bg-blue/10"
                }`}
              >
                {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                {bookmarked ? "Bookmarked" : "Bookmark this video"}
              </button>
            </div>
          )}

          {/* Chapters */}
          {chapters && chapters.length > 0 && (
            <div className={`${cardBg} border rounded-xl p-4 mt-4`}>
              <button
                onClick={() => setShowChapters(!showChapters)}
                className={`w-full flex items-center justify-between text-xs font-semibold ${textSecondary}`}
              >
                <span className="flex items-center gap-1.5">
                  <List size={13} />
                  Chapters ({chapters.length})
                </span>
                <span>{showChapters ? "Hide" : "Show"}</span>
              </button>
              {showChapters && (
                <div className="flex flex-col gap-1.5 mt-3">
                  {chapters.map((ch, i) => (
                    <button
                      key={i}
                      onClick={() => seekTo(ch.time)}
                      className={`text-left text-xs rounded-lg px-2.5 py-2 flex items-center justify-between transition-colors ${
                        isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span className={isDark ? "text-gray-300" : "text-gray-700"}>{ch.title}</span>
                      <span className="text-blue font-semibold shrink-0 ml-2">{formatTime(ch.time)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`${cardBg} border rounded-xl p-5 shadow-sm lg:col-span-2`}>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <h4 className={`font-semibold ${textPrimary}`}>
              Full Transcript{" "}
              {transcript && (
                <span className="text-xs font-normal text-blue">({transcript.output_language})</span>
              )}
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {transcript && (
                <>
                  <button
                    onClick={toggleCleanMode}
                    disabled={loadingClean}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                      showClean
                        ? "bg-blue text-white border-blue"
                        : isDark
                        ? "border-white/10 text-gray-300 hover:bg-white/5"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {loadingClean ? "Cleaning..." : showClean ? "Original" : "Remove Fillers"}
                  </button>
                  <button
                    onClick={copyTranscript}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      isDark ? "border-white/10 text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {copied ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={downloadTxt}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue hover:underline"
                  >
                    <Download size={13} />
                    .txt
                  </button>
                  <button
                    onClick={downloadSrt}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue hover:underline"
                  >
                    <FileText size={13} />
                    .srt
                  </button>
                </>
              )}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transcript..."
                  className={`text-xs pl-8 pr-3 py-1.5 rounded-full border ${
                    isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-700"
                  } focus:outline-none focus:ring-1 focus:ring-blue`}
                />
              </div>
            </div>
          </div>

          {transcript && (
            <p className={`text-[11px] ${textSecondary} mb-3`}>
              {wordCount} words · ~{readTime} min read · click a line to jump the video there
            </p>
          )}

          {keywords && keywords.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              <span className={`text-[11px] font-semibold ${textSecondary} mr-1`}>Topics:</span>
              {keywords.map((k) => (
                <button
                  key={k.word}
                  onClick={() => setSearch(k.word)}
                  style={{ opacity: 0.5 + k.weight * 0.5 }}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple text-white hover:opacity-100 transition"
                  title={`Appears ${k.count} times — click to search`}
                >
                  {k.word}
                </button>
              ))}
            </div>
          )}

          {!transcript ? (
            <div className="flex flex-col items-center justify-center text-center py-14">
              <Music className="text-gray-400 mb-3" size={28} />
              <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                No transcript yet
              </p>
              <p className={`text-xs ${textSecondary} mt-1 max-w-xs`}>
                Select a video, choose a language, and click Generate Transcript.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-h-[460px] overflow-y-auto">
              {filteredSegments.map((seg) => {
                const isActive = seg.originalIndex === activeIndex;
                const isEditing = editingIndex === seg.originalIndex;
                return (
                  <div
                    key={seg.originalIndex}
                    ref={(el) => (segmentRefs.current[seg.originalIndex] = el)}
                    className={`group flex items-start gap-2 text-sm rounded-lg px-2 py-1.5 transition-colors ${
                      isActive ? (isDark ? "bg-blue/20" : "bg-blue/10") : ""
                    }`}
                  >
                    <button
                      onClick={() => seekTo(seg.start)}
                      className="text-blue font-semibold shrink-0 hover:underline"
                    >
                      {formatTime(seg.start)}
                    </button>

                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          autoFocus
                          className={`flex-1 text-sm rounded border px-2 py-1 ${
                            isDark ? "bg-white/5 border-white/20 text-gray-100" : "bg-white border-gray-300 text-gray-800"
                          }`}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(seg.originalIndex)}
                        />
                        <button
                          onClick={() => saveEdit(seg.originalIndex)}
                          className="text-xs font-semibold text-teal shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <span
                          onClick={() => seekTo(seg.start)}
                          className={`flex-1 cursor-pointer ${isDark ? "text-gray-300" : "text-gray-800"}`}
                        >
                          {seg.text}
                        </span>
                        <button
                          onClick={() => startEdit(seg.originalIndex, seg.text)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue transition-opacity shrink-0"
                          title="Edit this line"
                        >
                          <Edit3 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <VideoInsights selectedVideo={selectedVideo} />
    </div>
  );
}