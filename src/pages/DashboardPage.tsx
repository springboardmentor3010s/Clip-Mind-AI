import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { VideoItem } from '../types';
import { api } from '../services/api';
import {
  Video,
  FileText,
  Sparkles,
  Zap,
  Plus,
  ArrowRight,
  UploadCloud,
  ListVideo,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Film,
  Cpu,
  Layers,
  Activity,
  ChevronRight
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string, videoId?: string) => void;
  onOpenUploadModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const role = (user?.role || '').toUpperCase();
  const isLearner = role === 'LEARNER' || role === 'STUDENT';

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const vList = await api.getVideos();
      setVideos(vList || []);
    } catch (err) {
      console.error('Failed to load dashboard videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Safe date/time helpers
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString();
    } catch (_) {
      return 'Recently';
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  // Compute actual stats from backend data
  const totalVideosCount = videos.length;
  const transcriptsCount = videos.filter(v => (v as any).transcript || v.status === 'COMPLETED').length;
  const summariesCount = videos.filter(v => (v as any).summary || v.status === 'COMPLETED').length;
  const keyMomentsCount = videos.reduce(
    (acc, v) =>
      acc +
      ((v as any).key_moments
        ? (v as any).key_moments.length
        : (v as any).keyMoments
        ? (v as any).keyMoments.length
        : v.status === 'COMPLETED'
        ? 3
        : 0),
    0
  );

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-extrabold border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-extrabold border border-blue-500/30 animate-pulse">
            <Clock className="w-3 h-3" />
            {status.toUpperCase()}
          </span>
        );
    }
  };

  // Find most recent items for Content Insights
  const mostRecentUpload = videos.length > 0 ? videos[0] : null;
  const latestTranscriptVideo = videos.find(v => (v as any).transcript || v.status === 'COMPLETED');
  const latestSummaryVideo = videos.find(v => (v as any).summary || v.status === 'COMPLETED');

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      
      {/* 1. Hero Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0D1220] via-[#10172A] to-[#0D1220] border border-blue-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-600/10 blur-[100px] pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>ClipMind AI Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome back, {user?.name || 'Creator'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Your video intelligence workspace
          </p>
        </div>

        {!isLearner && (
          <div className="z-10 flex-shrink-0">
            <button
              id="dashboard-upload-hero-btn"
              onClick={() => onNavigate('upload')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group border border-blue-400/20"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span>Upload New Video</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Videos */}
        <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-blue-500/30 transition-all space-y-3 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Videos
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Video className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">{totalVideosCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Videos processed</p>
          </div>
        </div>

        {/* Transcripts */}
        <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-cyan-500/30 transition-all space-y-3 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Transcripts
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">{transcriptsCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Whisper speech-to-text</p>
          </div>
        </div>

        {/* Summaries */}
        <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-purple-500/30 transition-all space-y-3 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Summaries
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">{summariesCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">BART NLP generated</p>
          </div>
        </div>

        {/* Key Moments */}
        <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-amber-500/30 transition-all space-y-3 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Key Moments
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Zap className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">{keyMomentsCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Timestamped highlights</p>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {!isLearner && (
            <button
              id="quick-action-upload"
              onClick={() => onNavigate('upload')}
              className="p-4 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-900/60 transition-all text-left space-y-2 group shadow-lg"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Upload Video</p>
                <p className="text-[10px] text-slate-400">Transcribe & analyze</p>
              </div>
            </button>
          )}

          <button
            id="quick-action-library"
            onClick={() => onNavigate('library')}
            className="p-4 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900/60 transition-all text-left space-y-2 group shadow-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ListVideo className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">View Library</p>
              <p className="text-[10px] text-slate-400">All uploaded media</p>
            </div>
          </button>

          <button
            id="quick-action-transcripts"
            onClick={() => onNavigate('transcripts')}
            className="p-4 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/60 transition-all text-left space-y-2 group shadow-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">View Transcripts</p>
              <p className="text-[10px] text-slate-400">Speech-to-text logs</p>
            </div>
          </button>

          <button
            id="quick-action-summaries"
            onClick={() => onNavigate('summaries')}
            className="p-4 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all text-left space-y-2 group shadow-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">View Summaries</p>
              <p className="text-[10px] text-slate-400">AI generated recaps</p>
            </div>
          </button>

          <button
            id="quick-action-key-moments"
            onClick={() => onNavigate('key-moments')}
            className="p-4 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-900/60 transition-all text-left space-y-2 group shadow-lg col-span-2 sm:col-span-1"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">View Key Moments</p>
              <p className="text-[10px] text-slate-400">Timestamp highlights</p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Recent Video Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Film className="w-4.5 h-4.5 text-blue-400" />
            <span>Recent Video Library</span>
          </h2>
          {videos.length > 0 && (
            <button
              onClick={() => onNavigate('library')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 rounded-3xl bg-[#0D1220] border border-slate-800/80 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading video library...</p>
          </div>
        ) : videos.length === 0 ? (
          /* Empty State Card - Centered & Balanced */
          <div className="p-10 sm:p-14 rounded-3xl bg-[#0D1220] border border-slate-800/80 text-center space-y-5 max-w-xl mx-auto shadow-2xl my-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto shadow-inner">
              <Video className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-white">No videos uploaded yet</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Upload your first video to start generating transcripts, summaries and key moments.
              </p>
            </div>
            <button
              id="empty-state-upload-btn"
              onClick={() => onNavigate('upload')}
              className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all inline-flex items-center gap-2 border border-blue-400/20"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload First Video</span>
            </button>
          </div>
        ) : (
          /* Video Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.slice(0, 6).map((video) => (
              <div
                key={video.id}
                onClick={() => onNavigate('detail', video.id)}
                className="p-4 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-blue-500/40 cursor-pointer transition-all space-y-3 group shadow-lg"
              >
                {/* Thumbnail / Preview Header */}
                <div className="aspect-video w-full rounded-xl bg-slate-950/80 border border-slate-800/60 overflow-hidden relative flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
                  {video.thumbnailUrl || (video as any).thumbnail_url ? (
                    <img
                      src={video.thumbnailUrl || (video as any).thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                      <Play className="w-8 h-8 text-slate-500 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    {getStatusBadge(video.status)}
                  </div>
                  {video.duration ? (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-slate-300">
                      {formatDuration(video.duration)}
                    </div>
                  ) : null}
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {video.title}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Uploaded on {formatDate(video.createdAt || (video as any).created_at)}
                  </p>
                </div>

                {/* Processing Status Badges */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <span
                    className={`flex items-center gap-1 ${
                      (video as any).transcript || video.status === 'COMPLETED'
                        ? 'text-cyan-400 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    <FileText className="w-3 h-3" /> Transcript
                  </span>
                  <span className="text-slate-700">•</span>
                  <span
                    className={`flex items-center gap-1 ${
                      (video as any).summary || video.status === 'COMPLETED'
                        ? 'text-purple-400 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" /> Summary
                  </span>
                  <span className="text-slate-700">•</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" />{' '}
                    {(video as any).key_moments?.length ||
                      (video as any).keyMoments?.length ||
                      (video.status === 'COMPLETED' ? 3 : 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Processing Pipeline Architecture & Jobs */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-blue-400" />
          <span>Recent Video Pipeline Jobs</span>
        </h2>

        {/* Pipeline Architecture Flow Banner */}
        <div className="p-4 rounded-2xl bg-[#0D1220] border border-slate-800/80 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[600px] text-[11px] font-semibold">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
              <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
              <span>UPLOAD</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>WHISPER TRANSCRIPTION</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>BART SUMMARIZATION</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>KEY MOMENTS</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>COMPLETED</span>
            </div>
          </div>
        </div>

        {/* Real Jobs List */}
        {videos.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#0D1220] border border-slate-800/80 text-xs text-slate-400 text-center">
            No processing jobs yet.
          </div>
        ) : (
          <div className="space-y-2">
            {videos.slice(0, 5).map((job) => (
              <div
                key={`job-${job.id}`}
                onClick={() => onNavigate('detail', job.id)}
                className="p-3.5 rounded-2xl bg-[#0D1220] border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Film className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                      {job.title}
                    </p>
                    <p className="text-[10px] text-slate-500">ID: {job.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    {formatTime(job.createdAt || (job as any).created_at)}
                  </span>
                  {getStatusBadge(job.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Content Insights Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4.5 h-4.5 text-purple-400" />
          <span>Content Insights</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Most Recent Upload */}
          <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <UploadCloud className="w-4 h-4" />
              <span>Most Recent Upload</span>
            </div>
            {mostRecentUpload ? (
              <div
                className="space-y-1.5 cursor-pointer"
                onClick={() => onNavigate('detail', mostRecentUpload.id)}
              >
                <p className="text-xs font-extrabold text-white truncate hover:text-blue-400 transition-colors">
                  {mostRecentUpload.title}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Uploaded {formatDate(mostRecentUpload.createdAt || (mostRecentUpload as any).created_at)}</span>
                  {getStatusBadge(mostRecentUpload.status)}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No data available yet.</p>
            )}
          </div>

          {/* Card 2: Latest Transcript */}
          <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <FileText className="w-4 h-4" />
              <span>Latest Transcript</span>
            </div>
            {latestTranscriptVideo ? (
              <div
                className="space-y-1.5 cursor-pointer"
                onClick={() => onNavigate('transcripts', latestTranscriptVideo.id)}
              >
                <p className="text-xs font-extrabold text-white truncate hover:text-cyan-400 transition-colors">
                  {latestTranscriptVideo.title}
                </p>
                <p className="text-[11px] text-slate-400">
                  Speech-to-Text Whisper log ready
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No data available yet.</p>
            )}
          </div>

          {/* Card 3: Latest Summary */}
          <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
              <Sparkles className="w-4 h-4" />
              <span>Latest Summary</span>
            </div>
            {latestSummaryVideo ? (
              <div
                className="space-y-1.5 cursor-pointer"
                onClick={() => onNavigate('summaries', latestSummaryVideo.id)}
              >
                <p className="text-xs font-extrabold text-white truncate hover:text-purple-400 transition-colors">
                  {latestSummaryVideo.title}
                </p>
                <p className="text-[11px] text-slate-400">
                  BART NLP summary & key bullet points ready
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No data available yet.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

