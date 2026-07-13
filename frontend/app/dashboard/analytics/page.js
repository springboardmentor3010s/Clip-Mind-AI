"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { DownloadIcon } from "../../../components/ui/icons";

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/analytics/overview"),
      api.get("/api/v1/videos"),
    ])
      .then(([overviewRes, videosRes]) => {
        setData(overviewRes.data);
        setVideos(videosRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const topVideos = [...videos]
    .sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0))
    .slice(0, 5);

  const maxUpload = data ? Math.max(1, ...data.uploads_over_time.map((p) => p.count)) : 1;
  const maxKeyword = data && data.top_keywords.length ? data.top_keywords[0].count : 1;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-paper">Analytics</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">
            {data?.scope === "platform" ? "Platform-wide content insights and usage" : "Insights into your uploaded content"}
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-line bg-cloud px-3 py-2 text-sm text-ink dark:border-line-dark dark:bg-graphite dark:text-paper">
          <DownloadIcon width={15} height={15} /> Export
        </button>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>
      ) : !data || data.total_videos === 0 ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">No videos yet — analytics will appear once you upload content.</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Videos" value={data.total_videos} />
            <StatCard label="Completed" value={data.completed_videos} />
            <StatCard label="Total Runtime" value={formatDuration(data.total_duration_seconds)} />
            <StatCard label="Completion Rate" value={`${data.completion_rate}%`} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Uploads Over Time</p>
              <div className="flex h-40 items-end gap-2">
                {data.uploads_over_time.map((p) => (
                  <div key={p.period} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-sm bg-signal/70"
                      style={{ height: `${Math.max(4, (p.count / maxUpload) * 100)}%` }}
                      title={`${p.count} upload${p.count === 1 ? "" : "s"}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2 text-[10px] text-ink/40 dark:text-paper/40">
                {data.uploads_over_time.map((p) => (
                  <span key={p.period} className="flex-1 text-center">{p.period}</span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Top Keywords</p>
              {data.top_keywords.length === 0 ? (
                <p className="text-sm text-ink/40 dark:text-paper/40">Generate key moments on your videos to see keyword insights here.</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.top_keywords.map((k) => (
                    <li key={k.keyword}>
                      <div className="mb-1 flex justify-between text-xs text-ink/60 dark:text-paper/60">
                        <span className="capitalize">{k.keyword}</span>
                        <span>{k.count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
                        <div className="h-full rounded-full bg-signal" style={{ width: `${(k.count / maxKeyword) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Longest Videos</p>
              {topVideos.length === 0 ? (
                <p className="text-sm text-ink/40 dark:text-paper/40">No videos yet.</p>
              ) : (
                <ol className="space-y-3">
                  {topVideos.map((v, i) => (
                    <li key={v.id} className="flex items-center justify-between text-sm">
                      <span className="truncate text-ink/80 dark:text-paper/80">{i + 1}. {v.title || v.filename}</span>
                      <span className="shrink-0 text-ink/40 dark:text-paper/40">{formatDuration(v.duration_seconds || 0)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Status Breakdown</p>
              <ul className="space-y-3">
                {data.status_breakdown.map((s) => (
                  <li key={s.status}>
                    <div className="mb-1 flex justify-between text-xs capitalize text-ink/60 dark:text-paper/60">
                      <span>{s.status}</span>
                      <span>{s.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
                      <div className="h-full rounded-full bg-signal" style={{ width: `${(s.count / data.total_videos) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink dark:text-paper">{value}</p>
    </div>
  );
}