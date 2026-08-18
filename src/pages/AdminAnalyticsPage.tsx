import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Users,
  Video,
  Eye,
  CheckCircle2,
  Clock3,
  Activity,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { SystemAnalytics } from '../types';

export const AdminAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] =
    useState<SystemAnalytics | null>(null);

  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);

    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const analyticsData = analytics as any;

  const totalUsers =
    analyticsData?.totalUsers ??
    analyticsData?.usersCount ??
    0;

  const totalVideos =
    analyticsData?.totalVideos ??
    analyticsData?.videosCount ??
    0;

  const totalViews =
    analyticsData?.totalViews ??
    analyticsData?.viewsCount ??
    0;

  const completedVideos =
    analyticsData?.completedVideos ??
    analyticsData?.completedCount ??
    0;

  const processingVideos =
    analyticsData?.processingVideos ??
    analyticsData?.processingCount ??
    0;

  const recentActivity =
    analyticsData?.recentActivity ?? [];

  const roleDistribution =
    analyticsData?.roleDistribution ??
    analyticsData?.usersByRole ??
    [];

  const videoDistribution =
    analyticsData?.videoStatusDistribution ??
    analyticsData?.videosByStatus ??
    [];

  const completionRate = useMemo(() => {
    if (!totalVideos) return 0;

    return Math.round(
      (completedVideos / totalVideos) * 100
    );
  }, [totalVideos, completedVideos]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />

        <p className="mt-4 text-sm font-semibold text-slate-400">
          Loading platform analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-16">

      {/* HEADER */}
      <section>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">

          <div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-[10px] font-black uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" />
              Platform Analytics
            </div>

            <h1 className="mt-4 text-3xl font-black text-white">
              Platform Intelligence
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Monitor users, video activity, processing performance
              and platform engagement.
            </p>

          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/70 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Analytics
          </button>

        </div>
      </section>

      {/* KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <MetricCard
          label="Registered Users"
          value={totalUsers}
          icon={Users}
          description="Platform accounts"
          iconClass="text-blue-400"
        />

        <MetricCard
          label="Total Videos"
          value={totalVideos}
          icon={Video}
          description="Uploaded media"
          iconClass="text-purple-400"
        />

        <MetricCard
          label="Total Views"
          value={totalViews}
          icon={Eye}
          description="Platform engagement"
          iconClass="text-cyan-400"
        />

        <MetricCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          description="Successful AI processing"
          iconClass="text-emerald-400"
        />

      </section>

      {/* PROCESSING OVERVIEW */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        <div className="xl:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-sm font-bold text-white">
                AI Processing Overview
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Current video processing distribution
              </p>

            </div>

            <Activity className="w-5 h-5 text-blue-400" />

          </div>

          <div className="mt-7 grid grid-cols-2 gap-4">

            <ProcessCard
              label="Completed"
              value={completedVideos}
              icon={CheckCircle2}
              className="text-emerald-400"
            />

            <ProcessCard
              label="Processing"
              value={processingVideos}
              icon={Clock3}
              className="text-amber-400"
            />

          </div>

          <div className="mt-7">

            <div className="flex items-center justify-between mb-2">

              <span className="text-xs text-slate-400">
                Successful processing
              </span>

              <span className="text-xs font-bold text-white">
                {completionRate}%
              </span>

            </div>

            <div className="h-3 rounded-full bg-slate-800 overflow-hidden">

              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all"
                style={{
                  width: `${completionRate}%`,
                }}
              />

            </div>

          </div>

        </div>

        {/* SYSTEM HEALTH */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>

            <div>

              <h2 className="text-sm font-bold text-white">
                Platform Health
              </h2>

              <p className="text-xs text-slate-500">
                Current system state
              </p>

            </div>

          </div>

          <div className="mt-6 space-y-4">

            <HealthRow
              label="API Server"
              value="Operational"
            />

            <HealthRow
              label="Database"
              value="Connected"
            />

            <HealthRow
              label="AI Pipeline"
              value="Available"
            />

            <HealthRow
              label="Media Engine"
              value="Ready"
            />

          </div>

        </div>

      </section>

      {/* DISTRIBUTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* USERS BY ROLE */}
        <DistributionPanel
          title="Users by Role"
          description="Distribution of registered platform accounts"
          icon={Users}
          data={roleDistribution}
        />

        {/* VIDEOS BY STATUS */}
        <DistributionPanel
          title="Videos by Status"
          description="Current media processing states"
          icon={Video}
          data={videoDistribution}
        />

      </section>

      {/* RECENT ACTIVITY */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

          <div>

            <h2 className="text-sm font-bold text-white">
              Recent Platform Activity
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Latest recorded administrative and user events
            </p>

          </div>

          <Activity className="w-5 h-5 text-indigo-400" />

        </div>

        {recentActivity.length > 0 ? (

          <div className="divide-y divide-slate-800/70">

            {recentActivity.map(
              (item: any, index: number) => (

                <div
                  key={item.id || index}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-slate-950/40"
                >

                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-indigo-400" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-xs font-bold text-white">
                      {item.action || 'Platform Activity'}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      {item.details || item.description || 'System event recorded'}
                    </p>

                  </div>

                  <span className="text-[10px] text-slate-600 whitespace-nowrap">
                    {formatDate(
                      item.timestamp ||
                      item.createdAt
                    )}
                  </span>

                </div>

              )
            )}

          </div>

        ) : (

          <div className="py-14 text-center">

            <Activity className="w-8 h-8 text-slate-700 mx-auto" />

            <p className="mt-3 text-sm font-semibold text-slate-400">
              No recent activity
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Platform activity will appear here.
            </p>

          </div>

        )}

      </section>

    </div>
  );
};

/* =========================================================
   METRIC CARD
========================================================= */

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  iconClass: string;
}> = ({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

    <div className="flex items-start justify-between">

      <div>

        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </p>

        <p className="mt-2 text-3xl font-black text-white">
          {value}
        </p>

        <p className="mt-1 text-[10px] text-slate-600">
          {description}
        </p>

      </div>

      <Icon className={`w-5 h-5 ${iconClass}`} />

    </div>

  </div>
);

/* =========================================================
   PROCESS CARD
========================================================= */

const ProcessCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  className: string;
}> = ({
  label,
  value,
  icon: Icon,
  className,
}) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </p>

        <p className="mt-2 text-2xl font-black text-white">
          {value}
        </p>

      </div>

      <Icon className={`w-5 h-5 ${className}`} />

    </div>

  </div>
);

