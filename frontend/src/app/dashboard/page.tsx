"use client";

import React, { useEffect, useState } from 'react';
import VideoUpload from '@/components/VideoUpload';
import { Sparkles, Activity, Clock, Film } from 'lucide-react';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/context/AuthContext';

interface Metrics {
  total_videos: number;
  total_views: number;
  total_exports: number;
  avg_processing_time_seconds: number;
}

export default function DashboardPage() {
  const { token, logout, user } = useAuth();
  const canManageContent = (user as any)?.role !== 'Learner';
  const [metrics, setMetrics] = useState<Metrics>({
    total_videos: 0,
    total_views: 0,
    total_exports: 0,
    avg_processing_time_seconds: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardMetrics = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        // Stale/expired token — the backend rejected it. Force a clean
        // re-login instead of silently leaving every stat at 0.
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Error loading dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    fetchDashboardMetrics();
    // Keep "today"'s numbers fresh while the dashboard is left open.
    const interval = setInterval(fetchDashboardMetrics, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboardMetrics]);

  const formattedProcessingTime = metrics.avg_processing_time_seconds > 0
    ? `${(metrics.avg_processing_time_seconds / 60).toFixed(1)}m`
    : '0s';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-headline-medium font-bold text-md-on-surface tracking-tight flex items-center gap-3">
          {canManageContent ? 'Creator Dashboard' : 'Library'}
          <Sparkles className="text-md-tertiary h-6 w-6" />
        </h1>
        <p className="text-md-on-surface-variant mt-2">
          {canManageContent
            ? 'Manage your uploads and view live AI insights.'
            : 'Explore videos, transcripts, and summaries shared on the platform.'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            label: 'Total Videos',
            value: loading ? '...' : metrics.total_videos.toString(),
            icon: Film,
            color: 'text-md-primary'
          },
          {
            label: 'Avg Processing Time',
            value: loading ? '...' : formattedProcessingTime,
            icon: Clock,
            color: 'text-md-tertiary'
          },
          {
            label: 'Total Video Views',
            value: loading ? '...' : metrics.total_views.toString(),
            icon: Activity,
            color: 'text-md-secondary'
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-md-surface-container p-6 rounded-xl transition-colors hover:bg-md-surface-container-high">
            <div className="flex items-center justify-between mb-4">
              <span className="text-md-on-surface-variant font-medium">{stat.label}</span>
              <div className={`p-2 bg-md-surface-container-highest rounded-lg ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <p className="text-headline-small font-bold text-md-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {canManageContent && (
        <VideoUpload onUploadComplete={fetchDashboardMetrics} onProcessingComplete={fetchDashboardMetrics} />
      )}
    </div>
  );
}
