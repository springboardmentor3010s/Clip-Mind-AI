"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { ChevronDownIcon, DownloadIcon } from "../../../components/ui/icons";

const TOPICS = [
  { label: "Machine Learning", pct: 40, color: "var(--color-signal)" },
  { label: "Deep Learning", pct: 25, color: "var(--color-secondary)" },
  { label: "AI Applications", pct: 20, color: "var(--color-ok)" },
  { label: "Others", pct: 15, color: "var(--color-marker)" },
];

const SOURCES = [
  { label: "YouTube", pct: 45, color: "bg-marker" },
  { label: "Direct", pct: 30, color: "bg-signal" },
  { label: "Referral", pct: 15, color: "bg-secondary" },
  { label: "Others", pct: 10, color: "bg-line-dark" },
];

// Illustrative watch-time trend (no analytics API yet) — same shape used across the mock.
const TREND = [42, 58, 51, 70, 64, 80, 74];
const TREND_LABELS = ["Apr 28", "May 5", "May 12", "May 19", "May 26"];

function donutSegments(topics) {
  let acc = 0;
  const r = 15.9155;
  const c = 2 * Math.PI * r;
  return topics.map((t) => {
    const dash = (t.pct / 100) * c;
    const seg = { ...t, dashArray: `${dash} ${c - dash}`, offset: c - (acc / 100) * c };
    acc += t.pct;
    return seg;
  });
}

export default function AnalyticsPage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    api.get("/api/v1/videos").then((res) => setVideos(res.data)).catch(() => {});
  }, []);

  const totalVideos = videos.length;
  const completed = videos.filter((v) => v.status === "ready").length;
  const totalMinutes = videos.reduce((s, v) => s + (v.duration_seconds || 0), 0) / 60;
  const segments = donutSegments(TOPICS);

  const topVideos = [...videos]
    .sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0))
    .slice(0, 3);

  const max = Math.max(...TREND);
  const points = TREND.map((v, i) => `${(i / (TREND.length - 1)) * 100},${100 - (v / max) * 90}`).join(" ");

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-paper">Analytics</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">Get insights about your videos and audience</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select className="appearance-none rounded-lg border border-line bg-cloud py-2 pl-3 pr-9 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:bg-graphite dark:text-paper">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>Last 90 Days</option>
            </select>
            <ChevronDownIcon width={14} height={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-paper/40" />
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-line bg-cloud px-3 py-2 text-sm text-ink dark:border-line-dark dark:bg-graphite dark:text-paper">
            <DownloadIcon width={15} height={15} /> Export
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Videos" value={totalVideos} delta="+15%" />
        <StatCard label="Completed" value={completed} delta="+8%" />
        <StatCard label="Total Watch Time (hrs)" value={(totalMinutes / 60).toFixed(1)} delta="+12%" />
        <StatCard label="Completion Rate" value={totalVideos ? `${Math.round((completed / totalVideos) * 100)}%` : "—"} delta="+10%" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Views Over Time</p>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full overflow-visible text-signal">
            <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-2 flex justify-between text-xs text-ink/40 dark:text-paper/40">
            {TREND_LABELS.map((l) => <span key={l}>{l}</span>)}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Top Topics</p>
          <div className="flex items-center gap-5">
            <svg viewBox="0 0 36 36" className="h-24 w-24 shrink-0 -rotate-90">
              {segments.map((s) => (
                <circle key={s.label} cx="18" cy="18" r="15.9155" fill="none" stroke={s.color} strokeWidth="4.5"
                  strokeDasharray={s.dashArray} strokeDashoffset={s.offset} />
              ))}
            </svg>
            <ul className="space-y-1.5 text-xs">
              {TOPICS.map((t) => (
                <li key={t.label} className="flex items-center gap-2 text-ink/70 dark:text-paper/70">
                  <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                  {t.label} <span className="text-ink/40 dark:text-paper/40">{t.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Top Videos</p>
          {topVideos.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-paper/40">No videos yet.</p>
          ) : (
            <ol className="space-y-3">
              {topVideos.map((v, i) => (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-ink/80 dark:text-paper/80">{i + 1}. {v.title || v.filename}</span>
                  <span className="shrink-0 text-ink/40 dark:text-paper/40">{Math.round((v.duration_seconds || 0) / 6)} views</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Audience by Source</p>
          <ul className="space-y-3">
            {SOURCES.map((s) => (
              <li key={s.label}>
                <div className="mb-1 flex justify-between text-xs text-ink/60 dark:text-paper/60">
                  <span>{s.label}</span>
                  <span>{s.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, delta }) {
  return (
    <div className="rounded-xl border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink dark:text-paper">{value}</p>
      {delta && <p className="mt-1 text-xs font-medium text-ok">↑ {delta}</p>}
    </div>
  );
}