/* =========================================================
   HEALTH ROW
========================================================= */

const HealthRow: React.FC<{
  label: string;
  value: string;
}> = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between">

    <span className="text-xs text-slate-400">
      {label}
    </span>

    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">

      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

      {value}

    </span>

  </div>
);

/* =========================================================
   DISTRIBUTION PANEL
========================================================= */

const DistributionPanel: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  data: any[];
}> = ({
  title,
  description,
  icon: Icon,
  data,
}) => {

  const normalized = (data || []).map(
    (item: any) => ({
      label:
        item.label ||
        item.role ||
        item.status ||
        item.name ||
        'Unknown',

      value:
        Number(
          item.value ??
          item.count ??
          item.total ??
          0
        ),
    })
  );

  const max = Math.max(
    ...normalized.map((item) => item.value),
    1
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>

        <div>

          <h2 className="text-sm font-bold text-white">
            {title}
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            {description}
          </p>

        </div>

      </div>

      {normalized.length > 0 ? (

        <div className="mt-7 space-y-5">

          {normalized.map(
            (item, index) => {

              const percentage =
                Math.round(
                  (item.value / max) * 100
                );

              return (
                <div key={index}>

                  <div className="flex items-center justify-between mb-2">

                    <span className="text-xs font-semibold text-slate-300">
                      {item.label}
                    </span>

                    <span className="text-xs font-black text-white">
                      {item.value}
                    </span>

                  </div>

                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">

                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                </div>
              );
            }
          )}

        </div>

      ) : (

        <div className="mt-8 py-8 text-center">

          <BarChart3 className="w-7 h-7 text-slate-700 mx-auto" />

          <p className="mt-2 text-xs text-slate-500">
            No distribution data available.
          </p>

        </div>

      )}

    </div>
  );
};

/* =========================================================
   DATE FORMAT
========================================================= */

const formatDate = (value: any) => {
  if (!value) return 'Recently';

  try {
    return new Date(value).toLocaleString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  } catch {
    return 'Recently';
  }
};
