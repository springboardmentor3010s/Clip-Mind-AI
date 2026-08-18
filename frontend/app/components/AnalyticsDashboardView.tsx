"use client";

import React, { useEffect, useState } from "react";

export default function AnalyticsDashboardView({ videoId }: { videoId: string }) {
  const [insights, setInsights] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (videoId) {
          const res = await fetch(`http://127.0.0.1:8000/api/v1/analytics/insights/${videoId}`);
          if (res.ok) setInsights(await res.json());
        }
        const gRes = await fetch(`http://127.0.0.1:8000/api/v1/analytics/dashboard-summary`);
        if (gRes.ok) setGlobalStats(await gRes.json());
      } catch (e) {
        console.error("Analytics fetch error:", e);
      }
    }
    fetchData();
  }, [videoId]);

  return (
    <div className="space-y-6">
      {/* Global System Metrics */}
      {globalStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Processed Videos</span>
            <div className="text-xl font-bold text-emerald-400">{globalStats.total_videos_processed}</div>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Hours Saved</span>
            <div className="text-xl font-bold text-emerald-400">{globalStats.time_saved_hours}h</div>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Active Processing</span>
            <div className="text-xl font-bold text-amber-400">{globalStats.active_jobs}</div>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold">System Status</span>
            <div className="text-sm font-bold text-emerald-400">{globalStats.system_health}</div>
          </div>
        </div>
      )}

      {/* Video Content Insights */}
      {insights && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Content Insights & Keyword Cloud</h3>
          
          <div className="flex flex-wrap gap-2">
            {insights.keywords?.map((kw: string, i: number) => (
              <span key={i} className="px-2.5 py-1 text-xs font-medium bg-slate-800 text-emerald-300 rounded-md border border-slate-700">
                #{kw}
              </span>
            ))}
          </div>

          {insights.metrics && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block">Compression Ratio:</span>
                <span className="font-semibold text-emerald-400">{insights.metrics.compression_ratio}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Est. Reading Time:</span>
                <span className="font-semibold text-slate-200">{insights.metrics.estimated_read_time_mins} mins</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}