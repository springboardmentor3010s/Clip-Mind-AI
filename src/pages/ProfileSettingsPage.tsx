import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LearningBookmark, VideoItem } from '../types';
import { api } from '../services/api';
import {
  User,
  Bookmark,
  Mail,
  ShieldCheck,
  CalendarDays,
  Video,
  FileText,
  Sparkles,
  Zap,
  Activity,
  Clock3,
} from 'lucide-react';

export const ProfileSettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [bookmarks, setBookmarks] = useState<LearningBookmark[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const [bookmarkData, videoData] = await Promise.all([
          api.getBookmarks().catch(() => []),
          api.getVideos().catch(() => []),
        ]);

        setBookmarks(bookmarkData || []);
        setVideos(videoData || []);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const role = (user?.role || 'LEARNER').toUpperCase();

  const isLearner =
    role === 'LEARNER' || role === 'STUDENT';

  const completedVideos = useMemo(
    () =>
      videos.filter(
        (v) => v.status === 'COMPLETED'
      ).length,
    [videos]
  );

  const transcripts = useMemo(
    () =>
      videos.filter(
        (v) =>
          (v as any).transcript ||
          v.status === 'COMPLETED'
      ).length,
    [videos]
  );

  const summaries = useMemo(
    () =>
      videos.filter(
        (v) =>
          (v as any).summary ||
          v.status === 'COMPLETED'
      ).length,
    [videos]
  );

  const keyMoments = useMemo(
    () =>
      videos.reduce(
        (total, v) =>
          total +
          (((v as any).keyMoments || []).length || 0),
        0
      ),
    [videos]
  );

  if (!user) return null;

  const displayRole = isLearner
    ? 'Learner'
    : 'Content Creator';

  const roleDescription = isLearner
    ? 'Your learning profile, saved resources, and activity.'
    : 'Your creator profile, content activity, and processing statistics.';

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(
        undefined,
        {
          month: 'short',
          year: 'numeric',
        }
      )
    : 'Recently';

  const initial =
    user.name?.charAt(0).toUpperCase() ||
    user.email?.charAt(0).toUpperCase() ||
    'U';

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-16">

      {/* HEADER */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
          <User className="w-3.5 h-3.5" />
          Account Profile
        </div>

        <h1 className="mt-4 text-3xl font-black text-white">
          My Profile
        </h1>

        <p className="text-sm text-slate-400 mt-1">
          {roleDescription}
        </p>
      </div>

      {/* PROFILE HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent" />

        <div className="relative p-7 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-blue-500 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/20">
              {initial}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-black text-white">
                {user.name}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>

                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Joined {joinedDate}
                </span>
              </div>

              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wide">
                <ShieldCheck className="w-3 h-3" />
                {displayRole}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACCOUNT DETAILS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <InfoCard
          icon={<User className="w-4 h-4" />}
          label="Full Name"
          value={user.name}
        />

        <InfoCard
          icon={<Mail className="w-4 h-4" />}
          label="Email Address"
          value={user.email}
        />

        <InfoCard
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Account Role"
          value={displayRole}
        />

      </section>

      {/* ACTIVITY */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-white">
              {isLearner
                ? 'Learning Activity'
                : 'Creator Activity'}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Live statistics from your ClipMind account.
            </p>
          </div>

          {loading && (
            <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <StatCard
            icon={<Video className="w-4 h-4" />}
            label="Videos"
            value={videos.length}
          />

          <StatCard
            icon={<CheckCircleIcon />}
            label="Completed"
            value={completedVideos}
          />

          <StatCard
            icon={<FileText className="w-4 h-4" />}
            label="Transcripts"
            value={transcripts}
          />

          <StatCard
            icon={<Sparkles className="w-4 h-4" />}
            label="Summaries"
            value={summaries}
          />

        </div>
      </section>

      {/* CREATOR EXTRA */}
      {!isLearner && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black text-white">
              Content Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <MiniStat
              label="Key Moments"
              value={keyMoments}
            />

            <MiniStat
              label="Processed Videos"
              value={completedVideos}
            />

            <MiniStat
              label="Processing Status"
              value={
                videos.length
                  ? `${completedVideos}/${videos.length}`
                  : '0/0'
              }
            />

          </div>
        </section>
      )}

      {/* LEARNER BOOKMARKS */}
      {isLearner && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                Saved Learning
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Your bookmarked learning moments.
              </p>
            </div>

            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-black">
              {bookmarks.length} SAVED
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <div className="p-8 text-center">
              <Bookmark className="w-8 h-8 mx-auto text-slate-700" />
              <p className="text-xs text-slate-500 mt-3">
                No bookmarks saved yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {bookmarks.slice(0, 5).map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="p-4 hover:bg-slate-950/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-xs font-bold text-indigo-300">
                        {bookmark.videoTitle}
                      </p>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                        {bookmark.contentSnippet}
                      </p>
                    </div>

                    {bookmark.timestampSec !== undefined && (
                      <span className="flex-shrink-0 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Clock3 className="w-3 h-3" />
                        {Math.floor(
                          bookmark.timestampSec
                        )}s
                      </span>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}

        </section>
      )}

    </div>
  );
};

const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
      {icon}
    </div>

    <p className="text-[9px] uppercase tracking-wider font-black text-slate-500 mt-4">
      {label}
    </p>

    <p className="text-sm font-bold text-white mt-1 truncate">
      {value}
    </p>
  </div>
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
}> = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
    <div className="flex items-center justify-between">
      <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center">
        {icon}
      </div>

      <span className="text-2xl font-black text-white">
        {value}
      </span>
    </div>

    <p className="text-[10px] uppercase tracking-wider font-black text-slate-500 mt-4">
      {label}
    </p>
  </div>
);

const MiniStat: React.FC<{
  label: string;
  value: number | string;
}> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
    <p className="text-xl font-black text-white">
      {value}
    </p>

    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">
      {label}
    </p>
  </div>
);

const CheckCircleIcon = () => (
  <span className="text-emerald-400">
    ✓
  </span>
);
