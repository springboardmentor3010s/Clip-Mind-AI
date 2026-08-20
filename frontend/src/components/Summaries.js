"use client";

import { useState } from "react";
import { Sparkles, Download, Loader2, Copy, Check, FileText, Minimize2, Search, List, HelpCircle, Share2, Link as LinkIcon, FileDown, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import VideoSelector from "@/components/VideoSelector";

export default function Summaries({ role }) {
  const LANGUAGES = [
    { code: "auto", label: "Same as transcript" },
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

  const { isDark } = useTheme();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [summaryLanguage, setSummaryLanguage] = useState("auto");
  const [summary, setSummary] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("paragraph"); // "paragraph" | "bullets"
  const [bullets, setBullets] = useState(null);
  const [loadingBullets, setLoadingBullets] = useState(false);
  const [qaPairs, setQaPairs] = useState(null);
  const [loadingQa, setLoadingQa] = useState(false);
  const [showQa, setShowQa] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  function handleSelectVideo(v) {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setSelectedVideo(v);
    setSummary(null);
    setError("");
    setSearch("");
    setBullets(null);
    setViewMode("paragraph");
    setQaPairs(null);
    setShowQa(false);
    checkExistingSummary(v.video_id);
  }

  function toggleSpeech() {
    if (!summary) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(summary.detailed_summary);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  async function checkExistingSummary(videoId) {
    setCheckingExisting(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/summaries/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSummary(await res.json());
    } catch (err) {
      // no existing summary
    }
    setCheckingExisting(false);
  }

  async function generateSummary() {
    if (!selectedVideo) return;
    setGenerating(true);
    setError("");
    setBullets(null);
    setViewMode("paragraph");
    setQaPairs(null);
    const token = localStorage.getItem("clipmind_token");

    try {
      const res = await fetch("http://localhost:8000/api/v1/summaries/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ video_id: selectedVideo.video_id, output_language: summaryLanguage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to generate summary.");
        setGenerating(false);
        return;
      }
      setSummary(data);
    } catch (err) {
      setError("Could not connect to server. Make sure the backend is running.");
    }
    setGenerating(false);
  }

  async function makeShorter() {
    if (!selectedVideo || !summary) return;
    setShortening(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/summaries/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ video_id: selectedVideo.video_id }),
      });
      const data = await res.json();
      if (res.ok) setSummary(data);
    } catch (err) {
      // ignore
    }
    setShortening(false);
  }

  async function toggleBullets() {
    if (viewMode === "bullets") {
      setViewMode("paragraph");
      return;
    }
    if (!bullets && selectedVideo) {
      setLoadingBullets(true);
      const token = localStorage.getItem("clipmind_token");
      try {
        const res = await fetch("http://localhost:8000/api/v1/summaries/bullets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ video_id: selectedVideo.video_id }),
        });
        if (res.ok) {
          const data = await res.json();
          setBullets(data.bullets);
        }
      } catch (err) {
        // ignore
      }
      setLoadingBullets(false);
    }
    setViewMode("bullets");
  }

  async function generateQa() {
    if (!selectedVideo) return;
    if (qaPairs) {
      setShowQa(!showQa);
      return;
    }
    setLoadingQa(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/summaries/qa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ video_id: selectedVideo.video_id }),
      });
      if (res.ok) {
        const data = await res.json();
        setQaPairs(data.qa_pairs);
        setShowQa(true);
      }
    } catch (err) {
      // ignore
    }
    setLoadingQa(false);
  }

  async function shareSummary() {
    if (!selectedVideo) return;
    setSharing(true);
    setShareUrl(null);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/sharing/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ video_id: selectedVideo.video_id }),
      });
      const data = await res.json();
      if (res.ok) {
        setShareUrl(data.share_url);
      } else {
        setError(data.detail || "Failed to create share link.");
      }
    } catch (err) {
      setError("Could not connect to server.");
    }
    setSharing(false);
  }

  function copyShareLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  function copySummary() {
    if (!summary) return;
    navigator.clipboard.writeText(summary.detailed_summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadSummary() {
    if (!summary) return;
    const content = `Summary — ${summary.video_title}\n\nShort Summary:\n${summary.short_summary}\n\nDetailed Summary:\n${summary.detailed_summary}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${summary.video_title.split(".")[0]}_summary.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function highlightMatch(text, query) {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber/40 text-inherit rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary}`}>Summaries</h2>
      <p className={`${textSecondary} mt-1 mb-4`}>Real AI-generated summaries using BART — requires a transcript first.</p>

      <VideoSelector onSelect={handleSelectVideo} selectedVideo={selectedVideo} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {selectedVideo?.video_url ? (
            <video
              key={selectedVideo.video_id}
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

          <div className={`${cardBg} border rounded-xl p-4 mt-4`}>
            <label className={`text-xs font-semibold ${textSecondary} mb-1.5 block`}>Summary Language</label>
            <select
              value={summaryLanguage}
              onChange={(e) => setSummaryLanguage(e.target.value)}
              className={`w-full text-sm rounded-lg border px-3 py-2 mb-3 ${
                isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
              }`}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
            <button
              onClick={generateSummary}
              disabled={!selectedVideo || generating}
              className="w-full flex items-center justify-center gap-2 bg-blue text-white text-sm font-semibold py-2.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  {summary ? "Regenerate Summary" : "Generate Summary"}
                </>
              )}
            </button>
            {generating && (
              <p className={`text-[11px] ${textSecondary} mt-2 text-center`}>
                First run downloads the AI model — this may take a while.
              </p>
            )}
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>

          {summary && (
            <div className={`${cardBg} border rounded-xl p-4 mt-4`}>
              <label className={`text-xs font-semibold ${textSecondary} mb-1.5 block`}>
                Search in summary
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type a keyword..."
                  className={`w-full text-sm pl-8 pr-3 py-2 rounded-lg border ${
                    isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                />
              </div>

              <button
                onClick={generateQa}
                disabled={loadingQa}
                className={`w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-full border mt-3 transition ${
                  isDark ? "border-white/10 text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {loadingQa ? <Loader2 size={13} className="animate-spin" /> : <HelpCircle size={13} />}
                {loadingQa ? "Generating Q&A..." : showQa ? "Hide Q&A" : "Generate Q&A"}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {checkingExisting ? (
            <div className={`${cardBg} border rounded-xl p-10 text-center`}>
              <Loader2 className="animate-spin text-gray-400 mx-auto mb-2" size={22} />
              <p className={`text-sm ${textSecondary}`}>Checking for existing summary...</p>
            </div>
          ) : !summary ? (
            <div className={`${cardBg} border rounded-xl p-10 text-center`}>
              <Sparkles className="text-gray-400 mx-auto mb-3" size={28} />
              <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                No summary yet
              </p>
              <p className={`text-xs ${textSecondary} mt-1 max-w-xs mx-auto`}>
                Select a video with a transcript already generated, then click Generate Summary.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {summary.compression_ratio != null && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal/15 text-teal">
                    {summary.compression_ratio}% shorter than original ({summary.summary_word_count} / {summary.original_word_count} words)
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleBullets}
                    disabled={loadingBullets}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                      viewMode === "bullets"
                        ? "bg-blue text-white border-blue"
                        : isDark
                        ? "border-white/10 text-gray-300 hover:bg-white/5"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <List size={13} />
                    {loadingBullets ? "Loading..." : viewMode === "bullets" ? "Paragraph" : "Bullets"}
                  </button>
                  <button
                    onClick={copySummary}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      isDark ? "border-white/10 text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {copied ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={toggleSpeech}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition ${
                      speaking
                        ? "bg-purple text-white border-purple"
                        : isDark
                        ? "border-white/10 text-gray-300 hover:bg-white/5"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    {speaking ? "Stop" : "Listen"}
                  </button>
                  <button
                    onClick={downloadSummary}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue hover:underline"
                  >
                    <FileText size={13} />
                    Download .txt
                  </button>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("clipmind_token");
                      fetch(`http://localhost:8000/api/v1/summaries/${selectedVideo.video_id}/download-pdf`, {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                        .then((res) => res.blob())
                        .then((blob) => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${summary.video_title.split(".")[0]}_summary.pdf`;
                          a.click();
                          window.URL.revokeObjectURL(url);
                        });
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue hover:underline"
                  >
                    <FileDown size={13} />
                    Download .pdf
                  </button>
                  {role === "educator" && (
                    <button
                      onClick={shareSummary}
                      disabled={sharing}
                      className="flex items-center gap-1.5 text-xs font-semibold text-teal hover:underline disabled:opacity-50"
                    >
                      {sharing ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
                      Share
                    </button>
                  )}
                </div>
              </div>

              {shareUrl && (
                <div className={`${cardBg} border rounded-xl p-4 flex items-center gap-3`}>
                  <LinkIcon size={16} className="text-teal shrink-0" />
                  <input
                    readOnly
                    value={shareUrl}
                    className={`flex-1 text-xs bg-transparent outline-none ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  />
                  <button
                    onClick={copyShareLink}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue hover:underline shrink-0"
                  >
                    {shareCopied ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                    {shareCopied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}

              <div className={`${isDark ? "bg-teal/10" : "bg-teal/5"} border border-teal rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-teal font-semibold text-sm flex items-center gap-2">
                    <Sparkles size={15} />
                    Short Summary <span className="text-xs font-normal">({summary.language})</span>
                  </h4>
                  <button
                    onClick={makeShorter}
                    disabled={shortening}
                    className="flex items-center gap-1.5 text-xs font-semibold text-teal hover:underline disabled:opacity-50"
                  >
                    {shortening ? <Loader2 size={13} className="animate-spin" /> : <Minimize2 size={13} />}
                    Make Shorter
                  </button>
                </div>
                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                  {highlightMatch(summary.short_summary, search)}
                </p>
              </div>

              <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
                <h4 className={`font-semibold ${textPrimary} mb-2`}>Detailed Summary</h4>
                {viewMode === "bullets" && bullets ? (
                  <ul className="list-disc pl-5 flex flex-col gap-1.5">
                    {bullets.map((b, i) => (
                      <li key={i} className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
                        {highlightMatch(b, search)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
                    {highlightMatch(summary.detailed_summary, search)}
                  </p>
                )}
              </div>

              {showQa && qaPairs && qaPairs.length > 0 && (
                <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
                  <h4 className={`font-semibold ${textPrimary} mb-3 flex items-center gap-2`}>
                    <HelpCircle size={16} />
                    Quiz Yourself
                  </h4>
                  <div className="flex flex-col gap-3">
                    {qaPairs.map((qa, i) => (
                      <details key={i} className={`rounded-lg border ${isDark ? "border-white/10" : "border-gray-200"}`}>
                        <summary className={`text-sm font-medium cursor-pointer px-3 py-2.5 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                          {qa.question}
                        </summary>
                        <p className={`text-sm px-3 pb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{qa.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}