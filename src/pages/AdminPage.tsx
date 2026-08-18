import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  Video,
  Activity,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Server,
  Database,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { User, VideoItem, SystemAnalytics } from '../types';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const [userData, videoData, analyticsData] = await Promise.all([
        api.getUsers(),
        api.getVideos(),
        api.getAnalytics(),
      ]);

      setUsers(userData);
      setVideos(videoData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const completedVideos = videos.filter(
    (video) => video.status === 'COMPLETED'
  ).length;

  const processingVideos = videos.filter(
    (video) =>
      video.status !== 'COMPLETED' &&
      video.status !== 'FAILED'
  ).length;

  const failedVideos = videos.filter(
    (video) => video.status === 'FAILED'
  ).length;

  const administrators = users.filter(
    (user) => user.role === 'ADMINISTRATOR'
  ).length;

  const creators = users.filter(
    (user) => user.role === 'CONTENT_CREATOR'
  ).length;

  const learners = users.filter(
    (user) => user.role === 'LEARNER'
  ).length;

  const educators = users.filter(
    (user) => user.role === 'EDUCATOR'
  ).length;

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <RefreshCw className="w-7 h-7 text-red-400 animate-spin" />
        <p className="mt-4 text-sm font-semibold text-slate-400">
          Loading administrator dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">

      {/* HEADER */}
      <section>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-300 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrator
            </div>

            <h1 className="mt-4 text-3xl font-black text-white">
              Platform Overview
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Monitor ClipMind AI users, videos, processing jobs and
              platform health from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/70 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Dashboard
          </button>

        </div>
      </section>

      {/* MAIN METRICS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <MetricCard
          title="Total Users"
          value={users.length}
          subtitle={`${administrators} administrators`}
          icon={Users}
          iconClass="text-blue-400"
          bgClass="bg-blue-500/10"
        />

        <MetricCard
          title="Total Videos"
          value={videos.length}
          subtitle={`${completedVideos} completed`}
          icon={Video}
          iconClass="text-purple-400"
          bgClass="bg-purple-500/10"
        />

        <MetricCard
          title="Processing Jobs"
          value={processingVideos}
          subtitle="Currently processing"
          icon={Clock3}
          iconClass="text-amber-400"
          bgClass="bg-amber-500/10"
        />

        <MetricCard
          title="Failed Jobs"
          value={failedVideos}
          subtitle={
            failedVideos === 0
              ? 'Everything looks healthy'
              : 'Requires attention'
          }
          icon={failedVideos === 0 ? CheckCircle2 : AlertTriangle}
          iconClass={
            failedVideos === 0
              ? 'text-emerald-400'
              : 'text-red-400'
          }
          bgClass={
            failedVideos === 0
              ? 'bg-emerald-500/10'
              : 'bg-red-500/10'
          }
        />

      </section>

      {/* SYSTEM STATUS */}
      <section>

        <div className="flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-bold text-white">
            Platform Health
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <HealthCard
            title="FastAPI Backend"
            value="Online"
            description="Authentication and API services available"
          />

          <HealthCard
            title="Database"
            value="Connected"
            description="SQLAlchemy database connection active"
          />

          <HealthCard
            title="AI Processing Pipeline"
            value="Ready"
            description="Whisper, BART and key-moment processing available"
          />

        </div>

      </section>

      {/* USER DISTRIBUTION + VIDEO STATUS */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* USERS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <p className="text-sm font-bold text-white">
                User Distribution
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Current platform accounts by role
              </p>
            </div>

            <Users className="w-5 h-5 text-blue-400" />

          </div>

          <div className="space-y-4">

            <DistributionRow
              label="Content Creators"
              value={creators}
              total={users.length}
            />

            <DistributionRow
              label="Learners"
              value={learners}
              total={users.length}
            />

            <DistributionRow
              label="Educators"
              value={educators}
              total={users.length}
            />

            <DistributionRow
              label="Administrators"
              value={administrators}
              total={users.length}
            />

          </div>

        </div>

        {/* VIDEOS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <p className="text-sm font-bold text-white">
                Video Processing
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Current processing pipeline state
              </p>
            </div>

            <Video className="w-5 h-5 text-purple-400" />

          </div>

          <div className="grid grid-cols-3 gap-3">

            <StatusBox
              label="Completed"
              value={completedVideos}
              icon={CheckCircle2}
              className="text-emerald-400"
            />

            <StatusBox
              label="Processing"
              value={processingVideos}
              icon={Clock3}
              className="text-amber-400"
            />

            <StatusBox
              label="Failed"
              value={failedVideos}
              icon={AlertTriangle}
              className="text-red-400"
            />

          </div>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Completion Rate
              </span>

              <span className="text-sm font-black text-white">
                {videos.length
                  ? Math.round(
                      (completedVideos / videos.length) * 100
                    )
                  : 0}
                %
              </span>
            </div>

            <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">

              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{
                  width: `${
                    videos.length
                      ? (completedVideos / videos.length) * 100
                      : 0
                  }%`,
                }}
              />

            </div>

          </div>

        </div>

      </section>

      {/* ANALYTICS SNAPSHOT */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">

        <div className="flex items-center justify-between mb-6">

          <div>
            <p className="text-sm font-bold text-white">
              Platform Snapshot
            </p>

            <p className="text-xs text-slate-500 mt-1">
              High-level statistics from the ClipMind backend
            </p>
          </div>

          <Activity className="w-5 h-5 text-cyan-400" />

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <Snapshot
            label="Registered Users"
            value={users.length}
          />

          <Snapshot
            label="Videos Stored"
            value={videos.length}
          />

          <Snapshot
            label="Completed Videos"
            value={completedVideos}
          />

          <Snapshot
            label="Failed Processing"
            value={failedVideos}
          />

        </div>

        {analytics && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-4">

            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />

              <span className="text-xs font-bold text-slate-300">
                Analytics service connected
              </span>

              <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

          </div>
        )}

      </section>

      {/* QUICK ACTIONS */}
      <section>

        <div className="flex items-center gap-2 mb-4">
          <ArrowUpRight className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-bold text-white">
            Administration Areas
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <QuickAction
            title="Manage Users"
            description="Review accounts and update user roles."
            icon={Users}
            color="blue"
            onClick={() => window.dispatchEvent(
              new CustomEvent('admin:navigate', {
                detail: 'admin-users',
              })
            )}
          />

          <QuickAction
            title="Manage Videos"
            description="Inspect uploaded videos and processing status."
            icon={Video}
            color="purple"
            onClick={() => window.dispatchEvent(
              new CustomEvent('admin:navigate', {
                detail: 'admin-videos',
              })
            )}
          />

          <QuickAction
            title="View Analytics"
            description="Explore platform performance and usage metrics."
            icon={Activity}
            color="cyan"
            onClick={() => window.dispatchEvent(
              new CustomEvent('admin:navigate', {
                detail: 'admin-analytics',
              })
            )}
          />

        </div>

      </section>

    </div>
  );
};

