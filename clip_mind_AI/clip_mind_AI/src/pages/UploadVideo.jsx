import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVideo } from "../context/VideoContext";

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"];
const MAX_SIZE_GB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_GB * 1024 * 1024 * 1024;

// Optional source-language hints (ISO-639-1). "" = auto-detect (default workflow).
const LANGUAGE_OPTIONS = [
  { code: "", label: "Auto-detect (recommended)" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi / Haryanvi" },
  { code: "ur", label: "Urdu" },
  { code: "pa", label: "Punjabi" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "bn", label: "Bengali" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ar", label: "Arabic" },
];

function isValidYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]{11}/.test(url.trim());
}

function UploadVideo() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { uploadVideoFile, submitYoutubeUrl } = useVideo();

  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState("");
  const [fileError, setFileError] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // ── File validation ───────────────────────────────────────────────
  function handleFile(file) {
    setFileError("");
    setApiError("");
    if (!file) return;

    // Standardize check since type might be empty on Windows for MKV
    const nameExt = file.name.split(".").pop().toLowerCase();
    const isSupported = ACCEPTED_TYPES.includes(file.type) || ["mp4", "mov", "avi", "mkv", "webm"].includes(nameExt);

    if (!isSupported) {
      setFileError("Unsupported format. Please upload MP4, MOV, AVI, WebM, or MKV.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFileError(`File too large. Maximum size is ${MAX_SIZE_GB} GB.`);
      return;
    }
    setSelectedFile(file);
  }

  // ── Drag & drop ───────────────────────────────────────────────────
  function onDragOver(e) {
    e.preventDefault();
    if (loading) return;
    setIsDragging(true);
  }
  function onDragLeave() { setIsDragging(false); }
  function onDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (loading) return;
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  // ── File input change ─────────────────────────────────────────────
  function onFileChange(e) {
    handleFile(e.target.files[0]);
  }

  // ── Remove selected file ──────────────────────────────────────────
  function removeFile() {
    setSelectedFile(null);
    setFileError("");
    setApiError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Proceed to processing (video file) ───────────────────────────
  async function handleUpload() {
    if (!selectedFile || loading) return;
    setLoading(true);
    setApiError("");
    try {
      await uploadVideoFile(selectedFile, language);
      navigate("/processing");
    } catch (err) {
      setApiError(err.message || "Failed to upload and process video.");
    } finally {
      setLoading(false);
    }
  }

  // ── Analyze YouTube URL ───────────────────────────────────────────
  async function handleAnalyze() {
    if (loading) return;
    setUrlError("");
    setApiError("");
    const url = youtubeUrl.trim();
    if (!url) {
      setUrlError("Please paste a YouTube video URL.");
      return;
    }
    if (!isValidYouTubeUrl(url)) {
      setUrlError("Invalid YouTube URL. Example: https://www.youtube.com/watch?v=xxxxx");
      return;
    }
    setLoading(true);
    try {
      await submitYoutubeUrl(url, language);
      navigate("/processing");
    } catch (err) {
      setApiError(err.message || "Failed to process YouTube video URL.");
    } finally {
      setLoading(false);
    }
  }

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto py-12 px-6">

        <h1 className="text-5xl font-bold text-center">Upload Your Video</h1>
        <p className="text-gray-400 text-center mt-4">
          Upload a video or paste a YouTube link to generate AI summaries,
          transcripts, and key moments.
        </p>

        {apiError && (
          <div className="mt-8 bg-red-950/40 border border-red-800 text-red-400 rounded-xl p-4 text-center">
            ⚠️ {apiError}
          </div>
        )}

        <div className="mt-8 bg-slate-900 rounded-3xl p-10 shadow-2xl">

          {/* ── Optional spoken-language hint (applies to file & YouTube) ── */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Spoken language <span className="text-gray-500 font-normal">(optional — improves accuracy)</span>
            </label>
            <select
              value={language}
              disabled={loading}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code || "auto"} value={opt.code}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Leave on <span className="text-gray-400">Auto-detect</span> for automatic detection. Pick a language only when you
              know the spoken language (e.g. Haryanvi songs → Hindi) for a more accurate original transcript.
            </p>
          </div>

          {/* ── Drag & Drop Zone ── */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !selectedFile && !loading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center transition cursor-pointer
              ${isDragging ? "border-blue-400 bg-blue-900/20" : "border-blue-500 hover:border-blue-400"}
              ${selectedFile ? "cursor-default" : ""}
              ${loading ? "opacity-50 cursor-not-allowed border-slate-700" : ""}`}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              disabled={loading}
              accept=".mp4,.mov,.avi,.mkv,.webm,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
              onChange={onFileChange}
              className="hidden"
            />

            {selectedFile ? (
              /* Selected file preview */
              <div onClick={(e) => e.stopPropagation()}>
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-green-400">{selectedFile.name}</h2>
                <p className="text-gray-400 mt-2">{formatSize(selectedFile.size)}</p>

                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-8 py-3 rounded-xl font-semibold transition flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                        Uploading...
                      </>
                    ) : (
                      "🚀 Start Processing"
                    )}
                  </button>
                  <button
                    onClick={removeFile}
                    disabled={loading}
                    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-6 py-3 rounded-xl font-semibold transition"
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            ) : (
              /* Default upload prompt */
              <>
                <div className="text-6xl mb-5">🎥</div>
                <h2 className="text-3xl font-bold">
                  {isDragging ? "Drop it here!" : "Drag & Drop Video"}
                </h2>
                <p className="text-gray-400 mt-4">or click to browse your files</p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="mt-8 bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-semibold transition"
                >
                  Choose Video
                </button>
                <p className="text-sm text-gray-500 mt-8">Supported: MP4 • MOV • AVI • MKV • WebM</p>
                <p className="text-sm text-gray-500 mt-2">Maximum Size: {MAX_SIZE_GB} GB</p>
              </>
            )}
          </div>

          {/* File error */}
          {fileError && (
            <p className="mt-4 text-red-400 text-sm text-center">{fileError}</p>
          )}

          {/* ── Divider ── */}
          <div className="flex items-center my-10">
            <div className="flex-1 border-b border-slate-700"></div>
            <span className="px-5 text-gray-400">OR</span>
            <div className="flex-1 border-b border-slate-700"></div>
          </div>

          {/* ── YouTube URL ── */}
          <h2 className="text-2xl font-semibold mb-4">Analyze YouTube Video</h2>

          <input
            type="text"
            value={youtubeUrl}
            disabled={loading}
            onChange={(e) => { setYoutubeUrl(e.target.value); setUrlError(""); }}
            placeholder="Paste YouTube Video URL here..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* URL error */}
          {urlError && (
            <p className="mt-2 text-red-400 text-sm">{urlError}</p>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 py-4 rounded-xl text-lg font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                Submitting...
              </>
            ) : (
              <>🔍 Analyze Video</>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}

export default UploadVideo;

