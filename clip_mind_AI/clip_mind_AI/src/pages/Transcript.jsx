import { useState, useRef, useEffect } from "react";
import { useVideo } from "../context/VideoContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { seekAndPlay } from "../lib/player";
import { canEditTranscript } from "../lib/roles";

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function Transcript() {
  const { toast, Toaster } = useToast();
  const { activeVideo, display, translating, updateTranscript, recordView } = useVideo();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);

  // Transcript editing (Educator / Content Creator review workflow)
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);

  const videoRef = useRef(null);
  const [ytStartSec, setYtStartSec] = useState(0);
  const viewRecordedFor = useRef(null);

  // Sync HTML5 video play time
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
    };

    videoEl.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoEl.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [activeVideo]);

  // Record one view per video per visit — this is the signal behind learning
  // history and the educator's classroom analytics.
  useEffect(() => {
    if (
      activeVideo?.status === "completed" &&
      viewRecordedFor.current !== activeVideo.id
    ) {
      viewRecordedFor.current = activeVideo.id;
      recordView(activeVideo.id, 0);
    }
  }, [activeVideo?.id, activeVideo?.status, recordView]);

  // Report the furthest position reached when leaving, so completion can be
  // computed without a per-second stream of requests. The element is captured
  // inside the effect — reading videoRef.current in cleanup would see whatever
  // element is mounted at teardown, not the one this effect ran for.
  useEffect(() => {
    const el = videoRef.current;
    const videoId = activeVideo?.id;
    return () => {
      if (el && videoId && el.currentTime > 0) {
        recordView(videoId, el.currentTime);
      }
    };
  }, [activeVideo?.id, recordView]);

  if (!activeVideo) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <p className="text-5xl mb-4">📄</p>
          <h2 className="text-2xl font-bold">No Video Selected</h2>
          <p className="text-gray-400 mt-2">
            Please select a video from the sidebar dropdown or upload a new one to view its transcript.
          </p>
        </div>
      </div>
    );
  }

  if (activeVideo.status !== "completed") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <p className="text-5xl mb-4">⏳</p>
          <h2 className="text-2xl font-bold">Transcript Pending</h2>
          <p className="text-gray-400 mt-2">
            This video is currently in the status <strong>{activeVideo.status}</strong>. Please wait for processing to complete.
          </p>
        </div>
      </div>
    );
  }

  const transcript = display.transcript;
  const segments = transcript?.segments || [];

  // Search filtering
  const filteredSegments = segments.filter((seg) =>
    seg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Jump to timestamp
  const handleJump = (seconds) => {
    if (videoRef.current && (activeVideo.video_file_url || activeVideo.video_file)) {
      seekAndPlay(videoRef.current, seconds);
    } else if (activeVideo.youtube_id) {
      setYtStartSec(Math.floor(seconds));
    }
    toast(`Jumped to ${formatSeconds(seconds)}`, "success");
  };

  // Copy transcript
  const handleCopy = () => {
    if (navigator.clipboard) {
      const text = segments.map((s) => `[${formatSeconds(s.start)}] ${s.text}`).join("\n");
      navigator.clipboard.writeText(text);
      toast("Transcript copied to clipboard!", "success");
    }
  };

  // Download transcript
  const handleDownload = () => {
    const text = segments.map((s) => `[${formatSeconds(s.start)}] ${s.text}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeVideo.title || "transcript"}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Transcript download started!", "success");
  };

  // ── Transcript editing ──────────────────────────────────────────────
  const isEditable = canEditTranscript(user?.role) && activeVideo.is_owner;

  const startEditing = () => {
    // Edit the ORIGINAL segments, never a translated view — saving a
    // translation back would overwrite the source transcript.
    setDraft((activeVideo.transcript?.segments || []).map((s) => ({ ...s })));
    setEditing(true);
  };

  const updateDraftText = (index, text) => {
    setDraft((prev) => prev.map((seg, i) => (i === index ? { ...seg, text } : seg)));
  };

  const saveEdits = async () => {
    setSaving(true);
    try {
      await updateTranscript(activeVideo.id, { segments: draft });
      toast("Transcript updated.", "success");
      setEditing(false);
    } catch (err) {
      toast(err.response?.data?.message || err.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Playback speed change
  const handleSpeedChange = (e) => {
    const speed = parseFloat(e.target.value);
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster />
      <div className="max-w-7xl mx-auto py-6 px-4 md:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight truncate max-w-xl">
              {activeVideo.title}
            </h1>
            <p className="text-gray-400 mt-2">
              Synchronized media player & AI speech-to-text transcript.
            </p>
            {translating && <p className="text-blue-400 text-sm mt-1 animate-pulse">Translating…</p>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl font-semibold transition"
            >
              📋 Copy Raw
            </button>
            <button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl font-semibold transition shadow-lg shadow-blue-500/10"
            >
              ⬇️ Download
            </button>
            {isEditable && !editing && (
              <button
                onClick={startEditing}
                className="bg-amber-600 hover:bg-amber-700 px-4 py-2.5 rounded-xl font-semibold transition"
              >
                ✏️ Edit
              </button>
            )}
            {editing && (
              <>
                <button
                  onClick={saveEdits}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2.5 rounded-xl font-semibold transition"
                >
                  {saving ? "Saving…" : "💾 Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {activeVideo.transcript?.is_edited && !editing && (
          <p className="text-xs text-amber-400 mt-3">
            ✓ This transcript has been reviewed and corrected by a human.
          </p>
        )}

        {/* Media Player + Transcript Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          
          {/* Player (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              {activeVideo.video_file ? (
                <video
                  ref={videoRef}
                  src={activeVideo.video_file_url || activeVideo.video_file}
                  controls
                  preload="metadata"
                  className="w-full aspect-video bg-black"
                />
              ) : activeVideo.youtube_id ? (
                <iframe
                  key={ytStartSec}
                  src={`https://www.youtube.com/embed/${activeVideo.youtube_id}?start=${ytStartSec}&autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full aspect-video bg-black"
                />
              ) : (
                <div className="w-full aspect-video bg-black flex items-center justify-center">
                  <p className="text-gray-400">No media available.</p>
                </div>
              )}

              {/* Player Controls (only for local video file) */}
              {activeVideo.video_file && (
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <span>Speed:</span>
                    <select
                      value={playbackSpeed}
                      onChange={handleSpeedChange}
                      className="bg-slate-800 text-white rounded border border-slate-700 px-2 py-1 outline-none"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="1">1.0x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2.0x</option>
                    </select>
                  </div>
                  <div>
                    <span>Current: {formatSeconds(currentTime)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Video Meta Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold">Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Source type</p>
                  <p className="font-semibold text-gray-300 capitalize">{activeVideo.source_url ? "YouTube" : "Upload"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Language</p>
                  <p className="font-semibold text-gray-300 capitalize">{transcript?.language || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total words</p>
                  <p className="font-semibold text-gray-300">{transcript?.word_count || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-semibold text-emerald-400 capitalize">{activeVideo.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transcript Viewer (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col h-[600px] shadow-2xl">
            
            {/* Search and filter */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search transcript segments..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition text-sm"
              />
            </div>

            {/* Editable segment list — timings stay fixed, only text changes */}
            {editing ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                <p className="text-xs text-amber-400 mb-2">
                  Editing {draft.length} segments. Timestamps are preserved so the
                  transcript stays in sync with the player.
                </p>
                {draft.map((seg, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="text-blue-400 text-sm font-bold mt-2.5 shrink-0 w-14">
                      [{formatSeconds(seg.start)}]
                    </span>
                    <textarea
                      value={seg.text}
                      onChange={(e) => updateDraftText(idx, e.target.value)}
                      rows={2}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 transition resize-y"
                    />
                  </div>
                ))}
              </div>
            ) : (
            /* Segments list */
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {filteredSegments.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  No matching transcript segments found.
                </div>
              ) : (
                filteredSegments.map((seg, idx) => {
                  const isCurrent =
                    currentTime >= seg.start &&
                    (idx === segments.length - 1 || currentTime < segments[idx + 1].start);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleJump(seg.start)}
                      className={`p-3.5 rounded-xl transition duration-200 cursor-pointer flex gap-4 text-left group
                        ${isCurrent ? "bg-blue-600/10 border border-blue-500/30" : "hover:bg-slate-850/50 border border-transparent"}
                      `}
                    >
                      <span
                        className={`text-sm font-bold mt-0.5 shrink-0 transition
                          ${isCurrent ? "text-blue-400" : "text-blue-500/70 group-hover:text-blue-400"}
                        `}
                      >
                        [{formatSeconds(seg.start)}]
                      </span>
                      <p
                        className={`leading-relaxed text-sm md:text-base transition
                          ${isCurrent ? "text-white font-medium" : "text-gray-300 group-hover:text-white"}
                        `}
                      >
                        {seg.text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default Transcript;

