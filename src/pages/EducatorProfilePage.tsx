import React, { useEffect, useState } from 'react';
import {
  UserCircle,
  Mail,
  GraduationCap,
  ShieldCheck,
  CalendarDays,
  Users,
  Video,
  BookOpen,
  Activity,
  Clock3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { VideoItem } from '../types';

export const EducatorProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classroomData, videoData] = await Promise.all([
          api.getClassrooms().catch(() => []),
          api.getVideos().catch(() => []),
        ]);

        setClassrooms(classroomData || []);
        setVideos(videoData || []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (!user) return null;

  const initial =
    user.name?.charAt(0).toUpperCase() ||
    user.email?.charAt(0).toUpperCase() ||
    'E';

  const completedVideos = videos.filter(
    (video) => video.status === 'COMPLETED'
  ).length;

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(
        undefined,
        {
          month: 'short',
          year: 'numeric',
        }
      )
    : 'Recently';

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-16">

      {/* HEADER */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
          <GraduationCap className="w-3.5 h-3.5" />
          Educator Profile
        </div>

        <h1 className="mt-4 text-3xl font-black text-white">
          My Profile
        </h1>

        <p className="text-sm text-slate-400 mt-1">
          Manage your educator account and view your teaching activity.
        </p>
      </div>

      {/* PROFILE HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-transparent" />

        <div className="relative p-7 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-emerald-500/20">
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

              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wide">
                <ShieldCheck className="w-3 h-3" />
                Educator
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ACCOUNT DETAILS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <InfoCard
          icon={<UserCircle className="w-4 h-4" />}
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
          value="Educator"
        />

      </section>

      {/* TEACHING STATISTICS */}
      <section>

        <div className="flex items-center justify-between mb-4">

          <div>
            <h2 className="text-base font-black text-white">
              Teaching Activity
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Live statistics from your educator account.
            </p>
          </div>

          {loading && (
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          )}

        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <StatCard
            icon={<BookOpen className="w-4 h-4" />}
            label="Classrooms"
            value={classrooms.length}
          />

          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Students"
            value={0}
          />

          <StatCard
            icon={<Video className="w-4 h-4" />}
            label="Videos"
            value={videos.length}
          />

          <StatCard
            icon={<Activity className="w-4 h-4" />}
            label="Completed"
            value={completedVideos}
          />

        </div>

      </section>

      {/* CLASSROOM OVERVIEW */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

        <div className="p-5 border-b border-slate-800">

          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />

            <div>
              <h2 className="text-sm font-black text-white">
                My Classrooms
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Classrooms created and managed by you.
              </p>
            </div>
          </div>

        </div>

        {classrooms.length === 0 ? (

          <div className="p-8 text-center">
            <BookOpen className="w-8 h-8 mx-auto text-slate-700" />

            <p className="text-xs text-slate-500 mt-3">
              No classrooms available yet.
            </p>
          </div>

        ) : (

          <div className="divide-y divide-slate-800">

            {classrooms.slice(0, 6).map((classroom) => (

              <div
                key={classroom.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-950/40 transition-colors"
              >

                <div>
                  <p className="text-xs font-bold text-white">
                    {classroom.name}
                  </p>

                  {classroom.description && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {classroom.description}
                    </p>
                  )}
                </div>

                <span className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                  {classroom.classCode || 'CLASS'}
                </span>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* ACCOUNT INFORMATION */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

        <div className="flex items-center gap-2 mb-4">
          <Clock3 className="w-4 h-4 text-blue-400" />

          <h2 className="text-sm font-black text-white">
            Account Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
            <p className="text-[9px] uppercase tracking-wider font-black text-slate-600">
              Account Created
            </p>

            <p className="text-xs font-bold text-white mt-1">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleString()
                : 'Not available'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
            <p className="text-[9px] uppercase tracking-wider font-black text-slate-600">
              Last Login
            </p>

            <p className="text-xs font-bold text-white mt-1">
              {(user as any).lastLogin
                ? new Date(
                    (user as any).lastLogin
                  ).toLocaleString()
                : 'Not available'}
            </p>
          </div>

        </div>

      </section>

    </div>
  );
};

const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
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

      <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center">
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
