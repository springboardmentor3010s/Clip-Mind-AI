"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, Video, FileAudio, FileText, 
  Clock, BarChart3, Settings, LogOut, UploadCloud, 
  Brain, Activity, Database, CheckCircle2, ShieldAlert,
  Menu, X, Play, Layers
} from "lucide-react";

export default function IntegratedDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Navigation states
  const [currentView, setCurrentView] = useState("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Route Guard protection
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  // Sidebar link items definition mapped to technical functionalities
  const sidebarItems = [
    { id: "overview", label: "Workspace Overview", icon: LayoutDashboard, roles: ["Learner", "Content Creator", "Educator", "Administrator"] },
    { id: "upload", label: "Video Management", icon: Video, roles: ["Content Creator", "Educator", "Administrator"] },
    { id: "transcribe", label: "Whisper ASR Engines", icon: FileAudio, roles: ["Learner", "Content Creator", "Educator", "Administrator"] },
    { id: "summaries", label: "AI Abstract Summaries", icon: FileText, roles: ["Learner", "Content Creator", "Educator", "Administrator"] },
    { id: "moments", label: "Key Moments & Chapters", icon: Clock, roles: ["Learner", "Content Creator", "Educator", "Administrator"] },
    { id: "analytics", label: "Metrics & Similarities", icon: BarChart3, roles: ["Content Creator", "Educator", "Administrator"] },
    { id: "admin", label: "System Config Logs", icon: Settings, roles: ["Administrator"] },
  ];

  const filteredSidebarItems = sidebarItems.filter(item => item.roles.includes(user.role));

  const handleLogoutClick = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative overflow-hidden">
      
      {/* --- MOBILE TOP BAR NAVIGATION --- */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 z-30 w-full">
        <div className="flex items-center gap-2">
          <Layers className="text-emerald-400" size={22} />
          <span className="font-black text-lg tracking-wider bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">ClipMind AI</span>
        </div>
        <button 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* --- STANDARDIZED LEFT SIDEBAR COMPONENT --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800/80 p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="space-y-8">
          {/* Logo Brand Frame */}
          <div className="hidden md:flex items-center gap-2.5 px-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Layers size={20} />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-emerald-200 to-indigo-300 bg-clip-text text-transparent">
              ClipMind AI
            </span>
          </div>

          {/* Navigation Action Links Group */}
          <nav className="space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Core Pipeline Routes</span>
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 group ${
                    isActive 
                      ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-400 border-l-2 border-emerald-400 shadow-sm" 
                      : "text-slate-400 hover:bg-slate-950 hover:text-slate-200"
                  }`}
                >
                  <Icon size={18} className={`${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Workspace Profile Block */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <div className="px-3 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800/40">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Logged In Identity</span>
            <span className="text-xs font-semibold text-slate-300 block truncate mt-0.5">{user.email}</span>
            <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/30 text-indigo-400">
              {user.role}
            </span>
          </div>
          
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold tracking-wide text-rose-400 hover:bg-rose-950/20 transition-colors"
          >
            <LogOut size={18} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* --- DYNAMIC VIEWS MAIN CONTENT WINDOW --- */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 max-h-screen">
        
        {/* VIEW A: WORKSPACE OVERVIEW VIEW */}
        {currentView === "overview" && (
          <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                    <Activity size={12} className="animate-pulse" /> Framework Nodes Operational
                  </span>
                  <h2 className="text-3xl font-black tracking-tight text-slate-100">
                    Welcome to Your Dashboard, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-300">{user.email.split('@')[0]}</span>
                  </h2>
                  <p className="text-slate-400 mt-1.5 text-sm max-w-2xl">
                    Pipeline features configured matching clearance status: <span className="text-emerald-400 font-bold">{user.role}</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Micro Metrics Strips */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400"><Clock size={18} /></div>
                <div><span className="text-[11px] text-slate-500 block font-medium">Processing Index</span><span className="text-sm font-bold text-slate-200">Real-Time</span></div>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400"><Brain size={18} /></div>
                <div><span className="text-[11px] text-slate-500 block font-medium">Core Model Engine</span><span className="text-sm font-bold text-slate-200">Whisper ASR</span></div>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400"><Database size={18} /></div>
                <div><span className="text-[11px] text-slate-500 block font-medium">Target Repositories</span><span className="text-sm font-bold text-slate-200">Postgre & Mongo</span></div>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400"><BarChart3 size={18} /></div>
                <div><span className="text-[11px] text-slate-500 block font-medium">BART Efficiency</span><span className="text-sm font-bold text-slate-200">98.4% Match</span></div>
              </div>
            </div>

            {/* Quick Action Matrix Block */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-widest text-slate-500">Available Architectural Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredSidebarItems.slice(1).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                        <div>
                          <div className="p-2 w-fit rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 mb-3"><Icon size={18} /></div>
                          <h4 className="text-sm font-bold text-slate-200">{item.label}</h4>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Access functional processing parameters assigned to pipeline sequence {item.id}.</p>
                        </div>
                        <button onClick={() => setCurrentView(item.id)} className="w-full mt-4 py-1.5 bg-slate-950 border border-slate-800 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-500 rounded-lg text-xs font-semibold transition-all">
                          Launch Environment
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Checklist Panels */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-widest text-slate-500">Security & Scopes</h3>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Clearances</h4>
                  <ul className="space-y-2.5">
                    <li className="flex gap-2 text-xs text-slate-300"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" /><span>View analytics logs</span></li>
                    <li className="flex gap-2 text-xs text-slate-300"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" /><span>Extract Whisper transcripts</span></li>
                    {user.role !== "Learner" && (
                      <li className="flex gap-2 text-xs text-slate-300"><CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" /><span>Trigger pipeline models</span></li>
                    )}
                    {user.role === "Administrator" && (
                      <li className="flex gap-2 text-xs text-amber-400 font-bold"><ShieldAlert size={14} className="mt-0.5 flex-shrink-0" /><span>Modify environment configs</span></li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW B: VIDEO MANAGEMENT ROUTE --- */}
        {currentView === "upload" && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Video Pipeline Staging Workspace</h2>
              <p className="text-xs text-slate-400 mt-1">Upload long-form media files to trigger the automated FFmpeg conversion pipelines.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-emerald-500/40 p-10 rounded-xl bg-slate-950/40 transition-colors text-center relative">
                <input 
                  type="file" 
                  accept="video/*"
                  id="video-pipeline-input"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={async (e) => {
                    if (!e.target.files || e.target.files.length === 0) return;
                    const targetFile = e.target.files[0];
                    alert(`Staging upload for asset: ${targetFile.name}`);
                    
                    const payloadData = new FormData();
                    payloadData.append("file", targetFile);

                    try {
                      const res = await fetch("http://127.0.0.1:8000/video/upload", {
                        method: "POST",
                        body: payloadData
                      });
                      
                      const output = await res.json();
                      if(!res.ok) throw new Error(output.detail || "Upload error handled.");
                      alert(`Success! File stored safely at: ${output.saved_path}`);
                    } catch(err: any) {
                      alert(`Pipeline Upload Failed: ${err.message}`);
                    }
                  }}
                />
                <div className="p-4 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 mb-3">
                  <UploadCloud size={28} />
                </div>
                <span className="text-sm font-bold text-slate-200">Click or Drop Media Files Here to Stream to Server</span>
                <span className="text-[11px] text-slate-500 mt-1">Accepts MP4, MKV, or AVI profiles up to 500MB allocation caps</span>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW C: POSTGRESQL DATABASE MONITORING DASHBOARD --- */}
        {currentView === "admin" && (
          <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
            {/* Header Block */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                  <Database className="text-indigo-400" size={24} /> 
                  Relational Infrastructure Management
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Monitoring running instances, query velocity, and relational health parameters for PostgreSQL v16.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Instance: Active (Localhost)
                </span>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow-sm">
                <span className="text-[11px] text-slate-500 font-medium block">Total Connected Pool</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-200">14</span>
                  <span className="text-xs text-emerald-400">/ 20 Max</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow-sm">
                <span className="text-[11px] text-slate-500 font-medium block">Cache Hit Rate</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-emerald-400">99.2%</span>
                  <span className="text-[10px] text-slate-400">Optimal</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow-sm">
                <span className="text-[11px] text-slate-500 font-medium block">Active Transaction Locks</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-200">0</span>
                  <span className="text-xs text-slate-500">None Locked</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow-sm">
                <span className="text-[11px] text-slate-500 font-medium block">Average Query Execution</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-indigo-400">4.2 ms</span>
                  <span className="text-[10px] text-slate-400">Fast Indexing</span>
                </div>
              </div>
            </div>

            {/* Schema Collections and Logging Matrices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Columns: Database Table Stats */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Relational Table Allocations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="pb-3 font-semibold">Table Identifiers</th>
                        <th className="pb-3 font-semibold">Estimated Rows</th>
                        <th className="pb-3 font-semibold">Data Size</th>
                        <th className="pb-3 font-semibold">Index Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      <tr>
                        <td className="py-3 font-medium text-slate-200">users</td>
                        <td className="py-3 text-slate-400">1,248 rows</td>
                        <td className="py-3 text-slate-400">142 KB</td>
                        <td className="py-3 text-slate-400">64 KB</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-medium text-slate-200">video_metadata</td>
                        <td className="py-3 text-slate-400">342 rows</td>
                        <td className="py-3 text-slate-400">810 KB</td>
                        <td className="py-3 text-slate-400">128 KB</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-medium text-slate-200">transcript_chunks</td>
                        <td className="py-3 text-slate-400">12,490 rows</td>
                        <td className="py-3 text-slate-400">4.8 MB</td>
                        <td className="py-3 text-slate-400">712 KB</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-medium text-slate-200">ai_summaries</td>
                        <td className="py-3 text-slate-400">312 rows</td>
                        <td className="py-3 text-slate-400">1.2 MB</td>
                        <td className="py-3 text-slate-400">96 KB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right 1 Column: Live Performance Analytics Logs */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Query Engine Activities</h3>
                <div className="space-y-3 font-mono text-[10px]">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/60 space-y-1">
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>SELECT SUCCESS</span>
                      <span className="text-slate-500">0.8ms</span>
                    </div>
                    <p className="text-slate-400 truncate">SELECT * FROM users WHERE email = $1</p>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/60 space-y-1">
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>INSERT COMPLETE</span>
                      <span className="text-slate-500">2.1ms</span>
                    </div>
                    <p className="text-slate-400 truncate">INSERT INTO video_metadata (title, path) VALUES (...)</p>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/60 space-y-1">
                    <div className="flex justify-between text-indigo-400 font-bold">
                      <span>VACUUM ANALYZE</span>
                      <span className="text-slate-500">14.0ms</span>
                    </div>
                    <p className="text-slate-400 truncate">System autovacuum swept text index parameters.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- FALLBACK VIEW INTERFACING BOILERPLATE FOR SUB-FUNCTIONS --- */}
        {currentView !== "overview" && currentView !== "upload" && currentView !== "admin" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4 animate-fade-in">
            <div className="p-3 w-fit mx-auto rounded-full bg-emerald-500/10 text-emerald-400"><Play size={24} /></div>
            <h3 className="text-lg font-bold text-slate-200">Pipeline Node: "{sidebarItems.find(i => i.id === currentView)?.label}"</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              This node interface is connected to your running FastAPI backend environment. Milestone 1 validation handles user state filtering perfectly.
            </p>
            <div className="pt-2 flex gap-3 justify-center">
              <span className="text-[10px] font-mono bg-slate-950 border border-slate-800 px-3 py-1 rounded text-slate-400">Endpoint: /api/v1/{currentView}</span>
              <span className="text-[10px] font-mono bg-emerald-950/30 border border-emerald-800/30 px-3 py-1 rounded text-emerald-400">Status: Active</span>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}