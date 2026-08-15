"use client";

import { useState, useRef } from "react";
import { Upload, FileVideo, X, CheckCircle2, FileText, Sparkles, Clock, Link as LinkIcon, Loader2 } from "lucide-react";

const ALLOWED_EXTENSIONS = ["mp4", "mov", "avi", "webm", "mkv", "flv", "wmv", "mpeg", "mpg", "3gp", "m4v", "ts", "ogv"];
const MAX_SIZE_MB = 2048;

export default function UploadVideo({ onNavigate }) {
  const [mode, setMode] = useState("file"); // "file" | "url"
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  // URL upload state
  const [videoUrl, setVideoUrl] = useState("");
  const [urlSubmitting, setUrlSubmitting] = useState(false);
  const [urlDone, setUrlDone] = useState(false);
  const [urlError, setUrlError] = useState("");

  function getExtension(filename) {
    return filename.split(".").pop().toLowerCase();
  }

  function validateFile(f) {
    const ext = getExtension(f.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported format ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}.`;
    }
    if (f.size / (1024 * 1024) > MAX_SIZE_MB) {
      return `File too large. Max size is ${MAX_SIZE_MB}MB.`;
    }
    return "";
  }

  function handleFile(f) {
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError("");
    setFile(f);
    setDone(false);
    setProgress(0);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleBrowse(e) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  function startUpload() {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError("");

    const token = localStorage.getItem("clipmind_token");
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8000/api/v1/videos/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setDone(true);
        setProgress(100);
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          setError(res.detail || "Upload failed.");
        } catch {
          setError("Upload failed. Please make sure you are logged in and the backend is running.");
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Could not connect to server. Please make sure the backend is running.");
    };

    xhr.send(formData);
  }

  async function startUrlUpload() {
    if (!videoUrl.trim()) return;
    setUrlSubmitting(true);
    setUrlError("");
    setUrlDone(false);

    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/videos/upload-from-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: videoUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUrlError(data.detail || "Failed to import video from this link.");
        setUrlSubmitting(false);
        return;
      }
      setUrlDone(true);
    } catch (err) {
      setUrlError("Could not connect to server. Make sure the backend is running.");
    }
    setUrlSubmitting(false);
  }

  function reset() {
    setFile(null);
    setProgress(0);
    setDone(false);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function resetUrl() {
    setVideoUrl("");
    setUrlDone(false);
    setUrlError("");
  }

  function switchMode(newMode) {
    setMode(newMode);
    reset();
    resetUrl();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Upload Video</h2>
      <p className="text-gray-500 mt-1 mb-6">
        Upload a video to generate transcripts, summaries, and key moments.
      </p>

      {/* Mode Toggle */}
      <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-6">
        <button
          onClick={() => switchMode("file")}
          className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition ${
            mode === "file" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Upload size={14} />
          Upload File
        </button>
        <button
          onClick={() => switchMode("url")}
          className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition ${
            mode === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <LinkIcon size={14} />
          Paste a Link
        </button>
      </div>

      {mode === "file" ? (
        <>
          {!file && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                dragActive ? "border-blue bg-blue/10" : "border-blue bg-blue/5"
              }`}
            >
              <FileVideo className="text-blue mb-3" size={40} />
              <p className="font-semibold text-gray-900">Drag & drop video to upload</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                MP4 · MOV · AVI · WebM · MKV · FLV · WMV · MPEG · 3GP · M4V · TS · OGV — max {MAX_SIZE_MB}MB
              </p>
              <button
                type="button"
                className="bg-blue text-white px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition"
              >
                <Upload size={16} />
                Browse Files
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleBrowse}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600 mt-3 font-medium">{error}</p>}

          {file && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center">
                    <FileVideo className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                </div>
                {!uploading && (
                  <button onClick={reset} className="text-gray-400 hover:text-gray-700">
                    <X size={18} />
                  </button>
                )}
              </div>

              {(uploading || done) && (
                <div className="mt-4">
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-150 ${done ? "bg-teal" : "bg-blue"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {done ? "Upload complete" : `Uploading... ${progress}%`}
                  </p>
                </div>
              )}

              {done && (
                <div className="flex items-center gap-2 text-teal mt-3 text-sm font-medium">
                  <CheckCircle2 size={18} />
                  Video uploaded and saved successfully.
                </div>
              )}

              {!uploading && !done && (
                <button
                  onClick={startUpload}
                  className="mt-4 bg-blue text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition"
                >
                  Start Upload
                </button>
              )}

              {done && (
                <>
                  <p className="text-xs font-semibold text-gray-500 mt-5 mb-2">What would you like to do next?</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onNavigate("Transcripts")}
                      className="flex flex-col items-center gap-1.5 border border-gray-200 rounded-xl py-3 hover:border-blue hover:bg-blue/5 transition"
                    >
                      <FileText size={18} className="text-blue" />
                      <span className="text-xs font-semibold text-gray-700">Transcript</span>
                    </button>
                    <button
                      onClick={() => onNavigate("Summaries")}
                      className="flex flex-col items-center gap-1.5 border border-gray-200 rounded-xl py-3 hover:border-blue hover:bg-blue/5 transition"
                    >
                      <Sparkles size={18} className="text-blue" />
                      <span className="text-xs font-semibold text-gray-700">Summary</span>
                    </button>
                    <button
                      onClick={() => onNavigate("Key Moments")}
                      className="flex flex-col items-center gap-1.5 border border-gray-200 rounded-xl py-3 hover:border-blue hover:bg-blue/5 transition"
                    >
                      <Clock size={18} className="text-blue" />
                      <span className="text-xs font-semibold text-gray-700">Key Moments</span>
                    </button>
                  </div>

                  <button
                    onClick={reset}
                    className="mt-3 w-full bg-gray-100 text-gray-700 px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition"
                  >
                    Upload Another Video
                  </button>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center shrink-0">
              <LinkIcon className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Import from a link</p>
              <p className="text-xs text-gray-500">Works with YouTube, Vimeo, and most direct video links</p>
            </div>
          </div>

          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            disabled={urlSubmitting || urlDone}
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2.5 mb-3 disabled:opacity-60"
          />

          {urlError && <p className="text-sm text-red-600 mb-3 font-medium">{urlError}</p>}

          {urlDone ? (
            <div className="flex items-center gap-2 text-teal mb-3 text-sm font-medium">
              <CheckCircle2 size={18} />
              Video imported and saved successfully.
            </div>
          ) : (
            <button
              onClick={startUrlUpload}
              disabled={!videoUrl.trim() || urlSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-blue text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {urlSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Importing... this may take a moment
                </>
              ) : (
                <>
                  <LinkIcon size={15} />
                  Import Video
                </>
              )}
            </button>
          )}

          {urlDone && (
            <>
              <p className="text-xs font-semibold text-gray-500 mt-5 mb-2">What would you like to do next?</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onNavigate("Transcripts")}
                  className="flex flex-col items-center gap-1.5 border border-gray-200 rounded-xl py-3 hover:border-blue hover:bg-blue/5 transition"
                >
                  <FileText size={18} className="text-blue" />
                  <span className="text-xs font-semibold text-gray-700">Transcript</span>
                </button>
                <button
                  onClick={() => onNavigate("Summaries")}
                  className="flex flex-col items-center gap-1.5 border border-gray-200 rounded-xl py-3 hover:border-blue hover:bg-blue/5 transition"
                >
                  <Sparkles size={18} className="text-blue" />
                  <span className="text-xs font-semibold text-gray-700">Summary</span>
                </button>
                <button
                  onClick={() => onNavigate("Key Moments")}
                  className="flex flex-col items-center gap-1.5 border border-gray-200 rounded-xl py-3 hover:border-blue hover:bg-blue/5 transition"
                >
                  <Clock size={18} className="text-blue" />
                  <span className="text-xs font-semibold text-gray-700">Key Moments</span>
                </button>
              </div>

              <button
                onClick={resetUrl}
                className="mt-3 w-full bg-gray-100 text-gray-700 px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition"
              >
                Import Another Video
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}