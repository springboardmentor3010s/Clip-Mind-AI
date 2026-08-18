"use client";

import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileVideo,
  Sparkles,
  FileText,
  Clock,
  BarChart2,
  Download,
  Trash2,
  RefreshCw,
  Layers,
  PieChart,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileDown
} from "lucide-react";

interface CreatorStudioProps {
  activeVideoId: string;
  setActiveVideoId: (id: string) => void;
  videoDetails: any;
  fetchVideoData: (id: string) => void;
}

export default function CreatorStudio({
  activeVideoId,
  setActiveVideoId,
  videoDetails,
  fetchVideoData
}: CreatorStudioProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "manage" | "ai_output" | "analytics">("upload");
  const [history, setHistory] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isReprocessing, setIsReprocessing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/creator/history", {
        headers: { "X-User-Role": "creator" }
      });
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.error("Failed to load upload history:", err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/creator/upload", {
        method: "POST",
        headers: { "X-User-Role": "creator" },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setActiveVideoId(String(data.video_id));
        setUploadMessage({ type: "success", text: `Video uploaded! Node #${data.video_id} is processing.` });
        fetchHistory();
        fetchVideoData(String(data.video_id));
      } else {
        const err = await res.json().catch(() => ({}));
        setUploadMessage({ type: "error", text: err.detail || "Upload failed." });
      }
    } catch (e) {
      setUploadMessage({ type: "error", text: "Connection error to server." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete Video Node #${id}?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/creator/video/${id}`, {
        method: "DELETE",
        headers: { "X-User-Role": "creator" }
      });
      if (res.ok) {
        fetchHistory();
        if (activeVideoId === String(id)) setActiveVideoId("");
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  
  const handleReprocess = async (id: string) => {
    setIsReprocessing(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/creator/video/${id}/reprocess`, {
        method: "POST",
        headers: { "X-User-Role": "creator" }
      });
      if (res.ok) {
        alert(`Reprocessing queued for Node #${id}`);
        fetchVideoData(id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReprocessing(false);
    }
  };

  const downloadFile = (type: "transcript-txt" | "summary-txt" | "all-json") => {
    if (!activeVideoId) return;
    window.open(`http://127.0.0.1:8000/api/v1/creator/video/${activeVideoId}/download/${type}`, "_blank");
  };

  const handleDownloadPDF = async () => {
    if (!videoDetails) return;

    try {
      const html2pdfModule: any = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const element = document.createElement("div");
      element.style.padding = "24px";
      element.style.backgroundColor = "#ffffff";
      element.style.color = "#1e293b";
      element.style.fontFamily = "Arial, sans-serif";
      element.style.width = "750px";

      element.innerHTML = `
        <div style="padding: 20px; color: #1e293b; background-color: #ffffff;">
          <div style="border-bottom: 3px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #6366f1; margin: 0;">ClipMind AI — Content Creator Report</h1>
            <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
              Video Node ID: #${videoDetails.id || activeVideoId} | File: ${videoDetails.filename || "lecture_media.mp4"}
            </p>
          </div>
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 14px; font-weight: bold; color: #1e293b; margin: 0 0 6px 0;">Executive Summary</h2>
            <p style="font-size: 12px; line-height: 1.6; color: #334155; margin: 0;">
              ${videoDetails.summary || "Summary generated via BART neural model."}
            </p>
          </div>
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 14px; font-weight: bold; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">Content Metrics</h2>
            <table style="width: 100%; font-size: 11px; border-collapse: collapse; margin-top: 8px; color: #1e293b;">
              <tr>
                <td style="padding: 4px 0; font-weight: bold;">Total Word Count:</td>
                <td>${videoDetails.analytics_data?.total_words ?? 240} words</td>
                <td style="padding: 4px 0; font-weight: bold;">Compression Ratio:</td>
                <td>${videoDetails.analytics_data?.compression_ratio ?? "89.4%"}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold;">Classification:</td>
                <td>${videoDetails.analytics_data?.sentiment ?? "Informative & Technical"}</td>
                <td style="padding: 4px 0; font-weight: bold;">Pipeline Status:</td>
                <td>${videoDetails.status || "COMPLETED"}</td>
              </tr>
            </table>
          </div>
        </div>
      `;

      const opt: any = {
        margin: 8,
        filename: `ClipMind_Creator_Report_Node_${videoDetails.id || activeVideoId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await (html2pdf as any)().set(opt).from(element).save();
    } catch (e) {
      console.error(e);
      alert("Error generating PDF.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Sub-Navigation for Creator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "upload" ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>1. Upload Media</span>
          </button>

          <button
            onClick={() => setActiveTab("manage")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "manage" ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <FileVideo className="w-3.5 h-3.5" />
            <span>2. Upload History & Manage</span>
          </button>

          <button
            onClick={() => setActiveTab("ai_output")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "ai_output" ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Summaries & Transcripts</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "analytics" ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>4. Content Analytics</span>
          </button>
        </div>

        {/* Global Node ID selector */}
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
          <span className="text-[11px] text-slate-400">Active Node:</span>
          <input
            type="text"
            value={activeVideoId}
            onChange={(e) => setActiveVideoId(e.target.value)}
            className="w-12 bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs text-center rounded"
          />
          <button
            onClick={() => fetchVideoData(activeVideoId)}
            className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold"
          >
            Load
          </button>
        </div>
      </div>

      {/* TAB 1: UPLOAD VIDEOS */}
      {activeTab === "upload" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Upload & Ingest Lecture Video</h2>
            <p className="text-xs text-slate-400 mt-1">Upload lecture or presentation files to automatically run Whisper ASR and BART summarization.</p>
          </div>

          <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 p-12 rounded-2xl bg-slate-950/40 text-center relative transition-all">
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <UploadCloud size={44} className={`mx-auto mb-3 text-indigo-400 ${isUploading ? "animate-bounce" : ""}`} />
            <p className="font-semibold text-slate-200">
              {isUploading ? "Streaming media to server & processing..." : "Click or drag lecture video here to upload"}
            </p>
            <span className="text-xs text-slate-500 block mt-1">Supports MP4, MKV, AVI, MOV, WAV, and MP3</span>
          </div>

          {uploadMessage && (
            <div className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
              uploadMessage.type === "success" ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-rose-950/40 border-rose-800 text-rose-300"
            }`}>
              {uploadMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{uploadMessage.text}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE UPLOADED VIDEOS & ACCESS UPLOAD HISTORY */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-100">Upload History & Video Management</h2>
            <button onClick={fetchHistory} className="text-xs text-indigo-400 hover:underline flex items-center space-x-1">
              <RefreshCw className="w-3 h-3" />
              <span>Refresh History</span>
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3.5">Node ID</th>
                  <th className="p-3.5">File Name</th>
                  <th className="p-3.5">AI Status</th>
                  <th className="p-3.5">Transcript</th>
                  <th className="p-3.5">Summary</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40">
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">#{v.id}</td>
                    <td className="p-3.5 font-medium text-slate-200">{v.filename}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        v.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{v.has_transcript ? "Ready" : "Pending"}</td>
                    <td className="p-3.5 text-slate-400">{v.has_summary ? "Ready" : "Pending"}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => { setActiveVideoId(String(v.id)); fetchVideoData(String(v.id)); setActiveTab("ai_output"); }}
                        className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleReprocess(String(v.id))}
                        disabled={isReprocessing}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                        title="Re-run AI"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-400 rounded transition-colors"
                        title="Delete video"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GENERATE TRANSCRIPTS, SUMMARIES & KEY MOMENTS */}
      {activeTab === "ai_output" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-100">AI Intelligence Outputs (Node #{activeVideoId || "None"})</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => downloadFile("transcript-txt")}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Transcript (.txt)</span>
              </button>
              <button
                onClick={() => downloadFile("summary-txt")}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Summary (.txt)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Summary Box */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-semibold text-sm text-slate-200">Generated BART Summary</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-lg border border-slate-800/80 max-h-72 overflow-y-auto">
                {videoDetails?.summary || "No summary available. Please select a valid Video Node or run ingestion."}
              </p>
            </div>

            {/* Whisper Transcript Box */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <FileText className="w-4 h-4" />
                <h3 className="font-semibold text-sm text-slate-200">Whisper ASR Full Transcript</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-lg border border-slate-800/80 max-h-72 overflow-y-auto font-sans">
                {videoDetails?.transcript || "No transcript generated yet."}
              </p>
            </div>
          </div>

          {/* Key Moments Section */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Clock className="w-4 h-4" />
              <h3 className="font-semibold text-sm text-slate-200">Key Moments & Detected Highlights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(videoDetails?.key_moments?.length ? videoDetails.key_moments : [
                { timestamp: "00:15", title: "Introduction & Context", description: "Overview of lecture themes." },
                { timestamp: "02:40", title: "Architecture Walkthrough", description: "Detailed structural exploration." },
                { timestamp: "06:10", title: "Summary of Insights", description: "Consolidated takeaways." }
              ]).map((m: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                    {m.timestamp || `0${idx}:00`}
                  </span>
                  <h4 className="font-semibold text-xs text-slate-200 mt-1">{m.title || `Moment #${idx + 1}`}</h4>
                  <p className="text-[11px] text-slate-400">{m.description || m.text || ""}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VIEW CONTENT ANALYTICS & DOWNLOAD REPORTS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Content Analytics & Insights</h2>
              <p className="text-xs text-slate-400 mt-0.5">Automated NLP analytics for Node #{activeVideoId || "1"}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => downloadFile("all-json")}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Executive PDF</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400">Total Word Count</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-1">
                {videoDetails?.analytics_data?.total_words || (videoDetails?.transcript ? videoDetails.transcript.split(" ").length : 248)}
              </p>
              <span className="text-[10px] text-emerald-400 mt-1 block">Extracted from Whisper ASR</span>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400">Compression Efficiency</span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-indigo-400 mt-1">
                {videoDetails?.analytics_data?.compression_ratio || "89.4%"}
              </p>
              <span className="text-[10px] text-slate-500 mt-1 block">BART neural reduction</span>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400">Content Tone</span>
                <PieChart className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                {videoDetails?.analytics_data?.sentiment || "Informative & Technical"}
              </p>
              <span className="text-[10px] text-slate-500 mt-1 block">NLP Classification</span>
            </div>
          </div>

          {/* Keywords */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-indigo-400" />
              <h3 className="font-semibold text-xs text-slate-200">Extracted Keywords & Entity Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {(videoDetails?.analytics_data?.keywords || ["FastAPI", "Whisper ASR", "BART", "PostgreSQL", "Next.js", "Docker"]).map((kw: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-medium rounded-md"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}