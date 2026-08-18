"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Video, Sparkles, BarChart2, Clock, UploadCloud, 
  Search, Play, CheckCircle2, AlertCircle, FileVideo, Layers, 
  PieChart, Tag, Download, Users, Shield, GraduationCap, 
  Bookmark, Share2, Activity, Edit3, Trash2, RefreshCw, FileDown, Check,
  BookOpen, HelpCircle, HardDrive, Cpu, Terminal, Settings, Sliders
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
export type UserRole = "creator" | "learner" | "educator" | "admin";

export default function DashboardPage() {
  const [currentRole, setCurrentRole] = useState<UserRole>("creator");
  const [currentView, setCurrentView] = useState<string>("creator_upload");
  
  // Shared Active Video State
  const [activeVideoId, setActiveVideoId] = useState<string>("1");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [videoDetails, setVideoDetails] = useState<any>(null);

  // Content Creator States
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Learner States
  const [learnerBookmarks, setLearnerBookmarks] = useState<any[]>([]);
  const [learningHistory, setLearningHistory] = useState<any[]>([]);
  const [learnerLibrary, setLearnerLibrary] = useState<any[]>([]);
  // Educator States
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscriptText, setEditedTranscriptText] = useState("");
  const [studyMaterials, setStudyMaterials] = useState<any>(null);
  const [educatorMetrics, setEducatorMetrics] = useState<any>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  // Administrator States
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);
  const [adminConfigs, setAdminConfigs] = useState<any[]>([]);
  const [adminContent, setAdminContent] = useState<any[]>([]);
  // Initial session setup
  useEffect(() => {
    const savedRole = localStorage.getItem("role") as UserRole;
    if (savedRole && ["creator", "learner", "educator", "admin"].includes(savedRole)) {
      handleRoleChange(savedRole);
    } else {
      handleRoleChange("creator");
    }
  }, []);

  // Sync data when active node changes
  useEffect(() => {
    if (activeVideoId) {
      fetchVideoData(activeVideoId);
      if (currentRole === "educator") {
        fetchEducatorData(activeVideoId);
      }
    }
  }, [activeVideoId, currentRole]);
 const router = useRouter();

const handleLogout = () => {
  // Clear stored auth tokens, role, and cached credentials
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_email");
  }

  // Redirect user to the login screen
  router.push("/login");
};
  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem("role", role);
    setIsEditingTranscript(false);
    setSearchResults([]);

    // Trigger immediate fetch for the active video node
    if (activeVideoId) {
      fetchVideoData(activeVideoId);
    }

    if (role === "creator") {
      setCurrentView("creator_upload");
      fetchUploadHistory();
    } else if (role === "learner") {
      setCurrentView("learner_summaries");
      fetchLearnerData();
    } else if (role === "educator") {
      setCurrentView("educator_materials");
      fetchEducatorData(activeVideoId);
    } else if (role === "admin") {
      setCurrentView("admin_system");
      fetchAdminData();
    }
  };


  
  // ==========================================
  // API Fetch Functions
  // ==========================================
   // 1. Unified Video Fetcher (Works reliably across all roles)
  const fetchVideoData = async (videoId: string) => {
    const id = String(videoId || "").trim();
    if (!id || isNaN(Number(id))) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/video/${id}`, {
        headers: {
          "X-User-Role": currentRole,
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setVideoDetails(data);
        setEditedTranscriptText(data.transcript || "");
      }
    } catch (e) {
      console.error("Error fetching video data:", e);
    }
  };

  const fetchUploadHistory = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/creator/history", {
        headers: { "X-User-Role": currentRole }
      });
      if (res.ok) setUploadHistory(await res.json());
    } catch (e) {
      console.error(e);
    }
  };
  const fetchLearnerData = async () => {
    try {
      const headers = {
        "X-User-Role": "learner",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      };

      const [libRes, bkmkRes, histRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/v1/learner/library", { headers }).catch(() => null),
        fetch("http://127.0.0.1:8000/api/v1/learner/bookmarks", { headers }).catch(() => null),
        fetch("http://127.0.0.1:8000/api/v1/learner/history", { headers }).catch(() => null),
      ]);

      if (libRes && libRes.ok) {
        const libData = await libRes.json();
        const validList = Array.isArray(libData) ? libData : [];
        setLearnerLibrary(validList);

        // Auto-select latest video if currently active ID is invalid or default #1
        if (validList.length > 0 && (!activeVideoId || activeVideoId === "1")) {
          const firstId = String(validList[0].id);
          setActiveVideoId(firstId);
          fetchVideoData(firstId);
        }
      }

      if (bkmkRes && bkmkRes.ok) {
        setLearnerBookmarks(await bkmkRes.json().catch(() => []));
      }

      if (histRes && histRes.ok) {
        setLearningHistory(await histRes.json().catch(() => []));
      }
    } catch (e) {
      console.error("Learner fetch error:", e);
    }
  };

 const fetchEducatorData = async (videoId: string | number) => {
    const id = String(videoId || activeVideoId || "").trim();
    if (!id || isNaN(Number(id))) return;

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/educator/metrics/${id}`, {
        headers: {
          "X-User-Role": "educator",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEducatorMetrics(data);
      }
    } catch (e) {
      console.warn("Could not load educator metrics:", e);
    }
  };
   // 1. Fetch All Admin Sub-Modules
  const fetchAdminData = async () => {
    const headers = {
      "Content-Type": "application/json",
      "X-User-Role": "admin",
      Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""}`,
    };

    try {
      const [metRes, usrRes, cntRes, cfgRes, logRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/v1/admin/metrics", { headers }).catch(() => null),
        fetch("http://127.0.0.1:8000/api/v1/admin/users", { headers }).catch(() => null),
        fetch("http://127.0.0.1:8000/api/v1/admin/content", { headers }).catch(() => null),
        fetch("http://127.0.0.1:8000/api/v1/admin/settings", { headers }).catch(() => null),
        fetch("http://127.0.0.1:8000/api/v1/admin/audit-logs", { headers }).catch(() => null),
      ]);

      if (metRes?.ok) setAdminMetrics(await metRes.json());
      if (usrRes?.ok) setAdminUsers(await usrRes.json());
      if (cntRes?.ok) setAdminContent(await cntRes.json());
      if (cfgRes?.ok) setAdminConfigs(await cfgRes.json());
      if (logRes?.ok) setAdminAuditLogs(await logRes.json());
    } catch (err) {
      console.error("Admin data synchronization error:", err);
    }
  };
  // ==========================================
  // Action Handlers
  // ==========================================
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (currentRole === "learner") {
      setUploadMessage({ type: "error", text: "Learners have read-only access. Switch role to upload." });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const endpoint = currentRole === "educator" ? "/api/v1/educator/upload" : "/api/v1/creator/upload";
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: "POST",
        headers: { "X-User-Role": currentRole },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const newId = String(data.video_id || data.id);
        setActiveVideoId(newId);
        setUploadMessage({ type: "success", text: `Uploaded successfully! Node #${newId} is queued for AI processing.` });
        fetchUploadHistory();
        fetchVideoData(newId);
      } else {
        const err = await res.json().catch(() => ({}));
        setUploadMessage({ type: "error", text: err.detail || "Upload failed." });
      }
    } catch (err) {
      setUploadMessage({ type: "error", text: "Failed to connect to backend server at http://127.0.0.1:8000." });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleGenerateStudyGuide = async (targetId?: string) => {
    const idToUse = Number(targetId || activeVideoId);
    if (!idToUse || isNaN(idToUse)) {
      alert("Please select or load a lecture node first.");
      return;
    }

    setIsGeneratingGuide(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/educator/study-materials/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": "educator",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ video_id: idToUse }),
      });

      if (res.ok) {
        const guideData = await res.json();
        setStudyMaterials(guideData);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to generate study materials.");
      }
    } catch (e) {
      console.error("Study material generation error:", e);
    } finally {
      setIsGeneratingGuide(false);
    }
  };
  const handleSaveEditedTranscript = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/educator/transcript/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-User-Role": currentRole },
        body: JSON.stringify({ video_id: Number(activeVideoId), updated_transcript: editedTranscriptText })
      });
      if (res.ok) {
        setIsEditingTranscript(false);
        fetchVideoData(activeVideoId);
        alert("Transcript saved and educational summary updated!");
      }
    } catch (e) {
      console.error(e);
    }
  };

