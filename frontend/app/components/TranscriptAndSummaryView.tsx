"use client";

import React, { useState, useEffect } from "react";

// 1. Type Definitions
export interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export type SummaryData =
  | string
  | {
      short_summary?: string;
      detailed_summary?: string;
      [key: string]: any;
    };

interface ComponentProps {
  videoId: string;
  initialSummary?: SummaryData;
  initialSegments?: Segment[];
}

export default function TranscriptAndSummaryView({
  videoId,
  initialSummary,
  initialSegments,
}: ComponentProps) {
  // 2. Tab & Toggle State
  const [activeTab, setActiveTab] = useState<"summary" | "transcript">("summary");
  const [summaryType, setSummaryType] = useState<"short" | "detailed">("short");

  // 3. Data & Loading States
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<SummaryData>(
    initialSummary || ""
  );

  const [segments, setSegments] = useState<Segment[]>(initialSegments || []);

  // 4. Fetch Transcript & Summary Data on `videoId` update
  useEffect(() => {
    async function fetchTranscriptAndSummary() {
      if (!videoId) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`http://127.0.0.1:8000/transcript/${videoId}`);

        if (res.status === 404) {
          setError(`No transcription found for Video ID #${videoId}. Please trigger the AI processing pipeline first.`);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to load data for video ID: ${videoId}`);
        }

        const data = await res.json();
        console.log("Fetched API Data:", data);

        // 🟢 FIX 1: Populate summary state from backend API key
        if (data.summary !== undefined && data.summary !== null) {
          setSummary(data.summary);
        }

        // 🟢 FIX 2: Populate segments state safely
        if (Array.isArray(data.segments) && data.segments.length > 0) {
          setSegments(data.segments);
        } else if (data.transcript) {
          // Fallback: If backend returns a raw text transcript string instead of an array of segments
          setSegments([
            { id: 1, start: 0, end: 0, text: data.transcript }
          ]);
        }
      } catch (err: any) {
        console.error("Fetch error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTranscriptAndSummary();
  }, [videoId]);

  // 5. Handlers
  const handleSegmentChange = (index: number, newText: string) => {
    const updated = [...segments];
    updated[index] = { ...updated[index], text: newText };
    setSegments(updated);
  };

  // Helper to extract display string cleanly regardless of backend summary format
  const renderSummaryContent = () => {
    if (!summary) return "No summary available.";
    if (typeof summary === "string") return summary;
    if (typeof summary === "object") {
      return summaryType === "short"
        ? summary.short_summary || summary.detailed_summary || JSON.stringify(summary)
        : summary.detailed_summary || summary.short_summary || JSON.stringify(summary);
    }
    return String(summary);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 rounded-xl shadow-md border border-slate-800 text-slate-100">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          type="button"
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "summary"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("summary")}
        >
          AI Summaries
        </button>
        <button
          type="button"
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "transcript"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("transcript")}
        >
          Interactive Transcript
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="py-12 text-center text-emerald-400 text-sm font-semibold animate-pulse">
          Processing & fetching dynamic output for Video Node #{videoId}...
        </div>
      )}

      {/* Error Message Display */}
      {error && !loading && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 text-xs my-4">
          ⚠️ {error}
        </div>
      )}

      {/* Content Area */}
      {!loading && !error && (
        <>
          {/* Summary View */}
          {activeTab === "summary" && (
            <div>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setSummaryType("short")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    summaryType === "short"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Short Summary
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryType("detailed")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    summaryType === "detailed"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Detailed Summary
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                {renderSummaryContent()}
              </div>
            </div>
          )}

          {/* Interactive Transcript View */}
          {activeTab === "transcript" && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {segments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No transcript segments found for this video.
                </div>
              ) : (
                segments.map((seg, idx) => (
                  <div key={seg.id || idx} className="flex gap-4 items-center p-2 hover:bg-slate-800/50 rounded-md">
                    <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-1 rounded whitespace-nowrap">
                      {seg.start}s - {seg.end}s
                    </span>
                    <input
                      type="text"
                      value={seg.text}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleSegmentChange(idx, e.target.value)
                      }
                      className="flex-1 text-sm text-slate-200 border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none bg-transparent py-1"
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}