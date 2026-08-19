"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/config';
import Link from 'next/link';

interface DashboardMetrics {
  total_videos: number;
  total_views: number;
  total_exports: number;
  avg_processing_time_seconds: number;
  events_timeline: { date: string; count: number }[];
  videos_uploaded_today: number;
  videos_uploaded_yesterday: number;
  downloads_today: number;
  downloads_yesterday: number;
  rolling_8_day: { date: string; uploads: number; downloads: number; views: number }[];
  total_keywords: number;
  total_key_moments: number;
  videos_by_status: Record<string, number>;
  avg_views_per_video: number;
}

function StatCard({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="bg-md-surface-container rounded-xl p-6">
      <h3 className="text-body-small font-medium text-md-on-surface-variant mb-1">{label}</h3>
      <p className={`text-headline-small font-bold ${color || 'text-md-on-surface'}`}>{value}</p>
    </div>
  );
}

function GroupedBarChart({
  title,
  data,
  series,
}: {
  title: string;
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
}) {
  const maxVal = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)));

  return (
    <div className="bg-md-surface-container rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-title-large font-semibold text-md-on-surface">{title}</h3>
        <div className="flex items-center gap-4">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-label-small text-md-on-surface-variant">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-md-on-surface-variant italic">
          No activity data recorded yet.
        </div>
      ) : (
        <div className="h-64 flex items-end gap-3">
          {data.map((d, idx) => (
            <div key={idx} className="relative flex flex-col items-center flex-1 group">
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-md-inverse-surface text-md-inverse-on-surface text-label-small py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-20 shadow-lg">
                <div className="font-semibold mb-0.5">{String(d.label ?? d.date)}</div>
                {series.map((s) => (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    {s.label}: {Number(d[s.key]) || 0}
                  </div>
                ))}
              </div>
              <div className="w-full flex items-end justify-center gap-1 h-full pb-2">
                {series.map((s) => {
                  const val = Number(d[s.key]) || 0;
                  const heightPct = (val / maxVal) * 100;
                  return (
                    <div key={s.key} className="flex-1 max-w-[22px] h-full flex items-end">
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{ height: `${heightPct}%`, minHeight: '3px', backgroundColor: s.color }}
                      />
                    </div>
                  );
                })}
              </div>
              <span className="text-label-small text-md-on-surface-variant truncate w-full text-center">
                {String(d.label ?? d.date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/dashboard`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (e) {
        console.error("Failed to fetch analytics", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const yesterdayTodayData = metrics
    ? [
        { label: 'Yesterday', uploads: metrics.videos_uploaded_yesterday, downloads: metrics.downloads_yesterday },
        { label: 'Today', uploads: metrics.videos_uploaded_today, downloads: metrics.downloads_today },
      ]
    : [];

  const rollingData = metrics
    ? metrics.rolling_8_day.map((d) => ({
        label: d.date.slice(5),
        uploads: d.uploads,
        downloads: d.downloads,
        views: d.views,
      }))
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-headline-medium font-bold text-md-on-surface">
            Analytics Dashboard
          </h1>
          <p className="text-body-small text-md-on-surface-variant mt-1">
            Track engagement and system processing metrics across all videos.
          </p>
        </div>
        <Link href="/dashboard" className="px-4 py-2 bg-md-surface-container hover:bg-md-surface-container-high text-md-on-surface text-label-large font-medium rounded-full transition-colors">
          Back to Dashboard
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-md-surface-container rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-md-surface-container-highest rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-md-surface-container-highest rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : metrics ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Videos" value={metrics.total_videos} />
            <StatCard label="Total Video Views" value={metrics.total_views} />
            <StatCard label="Total Exports" value={metrics.total_exports} color="text-md-primary" />
            <StatCard label="Avg AI Processing Time" value={`${metrics.avg_processing_time_seconds.toFixed(1)}s`} color="text-md-tertiary" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Uploads — Yesterday" value={metrics.videos_uploaded_yesterday} />
            <StatCard label="Uploads — Today" value={metrics.videos_uploaded_today} />
            <StatCard label="Downloads — Yesterday" value={metrics.downloads_yesterday} />
            <StatCard label="Downloads — Today" value={metrics.downloads_today} />
          </div>

          <GroupedBarChart
            title="Yesterday vs. Today"
            data={yesterdayTodayData}
            series={[
              { key: 'uploads', label: 'Uploads', color: 'var(--color-md-primary)' },
              { key: 'downloads', label: 'Downloads', color: 'var(--color-md-tertiary)' },
            ]}
          />

          <GroupedBarChart
            title="Last 8 Days"
            data={rollingData}
            series={[
              { key: 'uploads', label: 'Uploads', color: 'var(--color-md-primary)' },
              { key: 'downloads', label: 'Downloads', color: 'var(--color-md-tertiary)' },
              { key: 'views', label: 'Views', color: 'var(--color-md-secondary)' },
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Avg Views / Video" value={metrics.avg_views_per_video.toFixed(1)} />
            <StatCard label="Total Keywords Extracted" value={metrics.total_keywords} />
            <StatCard label="Total Key Moments" value={metrics.total_key_moments} />
            <div className="bg-md-surface-container rounded-xl p-6">
              <h3 className="text-body-small font-medium text-md-on-surface-variant mb-2">Videos by Status</h3>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(metrics.videos_by_status).length === 0 ? (
                  <span className="text-body-small text-md-on-surface-variant italic">No videos yet</span>
                ) : (
                  Object.entries(metrics.videos_by_status).map(([status, count]) => (
                    <span key={status} className="px-2.5 py-1 rounded-full bg-md-surface-container-high text-label-small text-md-on-surface">
                      {status}: {count}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-md-on-surface-variant">
          Failed to load analytics data.
        </div>
      )}
    </div>
  );
}