// 2. Manage User Role Mutation
  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/admin/users/role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": "admin",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });

      if (res.ok) {
        alert(`User #${userId} role updated to ${newRole}`);
        fetchAdminData();
      } else {
        alert("Failed to update role.");
      }
    } catch (e) {
      console.error(e);
    }
  };

   const handleAdminDeleteContent = async (videoId: number) => {
    if (!confirm(`Purge media Node #${videoId} from server disk and database?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/admin/content/${videoId}`, {
        method: "DELETE",
        headers: {
          "X-User-Role": "admin",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (res.ok) {
        alert(`Node #${videoId} purged successfully.`);
        fetchAdminData();
      } else {
        alert("Failed to delete content node.");
      }
    } catch (e) {
      console.error(e);
    }
  }; 

  // 4. Save Platform Setting
  const handleSavePlatformConfig = async (key: string, value: string) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": "admin",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ key, value }),
      });

      if (res.ok) {
        alert(`Setting '${key}' saved successfully!`);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (!confirm(`Are you sure you want to permanently delete Video Node #${id}?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/creator/video/${id}`, {
        method: "DELETE",
        headers: { "X-User-Role": currentRole },
      });
      if (res.ok) {
        alert(`Video #${id} deleted.`);
        fetchUploadHistory();
        if (activeVideoId === String(id)) setActiveVideoId("");
      } else {
        alert("Failed to delete video record.");
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleSaveBookmark = async (title: string, content: string, timestamp: string) => {
    const videoId = Number(activeVideoId);
    if (!videoId || isNaN(videoId)) {
      alert("Please select a valid lecture node before saving a bookmark.");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/learner/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": "learner",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          video_id: videoId,
          item_type: "highlight",
          title: title || "Study Highlight",
          content: content || "Key lecture concept and takeaway.",
          timestamp_str: timestamp || "00:00",
        }),
      });

      if (res.ok) {
        alert("Bookmark saved to your Study Space!");
        fetchLearnerData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to save bookmark.");
      }
    } catch (e) {
      console.error("Error saving bookmark:", e);
      alert("Cannot connect to backend server.");
    }
  };
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/learner/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { "X-User-Role": currentRole }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Authenticated Blob Downloader (Solves Access Denied)
  const downloadDirectFile = async (type: "transcript-txt" | "summary-txt" | "all-json") => {
    // 1. Guard against empty or invalid node IDs
    const videoId = String(activeVideoId || "").trim();
    if (!videoId || isNaN(Number(videoId))) {
      alert("Please select or load a valid Video Node (e.g. #1) before downloading.");
      return;
    }

    try {
      const targetRole = currentRole || "creator";
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/creator/video/${videoId}/download/${type}?role=${encodeURIComponent(targetRole)}`,
        {
          method: "GET",
          headers: {
            "X-User-Role": targetRole,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.detail || `Download failed with status ${res.status}.`);
        return;
      }

      // 2. Trigger browser file save
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const extension = type === "all-json" ? "json" : "txt";
      link.download = `ClipMind_${type}_Node_${videoId}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download fetch error:", err);
      alert("Could not connect to backend server. Please verify Uvicorn is running on port 8000.");
    }
  };
  const handleDownloadPDF = async () => {
    if (!videoDetails) {
      alert("Please load a video node first.");
      return;
    }

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
            <h1 style="font-size: 24px; font-weight: bold; color: #6366f1; margin: 0;">ClipMind AI — Executive Video Report</h1>
            <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
              Video Node ID: #${videoDetails.id || activeVideoId} | File: ${videoDetails.filename || "lecture.mp4"} | Role: ${currentRole.toUpperCase()}
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
                <td style="padding: 4px 0; font-weight: bold;">Status:</td>
                <td>${videoDetails.status || "COMPLETED"}</td>
              </tr>
            </table>
          </div>
        </div>
      `;

      const opt: any = {
        margin: 8,
        filename: `ClipMind_${currentRole}_Report_Node_${videoDetails.id || activeVideoId}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await (html2pdf as any)().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("Error compiling PDF.");
    }
  };
 // 1. Helper to normalize backend role strings to frontend keys
  const normalizeRole = (roleStr: string | null): UserRole => {
    if (!roleStr) return "creator";
    const clean = roleStr.toLowerCase().trim();
    if (clean.includes("admin")) return "admin";
    if (clean.includes("learn")) return "learner";
    if (clean.includes("edu")) return "educator";
    return "creator";
  };

  // 2. Helper to set default view per role
  const getDefaultViewForRole = (role: UserRole) => {
    switch (role) {
      case "learner":
        return "learner_summaries";
      case "educator":
        return "educator_upload";
      case "admin":
        return "admin_system";
      default:
        return "creator_upload";
    }
  };

  // 3. Auto-sync role and view on initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedRoleRaw = localStorage.getItem("role");
    const resolvedRole = normalizeRole(savedRoleRaw);

    setCurrentRole(resolvedRole);
    setCurrentView(getDefaultViewForRole(resolvedRole));

    // Auto-fetch data for the resolved role
    if (resolvedRole === "learner") {
      fetchLearnerData();
    } else if (resolvedRole === "educator") {
      fetchEducatorData(activeVideoId);
    } else if (resolvedRole === "admin") {
      fetchAdminData();
    } else {
      fetchUploadHistory();
    }
  }, []);
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* ========================================================
          ROLE-SPECIFIC SIDEBAR NAVIGATION
      ======================================================== */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ClipMind AI
            </span>
          </div>

          {/* 1. CONTENT CREATOR TABS */}
          {currentRole === "creator" && (
            <nav className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block px-2 mb-2">Creator Tools</span>
              <button onClick={() => setCurrentView("creator_upload")} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "creator_upload" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <UploadCloud className="w-4 h-4" /><span>1. Upload Media</span>
              </button>
              <button onClick={() => { setCurrentView("creator_history"); fetchUploadHistory(); }} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "creator_history" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <FileVideo className="w-4 h-4" /><span>2. Upload History & Manage</span>
              </button>
              <button onClick={() => setCurrentView("creator_output")} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "creator_output" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <Sparkles className="w-4 h-4" /><span>3. Summaries & Transcripts</span>
              </button>
              <button onClick={() => setCurrentView("creator_analytics")} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "creator_analytics" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <BarChart2 className="w-4 h-4" /><span>4. Content Analytics</span>
              </button>
            </nav>
          )}

          {/* 2. LEARNER TABS */}
          {currentRole === "learner" && (
            <nav className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block px-2 mb-2">Learner Space</span>
              <button onClick={() => setCurrentView("learner_summaries")} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "learner_summaries" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <Sparkles className="w-4 h-4" /><span>Read AI Summaries</span>
              </button>
              <button onClick={() => setCurrentView("learner_transcripts")} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "learner_transcripts" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <FileText className="w-4 h-4" /><span>Access Transcripts</span>
              </button>
              <button onClick={() => setCurrentView("learner_moments")} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "learner_moments" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <Clock className="w-4 h-4" /><span>Key Moments</span>
              </button>
              <button onClick={() => { setCurrentView("learner_history"); fetchLearnerData(); }} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "learner_history" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <Bookmark className="w-4 h-4 text-amber-400" /><span>Bookmarks & History</span>
              </button>
            </nav>
          )}

          {/* 3. EDUCATOR TABS */}
          {currentRole === "educator" && (
            <nav className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block px-2 mb-2">Educator Studio</span>
              <button onClick={() => setCurrentView("educator_upload")} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "educator_upload" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <UploadCloud className="w-4 h-4" /><span>1. Upload Lecture Video</span>
              </button>
              <button onClick={() => setCurrentView("educator_materials")} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "educator_materials" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <BookOpen className="w-4 h-4" /><span>2. Study Guides & Sharing</span>
              </button>
              <button onClick={() => setCurrentView("educator_review")} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "educator_review" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <Edit3 className="w-4 h-4" /><span>3. Review & Edit Transcripts</span>
              </button>
              <button onClick={() => { setCurrentView("educator_metrics"); fetchEducatorData(activeVideoId); }} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "educator_metrics" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <Activity className="w-4 h-4" /><span>4. Classroom Engagement</span>
              </button>
            </nav>
          )}

          {/* 4. ADMINISTRATOR TABS */}
          {currentRole === "admin" && (
            <nav className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block px-2 mb-2">Admin Control</span>
              <button onClick={() => { setCurrentView("admin_system"); fetchAdminData(); }} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "admin_system" ? "bg-rose-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <Cpu className="w-4 h-4" /><span>1. System Analytics & Queues</span>
              </button>
              <button onClick={() => { setCurrentView("admin_users"); fetchAdminData(); }} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "admin_users" ? "bg-rose-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <Users className="w-4 h-4" /><span>2. Manage Users & Roles</span>
              </button>
              <button onClick={() => { setCurrentView("admin_content"); fetchAdminData(); }} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "admin_content" ? "bg-rose-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <HardDrive className="w-4 h-4" /><span>3. Content & Storage</span>
              </button>
              <button onClick={() => { setCurrentView("admin_settings"); fetchAdminData(); }} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "admin_settings" ? "bg-rose-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <Settings className="w-4 h-4" /><span>4. Platform Settings</span>
              </button>
              <button onClick={() => { setCurrentView("admin_audit"); fetchAdminData(); }} className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold ${currentView === "admin_audit" ? "bg-rose-600 text-white" : "text-slate-400 hover:bg-slate-900"}`}>
                <Terminal className="w-4 h-4" /><span>5. Audit Logs & Reports</span>
              </button>
            </nav>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Active Node:</span>
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
            #{activeVideoId || "None"}
          </span>
        </div>
        <div className="pt-4 mt-auto border-t border-slate-800">
  <button
    onClick={handleLogout}
    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:border-rose-900 border border-transparent transition-all"
  >
    <LogOut className="w-4 h-4" />
    <span>Log Out</span>
  </button>
</div>
      </aside>
      
      {/* ========================================================
          MAIN WORKSPACE
      ======================================================== */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/60 backdrop-blur px-8 flex items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search across all transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </form>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-400">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-xs font-semibold text-indigo-300 focus:outline-none cursor-pointer"
              >
                <option value="creator" className="bg-slate-950">Content Creator</option>
                <option value="learner" className="bg-slate-950">Learner</option>
                <option value="educator" className="bg-slate-950">Educator</option>
                <option value="admin" className="bg-slate-950">Administrator</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="text-[11px] text-slate-400">Load Node:</span>
              <input
                type="text"
                value={activeVideoId}
                onChange={(e) => setActiveVideoId(e.target.value)}
                className="w-12 bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-xs text-center rounded"
              />
              <button onClick={() => fetchVideoData(activeVideoId)} className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">Load</button>
            </div>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* SEARCH OVERLAY */}
          {searchResults.length > 0 && (
            <div className="mb-6 p-4 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-400">Search Results for "{searchQuery}"</span>
                <button onClick={() => setSearchResults([])} className="text-xs text-slate-400 hover:text-white">Clear</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.map((r, i) => (
                  <div key={i} onClick={() => { setActiveVideoId(String(r.video_id)); fetchVideoData(String(r.video_id)); }} className="p-3 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500">
                    <span className="text-xs font-semibold text-emerald-400">Video #{r.video_id} ({r.filename})</span>
                    <p className="text-xs text-slate-300 mt-1">{r.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

         {/* ========================================================
              1. CONTENT CREATOR VIEWS
          ======================================================== */}
          {currentRole === "creator" && (
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Creator: Upload Media */}
              {currentView === "creator_upload" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100">Upload & Ingest Media</h2>
                    <p className="text-xs text-slate-400 mt-1">Upload lecture or presentation files to run Whisper speech-to-text and BART summarization.</p>
                  </div>
                  <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 p-12 rounded-2xl bg-slate-950/40 text-center relative transition-all">
                    <input type="file" accept="video/*,audio/*" onChange={handleFileUpload} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <UploadCloud size={44} className={`mx-auto mb-3 text-indigo-400 ${isUploading ? "animate-bounce" : ""}`} />
                    <p className="font-semibold text-slate-200">{isUploading ? "Processing video pipeline..." : "Click or drag media here to upload"}</p>
                    <span className="text-xs text-slate-500 block mt-1">Supports MP4, MKV, AVI, MOV, WAV, and MP3</span>
                  </div>
                  {uploadMessage && (
                    <div className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${uploadMessage.type === "success" ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-rose-950/40 border-rose-800 text-rose-300"}`}>
                      {uploadMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{uploadMessage.text}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Creator: History & Manage Uploaded Videos (WITH DELETE BUTTON) */}
              {currentView === "creator_history" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">Upload History & Manage Videos</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Manage uploaded media nodes, re-run pipelines, or purge items.</p>
                    </div>
                    <button onClick={fetchUploadHistory} className="text-xs text-indigo-400 hover:underline flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                        <tr>
                          <th className="p-3.5">Node</th>
                          <th className="p-3.5">File Name</th>
                          <th className="p-3.5">AI Status</th>
                          <th className="p-3.5">Transcript</th>
                          <th className="p-3.5">Summary</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {uploadHistory.length > 0 ? (
                          uploadHistory.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-900/40">
                              <td className="p-3.5 font-mono text-emerald-400 font-bold">#{v.id}</td>
                              <td className="p-3.5 font-medium text-slate-200">{v.filename}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${v.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>
                                  {v.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-400">{v.has_transcript ? "Ready" : "Pending"}</td>
                              <td className="p-3.5 text-slate-400">{v.has_summary ? "Ready" : "Pending"}</td>
                              <td className="p-3.5 text-right space-x-2">
                                <button
                                  onClick={() => { setActiveVideoId(String(v.id)); fetchVideoData(String(v.id)); setCurrentView("creator_output"); }}
                                  className="px-2.5 py-1 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded font-semibold"
                                >
                                  Open
                                </button>
                                <button
                                  onClick={() => handleDeleteVideo(v.id)}
                                  className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-400 rounded transition-colors"
                                  title="Delete video"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">No media uploaded yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Creator: Summaries, Transcripts & KEY MOMENTS */}
              {currentView === "creator_output" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">AI Intelligence Outputs (Node #{activeVideoId})</h2>
                      <p className="text-xs text-slate-400 mt-1">Generated transcripts, neural summaries, and detected highlights.</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadDirectFile("transcript-txt")}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Transcript (.txt)</span>
                      </button>
                      <button
                        onClick={() => downloadDirectFile("summary-txt")}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Summary (.txt)</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary & Transcript Boxes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center space-x-2 text-indigo-400">
                        <Sparkles className="w-4 h-4" />
                        <h3 className="font-semibold text-sm text-slate-200">BART Executive Summary</h3>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-lg border border-slate-800 max-h-80 overflow-y-auto">
                        {videoDetails?.summary || "No summary available for this node. Upload a video or select an existing node ID."}
                      </p>
                    </div>

                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-400">
                        <FileText className="w-4 h-4" />
                        <h3 className="font-semibold text-sm text-slate-200">Whisper ASR Full Transcript</h3>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-lg border border-slate-800 max-h-80 overflow-y-auto font-sans">
                        {videoDetails?.transcript || "No transcript generated yet."}
                      </p>
                    </div>
                  </div>

                  {/* KEY MOMENTS SECTION */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                    <div className="flex items-center space-x-2 text-indigo-400">
                      <Clock className="w-4 h-4" />
                      <h3 className="font-semibold text-sm text-slate-200">Key Moments & Topic Highlights</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(videoDetails?.key_moments && videoDetails.key_moments.length > 0 ? videoDetails.key_moments : [
                        { timestamp: "00:15", title: "Introduction & Context", description: "Foundational framing and overview." },
                        { timestamp: "02:30", title: "Architecture Breakdown", description: "Core pipeline and implementation." },
                        { timestamp: "05:10", title: "Key Takeaways", description: "Final synthesis and conclusion." }
                      ]).map((m: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                            {m.timestamp || `0${idx}:30`}
                          </span>
                          <h4 className="font-semibold text-xs text-slate-200 mt-1">{m.title || `Moment #${idx + 1}`}</h4>
                          <p className="text-[11px] text-slate-400">{m.description || m.text || ""}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Creator: Analytics */}
              {currentView === "creator_analytics" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">Content Analytics (Node #{activeVideoId})</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Automated NLP and compression metrics.</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadDirectFile("all-json")}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Export JSON</span>
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF Report</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-xs text-slate-400">Total Word Count</span>
                      <p className="text-2xl font-bold text-white mt-1">
                        {videoDetails?.analytics_data?.total_words || (videoDetails?.transcript ? videoDetails.transcript.split(" ").length : 240)}
                      </p>
                      <span className="text-[10px] text-emerald-400 mt-1 block">Parsed via Whisper ASR</span>
                    </div>

                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-xs text-slate-400">Compression Efficiency</span>
                      <p className="text-2xl font-bold text-indigo-400 mt-1">
                        {videoDetails?.analytics_data?.compression_ratio || "89.4%"}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">BART neural reduction</span>
                    </div>

                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-xs text-slate-400">Tone / Classification</span>
                      <p className="text-lg font-bold text-emerald-400 mt-1">
                        {videoDetails?.analytics_data?.sentiment || "Informative & Technical"}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">NLP Inference</span>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <h3 className="font-semibold text-xs text-slate-200">Extracted Keywords & Entity Tags</h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(videoDetails?.analytics_data?.keywords || ["FastAPI", "Whisper ASR", "BART", "PostgreSQL", "Next.js", "Docker"]).map((kw: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-medium rounded-md">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
          {/* ========================================================
              2. LEARNER VIEWS
          ======================================================== */}
          {currentRole === "learner" && (
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Lecture Library Bar (Allows selecting any uploaded video) */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-sky-400" />
                    <h3 className="font-semibold text-xs text-slate-200">Available Lectures Library</h3>
                  </div>
                  <span className="text-[11px] text-slate-500">{learnerLibrary.length} Lectures Available</span>
                </div>
                
                <div className="flex space-x-2.5 overflow-x-auto pb-1">
                  {learnerLibrary.length > 0 ? (
                    learnerLibrary.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveVideoId(String(item.id));
                          fetchVideoData(String(item.id));
                        }}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg border text-left transition-all ${
                          activeVideoId === String(item.id)
                            ? "bg-indigo-600/20 border-indigo-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <div className="text-[10px] font-mono text-emerald-400 font-bold">Node #{item.id}</div>
                        <div className="text-xs font-semibold truncate max-w-[150px]">{item.filename}</div>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 py-1">No lectures available. Switch to Content Creator to upload.</div>
                  )}
                </div>
              </div>

              {/* Learner: AI Summaries View */}
              {/* Learner: AI Summaries View */}
              {currentView === "learner_summaries" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">AI Educational Summaries</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Active Lecture: <strong className="text-emerald-400 font-mono">Node #{activeVideoId}</strong> ({videoDetails?.filename || "lecture.mp4"})
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveBookmark("Executive Summary", videoDetails?.summary || "", "00:00")}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800 text-amber-300 rounded-lg text-xs font-semibold"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Bookmark Summary</span>
                    </button>
                  </div>

                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center space-x-2 text-indigo-400">
                      <Sparkles className="w-5 h-5" />
                      <h3 className="font-semibold text-slate-200">Key Conceptual Takeaways</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line bg-slate-900/60 p-5 rounded-lg border border-slate-800">
                      {videoDetails?.summary || "No summary available for this lecture yet."}
                    </p>
                  </div>
                </div>
              )}

              {/* Learner: Full Transcripts View */}
              {currentView === "learner_transcripts" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">Full Lecture Transcript</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Whisper ASR Speech-to-Text for Node #{activeVideoId}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line bg-slate-900/60 p-5 rounded-lg border border-slate-800 font-sans">
                      {videoDetails?.transcript || "No transcript generated yet for this node."}
                    </p>
                  </div>
                </div>
              )}

              {/* Learner: Key Moments & Timestamps */}
              {currentView === "learner_moments" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">Key Moments & Conceptual Shifts</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Jump to key topic transitions and save study points.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(videoDetails?.key_moments && videoDetails.key_moments.length > 0 ? videoDetails.key_moments : [
                      { timestamp: "00:15", title: "Introduction & Context", description: "Foundational framing and overview." },
                      { timestamp: "02:30", title: "Architecture Breakdown", description: "Core pipeline and implementation." },
                      { timestamp: "05:10", title: "Key Takeaways", description: "Final synthesis and conclusion." }
                    ]).map((m: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            {m.timestamp || `0${idx}:30`}
                          </span>
                          <button
                            onClick={() => handleSaveBookmark(m.title || `Moment #${idx + 1}`, m.description || "", m.timestamp || "00:00")}
                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Save Bookmark</span>
                          </button>
                        </div>
                        <h4 className="font-semibold text-slate-200 text-sm">{m.title || `Moment #${idx + 1}`}</h4>
                        <p className="text-xs text-slate-400">{m.description || m.text || ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Learner: Bookmarks & History View */}
              {currentView === "learner_history" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100">Study Space (Bookmarks & History)</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Your saved study notes, bookmarked highlights, and recently accessed lectures.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bookmarks Section */}
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-amber-400 flex items-center space-x-2">
                          <Bookmark className="w-4 h-4" />
                          <span>Saved Highlights & Summaries</span>
                        </h3>
                        <span className="text-[10px] text-slate-500">{learnerBookmarks.length} Saved</span>
                      </div>

                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {learnerBookmarks.length > 0 ? (
                          learnerBookmarks.map((b) => (
                            <div key={b.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                              <div className="flex justify-between text-[10px] text-emerald-400 font-mono">
                                <span>Node #{b.video_id} • {b.timestamp}</span>
                                <span className="text-slate-500">{b.created_at}</span>
                              </div>
                              <h4 className="text-xs font-semibold text-slate-200 mt-1">{b.title}</h4>
                              <p className="text-xs text-slate-400 mt-0.5">{b.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 py-2">No bookmarks saved yet. Click 'Bookmark' in summaries or key moments to save study items.</p>
                        )}
                      </div>
                    </div>

                    {/* Learning History Section */}
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-sky-400 flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Recently Viewed Lectures</span>
                        </h3>
                        <span className="text-[10px] text-slate-500">{learningHistory.length} Recorded</span>
                      </div>

                      <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                        {learningHistory.length > 0 ? (
                          learningHistory.map((h) => (
                            <div key={h.id} className="py-2.5 flex justify-between items-center">
                              <div>
                                <span className="text-xs font-bold text-slate-200">Video #{h.video_id}</span>
                                <p className="text-[11px] text-slate-400">{h.video_filename}</p>
                                <span className="text-[9px] text-slate-500">{h.last_accessed}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setActiveVideoId(String(h.video_id));
                                  fetchVideoData(String(h.video_id));
                                  setCurrentView("learner_summaries");
                                }}
                                className="px-2.5 py-1 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded text-[10px] font-semibold transition-colors"
                              >
                                Resume &rarr;
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 py-2">No viewing history recorded yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
          {/* ========================================================
              3. EDUCATOR VIEWS
          ======================================================== */}
          {currentRole === "educator" && (
            <div className="max-w-5xl mx-auto space-y-6">

              {/* View 1: Upload Lecture Video */}
              {currentView === "educator_upload" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100">Upload Classroom Lecture</h2>
                    <p className="text-xs text-slate-400 mt-1">Upload lecture recordings to automatically run Whisper speech-to-text, generate conceptual summaries, and extract study materials.</p>
                  </div>
                  <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 p-12 rounded-2xl bg-slate-950/40 text-center relative transition-all">
                    <input type="file" accept="video/*,audio/*" onChange={handleFileUpload} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <UploadCloud size={44} className={`mx-auto mb-3 text-emerald-400 ${isUploading ? "animate-bounce" : ""}`} />
                    <p className="font-semibold text-slate-200">{isUploading ? "Processing lecture pipeline..." : "Click or drag lecture video here to upload"}</p>
                    <span className="text-xs text-slate-500 block mt-1">Supports MP4, MKV, MOV, WAV, and MP3</span>
                  </div>
                  {uploadMessage && (
                    <div className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${uploadMessage.type === "success" ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-rose-950/40 border-rose-800 text-rose-300"}`}>
                      {uploadMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{uploadMessage.text}</span>
                    </div>
                  )}
                </div>
              )}

              {/* View 2: Study Guides & Classroom Sharing */}
              {currentView === "educator_materials" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">Study Guides & Classroom Sharing</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Active Lecture: <strong className="text-emerald-400 font-mono">Node #{activeVideoId || "None"}</strong> {videoDetails?.filename ? `(${videoDetails.filename})` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleGenerateStudyGuide()}
                      disabled={isGeneratingGuide}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-950 transition-all"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingGuide ? "animate-spin" : ""}`} />
                      <span>{isGeneratingGuide ? "Generating Study Materials..." : "Regenerate Study Notes & Quiz"}</span>
                    </button>
                  </div>

                  {/* Share Link Banner */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-indigo-950/60 border border-indigo-800 rounded-lg text-indigo-400">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Shareable Student Study Portal</h4>
                        <p className="text-[11px] text-slate-400">Students can access these notes and quiz checkpoints without needing an account.</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                      <input
                        type="text"
                        readOnly
                        value={studyMaterials?.share_url || `http://localhost:3000/share/lecture/${activeVideoId || "demo"}`}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono w-full md:w-72 select-all outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(studyMaterials?.share_url || `http://localhost:3000/share/lecture/${activeVideoId || "demo"}`);
                          alert("Lecture Study Portal link copied to clipboard!");
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex-shrink-0"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>

                  {/* Notes & Quiz Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center space-x-2 text-indigo-400">
                        <BookOpen className="w-4 h-4" />
                        <h3 className="font-semibold text-sm text-slate-200">
                          {studyMaterials?.title || `Lecture Notes: Node #${activeVideoId}`}
                        </h3>
                      </div>
                      <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto">
                        {studyMaterials?.study_notes || videoDetails?.summary || "Click 'Regenerate Study Notes & Quiz' above to generate comprehensive notes from this lecture."}
                      </div>
                    </div>

                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <h3 className="font-semibold text-sm text-slate-200">Classroom Quiz Checkpoints</h3>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {studyMaterials?.quiz_questions?.length || 2} Questions
                        </span>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {(studyMaterials?.quiz_questions || [
                          { id: 1, question: "What is the primary topic introduced in this lecture?", concept_context: "Lecture introduction", answer_hint: "Review summary section 1." },
                          { id: 2, question: "Explain the main technical architecture described.", concept_context: "System pipeline", answer_hint: "Check the transcript timestamps." }
                        ]).map((q: any) => (
                          <div key={q.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5">
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                              Question #{q.id}
                            </span>
                            <h4 className="text-xs font-semibold text-slate-200">{q.question}</h4>
                            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                              <strong className="text-indigo-300">Context:</strong> {q.concept_context}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View 3: Review and Edit Transcripts */}
              {currentView === "educator_review" && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">Review & Edit Lecture Transcript</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Active Node: <strong className="text-emerald-400 font-mono">#{activeVideoId || "None"}</strong> {videoDetails?.filename ? `(${videoDetails.filename})` : ""}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {isEditingTranscript ? (
                        <>
                          <button
                            onClick={() => setIsEditingTranscript(false)}
                            className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEditedTranscript}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-emerald-950"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditedTranscriptText(videoDetails?.transcript || "");
                            setIsEditingTranscript(true);
                          }}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Mode</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    {isEditingTranscript ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs text-amber-400 bg-amber-950/30 border border-amber-800/60 p-2.5 rounded-lg">
                          <span>Editing active — correct terminology, adjust timestamps, or remove filler words before publishing.</span>
                          <span className="font-mono text-[11px]">{editedTranscriptText.length} characters</span>
                        </div>
                        <textarea
                          rows={14}
                          value={editedTranscriptText}
                          onChange={(e) => setEditedTranscriptText(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg p-4 text-xs text-slate-200 leading-relaxed font-mono outline-none resize-y"
                          placeholder="Type or paste lecture transcript..."
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-900/60 p-5 rounded-lg border border-slate-800/80 max-h-[450px] overflow-y-auto">
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                          {videoDetails?.transcript || "No transcript loaded. Enter a valid Node ID in the top-right and click 'Load'."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 4: Classroom Content Analytics & Engagement Metrics */}
              {currentView === "educator_metrics" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">Classroom Content & Engagement Analytics</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Active Node: <strong className="text-emerald-400 font-mono">#{activeVideoId || "None"}</strong> {videoDetails?.filename ? `(${videoDetails.filename})` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => fetchEducatorData(activeVideoId)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Analytics</span>
                    </button>
                  </div>

                  {/* KPIs Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Concept Retention Density</span>
                      <p className="text-xl font-bold text-emerald-400">
                        {educatorMetrics?.kpis?.concept_density || "4.8 / 5.0"}
                      </p>
                      <span className="text-[10px] text-emerald-500 block font-medium">High Retention Index</span>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Avg. Student Retention</span>
                      <p className="text-xl font-bold text-indigo-400">
                        {educatorMetrics?.kpis?.retention_index || "92.4%"}
                      </p>
                      <span className="text-[10px] text-slate-400 block font-mono">Dynamic retention curve</span>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Estimated Reading Time</span>
                      <p className="text-xl font-bold text-slate-100">
                        {educatorMetrics?.kpis?.estimated_reading_time || "2 mins"}
                      </p>
                      <span className="text-[10px] text-slate-400 block">Lecture summary pacing</span>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Detected Topic Shifts</span>
                      <p className="text-xl font-bold text-sky-400">
                        {educatorMetrics?.kpis?.total_shifts || 4} Shifts
                      </p>
                      <span className="text-[10px] text-sky-500 block">Segmented by Whisper ASR</span>
                    </div>
                  </div>

                  {/* Retention Curve & Content Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 text-indigo-400">
                          <BarChart2 className="w-4 h-4" />
                          <h3 className="font-semibold text-sm text-slate-200">Student Engagement by Lecture Segment</h3>
                        </div>
                        <span className="text-[11px] text-slate-400">Retention Drop-off Analysis</span>
                      </div>

                      <div className="space-y-3.5 pt-1">
                        {(educatorMetrics?.engagement_breakdown || [
                          { id: 1, segment: "1. Lecture Overview & Core Foundations", timestamp_range: "00:00 - 02:00", retention_pct: 96, focus_level: "Peak Retention" },
                          { id: 2, segment: "2. Conceptual Deep Dive & Examples", timestamp_range: "02:00 - 05:30", retention_pct: 89, focus_level: "High Engagement" },
                          { id: 3, segment: "3. Synthesis & Practical Review", timestamp_range: "05:30 - End", retention_pct: 92, focus_level: "High Retention" }
                        ]).map((seg: any) => (
                          <div key={seg.id} className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <span className="font-semibold text-slate-200">{seg.segment}</span>
                                <span className="text-[10px] text-slate-400 font-mono ml-2">({seg.timestamp_range})</span>
                              </div>
                              <span className="font-mono font-bold text-emerald-400">{seg.retention_pct}% Retention</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  seg.retention_pct >= 90 ? "bg-emerald-500" : seg.retention_pct >= 85 ? "bg-indigo-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${seg.retention_pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span>Status: <strong className="text-slate-300">{seg.focus_level}</strong></span>
                              <span>{seg.retention_pct >= 90 ? "Minimal Drop-off" : "Checkpoint Recommended"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                      <div className="flex items-center space-x-2 text-emerald-400">
                        <Sparkles className="w-4 h-4" />
                        <h3 className="font-semibold text-sm text-slate-200">Content Analytics</h3>
                      </div>

                      <div className="space-y-3 divide-y divide-slate-800/80 text-xs">
                        <div className="pt-2 flex justify-between">
                          <span className="text-slate-400">Difficulty Rating</span>
                          <span className="font-semibold text-indigo-300">
                            {educatorMetrics?.content_analytics?.difficulty_rating || "Intermediate"}
                          </span>
                        </div>
                        <div className="pt-2.5 flex justify-between">
                          <span className="text-slate-400">Total Word Count</span>
                          <span className="font-mono text-slate-200">
                            {educatorMetrics?.content_analytics?.total_words || 340} words
                          </span>
                        </div>
                        <div className="pt-2.5 flex justify-between">
                          <span className="text-slate-400">Pacing Speed</span>
                          <span className="font-mono text-slate-200">
                            {educatorMetrics?.content_analytics?.lecture_pacing || "140 wpm"}
                          </span>
                        </div>
                        <div className="pt-2.5 flex justify-between">
                          <span className="text-slate-400">Compression Ratio</span>
                          <span className="font-mono text-emerald-400">
                            {educatorMetrics?.content_analytics?.compression_efficiency || "86.5%"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 space-y-2">
                        <span className="text-[11px] font-semibold text-slate-300 block">Top Concept Distribution</span>
                        {(educatorMetrics?.content_analytics?.top_concepts || [
                          { name: "Core Architectures", weight: "50%" },
                          { name: "Applied Concepts", weight: "50%" }
                        ]).map((c: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[11px] bg-slate-900 p-2 rounded border border-slate-800/60">
                            <span className="text-slate-300">{c.name}</span>
                            <span className="font-mono text-indigo-400 font-bold">{c.weight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendation Banner */}
                  <div className="p-4 bg-indigo-950/30 border border-indigo-800/50 rounded-xl flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-200">AI Pedagogy Recommendation</h4>
                      <p className="text-xs text-indigo-300/90 leading-relaxed mt-0.5">
                        {educatorMetrics?.ai_recommendation ||
                          "Students maintained consistent engagement during the lecture. Use the auto-generated checkpoint quiz to test key concept retention."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        {/* ========================================================
              4. ADMINISTRATOR ENTERPRISE CONTROL VIEWS
          ======================================================== */}
          {currentRole === "admin" && (
            <div className="max-w-5xl mx-auto space-y-6">

              {/* View 1: System Analytics, Activity & AI Job Queues */}
              {currentView === "admin_system" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">System Analytics & Platform Activity</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Real-time health telemetry, storage utilization, and neural pipeline job queues.</p>
                    </div>
                    <button onClick={fetchAdminData} className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Telemetry</span>
                    </button>
                  </div>

                  {/* Core Status Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Platform Status</span>
                      <p className="text-lg font-bold text-emerald-400 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                        <span>{adminMetrics?.platform_status || "OPERATIONAL"}</span>
                      </p>
                      <span className="text-[10px] text-slate-500 block">{adminMetrics?.system_health || "99.98% Uptime"}</span>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Registered Accounts</span>
                      <p className="text-2xl font-bold text-slate-100">{adminMetrics?.total_users || 4}</p>
                      <span className="text-[10px] text-indigo-400 block">PostgreSQL Auth Store</span>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Total Media Nodes</span>
                      <p className="text-2xl font-bold text-sky-400">{adminMetrics?.total_media_nodes || 0}</p>
                      <span className="text-[10px] text-slate-500 block">Ingested video files</span>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Storage Utilization</span>
                      <p className="text-2xl font-bold text-amber-400">{adminMetrics?.storage_utilization?.uploaded_media_mb || "0.0 MB"}</p>
                      <span className="text-[10px] text-slate-500 block">Cap: {adminMetrics?.storage_utilization?.allocated_limit || "50.0 GB"}</span>
                    </div>
                  </div>

                  {/* AI Processing Job Queues Monitor */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2 text-indigo-400">
                        <Cpu className="w-4 h-4" />
                        <h3 className="font-semibold text-sm text-slate-200">AI Background Processing Pipeline Jobs</h3>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                        {adminMetrics?.ai_processing_queue?.queue_status || "Idle / Ready"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-center">
                        <span className="text-xs text-slate-400">Active In-Flight Pipelines</span>
                        <span className="font-mono text-sm font-bold text-amber-400">{adminMetrics?.ai_processing_queue?.active_processing || 0}</span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-center">
                        <span className="text-xs text-slate-400">Completed Transformations</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">{adminMetrics?.ai_processing_queue?.completed_jobs || 0}</span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-center">
                        <span className="text-xs text-slate-400">Pipeline Failures</span>
                        <span className="font-mono text-sm font-bold text-rose-400">{adminMetrics?.ai_processing_queue?.failed_jobs || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Manage Users & Role Assignments */}
              {currentView === "admin_users" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">Manage Users & Role Assignments</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Control enterprise RBAC permissions and user status.</p>
                    </div>
                    <button onClick={fetchAdminData} className="text-xs text-indigo-400 hover:underline flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                        <tr>
                          <th className="p-3.5">User ID</th>
                          <th className="p-3.5">Email Address</th>
                          <th className="p-3.5">Current Role</th>
                          <th className="p-3.5">Account Status</th>
                          <th className="p-3.5 text-right">Assign New Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {adminUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-900/40">
                            <td className="p-3.5 font-mono text-emerald-400 font-bold">#{u.id}</td>
                            <td className="p-3.5 font-medium text-slate-200">{u.email}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800 text-indigo-300 rounded font-semibold text-[10px]">
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3.5 text-emerald-400 font-medium">Active</td>
                            <td className="p-3.5 text-right">
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-indigo-500 cursor-pointer"
                              >
                                <option value="Learner">Learner</option>
                                <option value="Content Creator">Content Creator</option>
                                <option value="Educator">Educator</option>
                                <option value="Administrator">Administrator</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* View 3: Content & Storage Utilization */}
              {currentView === "admin_content" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">Manage Uploaded Content & Storage</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Audit uploaded media files and purge unneeded binaries.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                        <tr>
                          <th className="p-3.5">Node</th>
                          <th className="p-3.5">File Name</th>
                          <th className="p-3.5">Disk Size</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Key Moments</th>
                          <th className="p-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {adminContent.length > 0 ? (
                          adminContent.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-900/40">
                              <td className="p-3.5 font-mono text-emerald-400 font-bold">#{c.id}</td>
                              <td className="p-3.5 font-medium text-slate-200">{c.filename}</td>
                              <td className="p-3.5 font-mono text-slate-400">{c.file_size_kb}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${c.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-400">{c.key_moments_count} Highlights</td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => handleAdminDeleteContent(c.id)}
                                  className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-400 rounded text-xs transition-colors"
                                >
                                  Purge Node
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={6} className="p-6 text-center text-slate-500 text-xs">No media files stored.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* View 4: Platform Configuration Settings */}
              {currentView === "admin_settings" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100">Platform Configuration Settings</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Tune pipeline limits, model sizes, and operational parameters.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adminConfigs.map((cfg) => (
                      <div key={cfg.id} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-bold text-indigo-400">{cfg.key}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Config #{cfg.id}</span>
                        </div>
                        <p className="text-xs text-slate-400">{cfg.description}</p>
                        <div className="flex items-center space-x-2 pt-2">
                          <input
                            type="text"
                            defaultValue={cfg.value}
                            id={`cfg-${cfg.key}`}
                            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 font-mono flex-1 outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => {
                              const el = document.getElementById(`cfg-${cfg.key}`) as HTMLInputElement;
                              if (el) handleSavePlatformConfig(cfg.key, el.value);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 5: System Audit Logs & Reports */}
              {currentView === "admin_audit" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">System Audit Logs & Security Reports</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Immutable audit trail of platform events, security mutations, and data actions.</p>
                    </div>
                    <button onClick={fetchAdminData} className="text-xs text-indigo-400 hover:underline flex items-center space-x-1">
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh Stream</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                        <tr>
                          <th className="p-3.5">Timestamp</th>
                          <th className="p-3.5">Level</th>
                          <th className="p-3.5">Event Type</th>
                          <th className="p-3.5">Actor</th>
                          <th className="p-3.5">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {adminAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/40">
                            <td className="p-3.5 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${log.level === "SECURITY" ? "bg-rose-950 text-rose-400 border border-rose-800" : log.level === "WARNING" ? "bg-amber-950 text-amber-400 border border-amber-800" : "bg-emerald-950 text-emerald-400 border border-emerald-800"}`}>
                                {log.level}
                              </span>
                            </td>
                            <td className="p-3.5 font-bold text-indigo-300">{log.event_type}</td>
                            <td className="p-3.5 text-slate-400">{log.user_email}</td>
                            <td className="p-3.5 text-slate-300 font-sans text-xs">{log.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )} 
        </div>
      </main>
    </div>
  );
}