"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const eventColors = {
  upload: "bg-navy",
  transcript_generated: "bg-blue",
  summary_generated: "bg-teal",
  view: "bg-amber",
  delete: "bg-red-500",
};

const eventLabels = {
  upload: "Uploads",
  transcript_generated: "Transcripts",
  summary_generated: "Summaries",
  view: "Views",
  delete: "Deletes",
};

export default function Analytics() {
  const { isDark } = useTheme();
  const [overview, setOverview] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingTxt, setDownloadingTxt] = useState(false);

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const trackBg = isDark ? "bg-white/10" : "bg-gray-100";

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("clipmind_token");
      try {
        const [ovRes, repRes] = await Promise.all([
          fetch("http://localhost:8000/api/v1/analytics/overview", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/api/v1/analytics/usage-report", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (ovRes.ok) setOverview(await ovRes.json());
        if (repRes.ok) setReport(await repRes.json());
      } catch (err) {
        // ignore
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  async function downloadReport(format) {
    const setFlag = format === "pdf" ? setDownloadingPdf : setDownloadingTxt;
    setFlag(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/analytics/report/download-${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `clipmind_analytics_report.${format === "pdf" ? "pdf" : "txt"}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      // ignore
    }
    setFlag(false);
  }

  if (loading) {
    return (
      <div>
        <h2 className={`text-xl font-bold ${textPrimary}`}>Content Insights &amp; Usage Reports</h2>
        <p className={`${textSecondary} mt-4`}>Loading real usage data...</p>
      </div>
    );
  }

  const maxDuration = overview?.watch_time_data?.length
    ? Math.max(...overview.watch_time_data.map((v) => v.duration_seconds), 1)
    : 1;

  const eventEntries = overview ? Object.entries(overview.event_counts) : [];
  const barColors = ["bg-navy", "bg-blue", "bg-teal", "bg-amber", "bg-purple"];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Content Insights &amp; Usage Reports</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadReport("pdf")}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 text-xs font-semibold bg-blue text-white px-3.5 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50"
          >
            {downloadingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Download PDF Report
          </button>
          <button
            onClick={() => downloadReport("txt")}
            disabled={downloadingTxt}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border transition disabled:opacity-50 ${
              isDark ? "border-white/10 text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {downloadingTxt ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
            Download .txt
          </button>
        </div>
      </div>
      <p className={`${textSecondary} mt-1 mb-6`}>Real usage insights and content analytics across all your uploaded videos.</p>

      {/* Usage report cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Videos", value: report.total_videos },
            { label: "Total Watch Duration", value: formatDuration(report.total_duration_seconds) },
            { label: "Storage Used", value: `${report.total_size_mb} MB` },
            { label: "Transcripts Generated", value: report.transcripts_generated },
            { label: "Summaries Generated", value: report.summaries_generated },
            { label: "Key Moments Generated", value: report.keymoments_generated },
          ].map((c) => (
            <div key={c.label} className={`${cardBg} border rounded-xl p-4 shadow-sm`}>
              <div className={`text-xl font-bold ${textPrimary}`}>{c.value}</div>
              <div className={`text-xs ${textSecondary} mt-1`}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Duration chart */}
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
          <h4 className={`font-semibold ${textPrimary} mb-4`}>Video Duration by Title (seconds)</h4>
          {overview?.watch_time_data?.length > 0 ? (
            <div className="flex items-stretch gap-3 h-40">
              {overview.watch_time_data.map((v, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`${barColors[i % barColors.length]} w-full rounded-t-md`}
                      style={{ height: `${Math.max((v.duration_seconds / maxDuration) * 100, 4)}%` }}
                      title={`${v.duration_seconds}s`}
                    />
                  </div>
                  <span className={`text-[9px] ${textSecondary} truncate w-full text-center`}>{v.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${textSecondary}`}>Upload videos to see this chart.</p>
          )}
        </div>

        {/* Engagement legend */}
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
          <h4 className={`font-semibold ${textPrimary} mb-4`}>Engagement by Event Type</h4>
          {eventEntries.length > 0 ? (
            <div className="flex flex-col gap-3">
              {eventEntries.map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <div className={`${eventColors[type] || "bg-gray-400"} w-3.5 h-3.5 rounded-sm shrink-0`} />
                  <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"} flex-1`}>
                    {eventLabels[type] || type}
                  </span>
                  <span className={`text-xs font-semibold ${textSecondary}`}>{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${textSecondary}`}>No activity yet.</p>
          )}
        </div>
      </div>

      {/* Top content insights */}
      <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
        <h4 className={`font-semibold ${textPrimary} mb-4`}>Top Content Insights</h4>
        {overview?.top_keywords?.length > 0 ? (
          <div className="flex flex-col gap-4">
            {overview.top_keywords.map((k) => (
              <div key={k.word} className="flex items-center gap-4">
                <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"} w-32`}>{k.word}</span>
                <div className={`flex-1 ${trackBg} rounded-full h-2.5`}>
                  <div className="bg-teal h-2.5 rounded-full" style={{ width: `${k.weight * 100}%` }} />
                </div>
                <span className={`text-xs ${textSecondary} w-24`}>{k.count} mentions</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${textSecondary}`}>Generate transcripts to see top topics across your content.</p>
        )}
      </div>
    </div>
  );
}