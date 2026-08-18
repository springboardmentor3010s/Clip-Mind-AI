import React, { useState, useEffect } from 'react';
import { SystemAnalytics } from '../types';
import { api } from '../services/api';
import { BarChart3, Video, FileText, Sparkles, Zap, Activity } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then((data) => setAnalytics(data))
      .catch((err) => console.error('Error fetching analytics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-semibold text-xs">
        Loading real database analytics...
      </div>
    );
  }

  const totalVideos = analytics?.totalVideos || 0;
  const totalTranscripts = analytics?.totalTranscriptsGenerated || 0;
  const totalSummaries = analytics?.totalSummariesGenerated || 0;
  const totalKeyMoments = analytics?.totalKeyMomentsDetected || 0;

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-black text-white">Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
        Your personal content, processing and activity analytics.
        </p>
      </div>

      {/* Real Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#0D1220] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Videos</span>
            <Video className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white">{totalVideos}</p>
          <p className="text-[10px] text-slate-500">In PostgreSQL Database</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0D1220] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Transcripts</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{totalTranscripts}</p>
          <p className="text-[10px] text-slate-500">Whisper Speech Processed</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0D1220] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Summaries</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">{totalSummaries}</p>
          <p className="text-[10px] text-slate-500">BART NLP Summarized</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#0D1220] border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Key Moments</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">{totalKeyMoments}</p>
          <p className="text-[10px] text-slate-500">Timestamped Highlights</p>
        </div>
      </div>

      {/* Database Processing Pipeline Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Video Processing & Transcript Chart */}
        <div className="p-6 rounded-3xl bg-[#0D1220] border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-400" />
            <span>Video Processing & Transcript Generation</span>
          </h3>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Video Ingestion Completion Rate</span>
                <span className="text-blue-400">{totalVideos > 0 ? '100%' : '0%'}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: totalVideos > 0 ? '100%' : '0%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Whisper Transcript Coverage</span>
                <span className="text-emerald-400">{totalVideos > 0 ? `${Math.round((totalTranscripts / Math.max(1, totalVideos)) * 100)}%` : '0%'}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: totalVideos > 0 ? `${Math.min(100, (totalTranscripts / Math.max(1, totalVideos)) * 100)}%` : '0%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Generation & Key Moments Chart */}
        <div className="p-6 rounded-3xl bg-[#0D1220] border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Summary Generation & Key Moments</span>
          </h3>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">BART Summarization Efficiency</span>
                <span className="text-purple-400">{totalVideos > 0 ? `${Math.round((totalSummaries / Math.max(1, totalVideos)) * 100)}%` : '0%'}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: totalVideos > 0 ? `${Math.min(100, (totalSummaries / Math.max(1, totalVideos)) * 100)}%` : '0%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Key Moment Extraction Density</span>
                <span className="text-cyan-400">{totalVideos > 0 ? `${Math.round((totalKeyMoments / Math.max(1, totalVideos)) * 100)}%` : '0%'}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: totalVideos > 0 ? `${Math.min(100, (totalKeyMoments / Math.max(1, totalVideos)) * 100)}%` : '0%' }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Activity Logs */}
      {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
        <div className="p-6 rounded-3xl bg-[#0D1220] border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>My Recent Activity</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3 rounded-r-xl">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analytics.recentActivity.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-950/40">
                    <td className="p-3 font-semibold text-white">{log.userName}</td>
                    <td className="p-3 text-blue-400 font-mono text-[11px]">{log.userRole}</td>
                    <td className="p-3 font-bold text-slate-200">{log.action}</td>
                    <td className="p-3 text-slate-400">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
