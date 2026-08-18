"use client";

import React, { useEffect, useState } from "react";

interface KeyMoment {
  id: number;
  start: number;
  end: number;
  title: string;
  summary: string;
  importance_score: number;
}

export default function KeyMomentsView({ videoId }: { videoId: string }) {
  const [moments, setMoments] = useState<KeyMoment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchMoments() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/analytics/key-moments/${videoId}`);
        if (res.ok) {
          const data = await res.json();
          setMoments(data.key_moments || []);
        }
      } catch (err) {
        console.error("Error fetching key moments:", err);
      } finally {
        setLoading(false);
      }
    }
    if (videoId) fetchMoments();
  }, [videoId]);

  if (loading) {
    return <div className="p-4 text-xs text-emerald-400 animate-pulse">Extracting key moments & scene segmentation...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">AI Detected Key Moments</h3>
      {moments.length === 0 ? (
        <p className="text-xs text-slate-500">No key moments generated for this video yet.</p>
      ) : (
        <div className="grid gap-3">
          {moments.map((moment) => (
            <div 
              key={moment.id} 
              className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-emerald-500/50 transition-colors flex flex-col gap-1"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded">
                  ⏱️ {moment.start}s - {moment.end}s
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  Score: {Math.round(moment.importance_score * 100)}%
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-100 mt-1">{moment.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{moment.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}