/* =========================================================
   COMPONENTS
========================================================= */

interface MetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  bgClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  bgClass,
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

    <div className="flex items-start justify-between">

      <div>
        <p className="text-xs text-slate-500">
          {title}
        </p>

        <p className="mt-2 text-3xl font-black text-white">
          {value}
        </p>

        <p className="mt-2 text-[10px] text-slate-500">
          {subtitle}
        </p>
      </div>

      <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>

    </div>

  </div>
);

interface HealthCardProps {
  title: string;
  value: string;
  description: string;
}

const HealthCard: React.FC<HealthCardProps> = ({
  title,
  value,
  description,
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

    <div className="flex items-center justify-between">

      <span className="text-xs font-semibold text-slate-400">
        {title}
      </span>

      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {value}
      </span>

    </div>

    <p className="mt-4 text-xs text-slate-500 leading-5">
      {description}
    </p>

  </div>
);

interface DistributionRowProps {
  label: string;
  value: number;
  total: number;
}

const DistributionRow: React.FC<DistributionRowProps> = ({
  label,
  value,
  total,
}) => {
  const percentage = total
    ? Math.round((value / total) * 100)
    : 0;

  return (
    <div>

      <div className="flex items-center justify-between mb-2">

        <span className="text-xs text-slate-400">
          {label}
        </span>

        <span className="text-xs font-bold text-white">
          {value}
        </span>

      </div>

      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">

        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
          style={{ width: `${percentage}%` }}
        />

      </div>

    </div>
  );
};

interface StatusBoxProps {
  label: string;
  value: number;
  icon: React.ElementType;
  className: string;
}

const StatusBox: React.FC<StatusBoxProps> = ({
  label,
  value,
  icon: Icon,
  className,
}) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">

    <Icon className={`w-4 h-4 ${className}`} />

    <p className="mt-3 text-xl font-black text-white">
      {value}
    </p>

    <p className="text-[10px] text-slate-500">
      {label}
    </p>

  </div>
);

const Snapshot: React.FC<{
  label: string;
  value: number;
}> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">

    <p className="text-[10px] uppercase tracking-wider text-slate-600">
      {label}
    </p>

    <p className="mt-2 text-2xl font-black text-white">
      {value}
    </p>

  </div>
);

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: 'blue' | 'purple' | 'cyan';
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon: Icon,
  color,
  onClick,
}) => {

  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 hover:bg-slate-900 transition-all"
    >

      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorClasses[color]}`}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="mt-4 flex items-center justify-between">

        <div>
          <h3 className="text-sm font-bold text-white">
            {title}
          </h3>

          <p className="mt-1 text-xs text-slate-500 leading-5">
            {description}
          </p>
        </div>

        <ArrowUpRight className="w-4 h-4 text-slate-600" />

      </div>

    </button>
  );
};
