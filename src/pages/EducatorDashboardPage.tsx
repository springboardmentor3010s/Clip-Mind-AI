import React, { useEffect, useState } from 'react';
import {
  School,
  Users,
  Video,
  ClipboardList,
  Plus,
  ArrowUpRight,
  Clock3,
  PlayCircle,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { VideoItem } from '../types';

interface EducatorDashboardPageProps {
  onNavigate: (tab: string) => void;
}

interface Classroom {
  id: string;
  name: string;
  code?: string;
  students: number;
  videos: number;
  assignments: number;
  progress: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  classroomId: string;
  classroom: string;
  joinedAt: string;
}

export const EducatorDashboardPage: React.FC<
  EducatorDashboardPageProps
> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [
          classroomData,
          videoData,
          studentData,
          assignmentData,
        ] = await Promise.all([
          api.getClassrooms(),
          api.getVideos(),
          api.getEducatorStudents(),
          api.getEducatorAssignments(),
        ]);

        const rawClassrooms = Array.isArray(classroomData)
          ? classroomData
          : [];

        const rawStudents = Array.isArray(studentData)
          ? studentData
          : [];

        const rawAssignments = Array.isArray(assignmentData)
          ? assignmentData
          : [];

        const rawVideos = Array.isArray(videoData)
          ? videoData
          : [];

        setVideos(rawVideos);
        setStudents(rawStudents);
        setAssignments(rawAssignments);

        const normalizedClassrooms: Classroom[] =
          rawClassrooms.map((classroom: any) => {
            const classroomStudents = rawStudents.filter(
              (student: Student) =>
                student.classroomId === classroom.id
            );

            const classroomAssignments =
              rawAssignments.filter(
                (assignment: any) =>
                  assignment.classroomId === classroom.id
              );

            const classroomVideos = rawVideos.filter(
              (video: any) =>
                video.classroomId === classroom.id ||
                video.classroom_id === classroom.id
            );

            return {
              id: classroom.id,
              name:
                classroom.name ||
                classroom.title ||
                'Unnamed Classroom',
              code:
                classroom.code ||
                classroom.classCode ||
                '',
              students:
                classroom.studentCount ??
                classroom.studentsCount ??
                classroomStudents.length,
              videos:
                classroom.videoCount ??
                classroom.videosCount ??
                classroomVideos.length,
              assignments:
                classroom.assignmentCount ??
                classroomAssignments.length,
              progress:
                Number(classroom.progress ?? 0),
            };
          });

        setClassrooms(normalizedClassrooms);
      } catch (error) {
        console.error(
          'Failed to load educator dashboard:',
          error
        );

        setVideos([]);
        setClassrooms([]);
        setStudents([]);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const firstName =
    user?.name?.split(' ')[0] || 'Educator';

  const totalStudents = students.length;

  const totalAssignments = assignments.length;

  const recentVideos = videos.slice(0, 4);

  const averageProgress =
    classrooms.length > 0
      ? Math.round(
          classrooms.reduce(
            (sum, classroom) =>
              sum + Number(classroom.progress || 0),
            0
          ) / classrooms.length
        )
      : 0;

  return (
    <div className="space-y-8 pb-16">

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.10] via-slate-900/80 to-blue-500/[0.08] p-8">

        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="absolute -left-20 -bottom-24 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 mb-4">

              <School className="w-3.5 h-3.5 text-emerald-400" />

              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Educator Workspace
              </span>

            </div>

            <h1 className="text-3xl font-black text-white">
              Welcome back, {firstName} 👋
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400 leading-6">
              Manage your classrooms, share learning content,
              and track how your students are progressing.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate('educator-classroom')
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Classroom
          </button>

        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          icon={<School className="w-5 h-5" />}
          label="My Classrooms"
          value={loading ? '—' : String(classrooms.length)}
          detail="Active classes"
          iconClass="text-emerald-400"
        />

        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Students"
          value={loading ? '—' : String(totalStudents)}
          detail="Across all classes"
          iconClass="text-blue-400"
        />

        <StatCard
          icon={<Video className="w-5 h-5" />}
          label="Learning Content"
          value={loading ? '—' : String(videos.length)}
          detail="Videos available"
          iconClass="text-purple-400"
        />

        <StatCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="Assignments"
          value={loading ? '—' : String(totalAssignments)}
          detail={
            loading
              ? 'Loading...'
              : 'Created assignments'
          }
          iconClass="text-amber-400"
        />

      </section>

      {/* CLASSROOMS */}
      <section className="space-y-4">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-lg font-black text-white">
              My Classrooms
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Your active teaching spaces
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate('educator-classroom')
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
          >
            View all
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

        </div>

        {loading ? (

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-xs text-slate-500">
            Loading classrooms...
          </div>

        ) : classrooms.length === 0 ? (

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">

            <School className="w-8 h-8 text-slate-700 mx-auto mb-3" />

            <p className="text-sm font-bold text-slate-300">
              No classrooms yet
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Create your first classroom to get started.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {classrooms.slice(0, 3).map(
              (classroom) => (

                <ClassroomCard
                  key={classroom.id}
                  classroom={classroom}
                  onOpen={() =>
                    onNavigate('educator-classroom')
                  }
                />

              )
            )}

          </div>

        )}

      </section>

      {/* LOWER SECTION */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* RECENT CONTENT */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

          <div className="flex items-center justify-between p-6 border-b border-slate-800">

            <div>

              <h2 className="text-sm font-black text-white">
                Recent Learning Content
              </h2>

              <p className="text-[11px] text-slate-500 mt-1">
                Latest videos available to your classes
              </p>

            </div>

            <Video className="w-4 h-4 text-purple-400" />

          </div>

          <div className="divide-y divide-slate-800/70">

            {loading ? (

              <div className="p-6 text-xs text-slate-500">
                Loading content...
              </div>

            ) : recentVideos.length === 0 ? (

              <div className="p-6">

                <BookOpen className="w-8 h-8 text-slate-700 mb-3" />

                <p className="text-xs font-bold text-slate-300">
                  No learning content yet
                </p>

                <p className="text-[11px] text-slate-500 mt-1">
                  Upload your first lecture video to get started.
                </p>

                <button
                  type="button"
                  onClick={() => onNavigate('educator-content')}
                  className="mt-4 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  Manage content →
                </button>

              </div>

            ) : (

              recentVideos.map((video) => (

                <div
                  key={video.id}
                  className="p-5 flex items-center gap-4 hover:bg-slate-950/40 transition-colors"
                >

                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">

                    <PlayCircle className="w-4 h-4 text-purple-400" />

                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-xs font-bold text-white truncate">
                      {video.title || 'Untitled video'}
                    </p>

                    <div className="flex items-center gap-2 mt-1">

                      <Clock3 className="w-3 h-3 text-slate-600" />

                      <span className="text-[10px] text-slate-500">
                        Learning resource
                      </span>

                    </div>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

        {/* STUDENT PROGRESS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

          <div className="flex items-center justify-between p-6 border-b border-slate-800">

            <div>

              <h2 className="text-sm font-black text-white">
                Student Progress
              </h2>

              <p className="text-[11px] text-slate-500 mt-1">
                Classroom progress from available data
              </p>

            </div>

            <TrendingUp className="w-4 h-4 text-emerald-400" />

          </div>

          <div className="p-6 space-y-6">

            {loading ? (

              <p className="text-xs text-slate-500">
                Loading progress...
              </p>

            ) : classrooms.length === 0 ? (

              <p className="text-xs text-slate-500">
                No classroom progress available yet.
              </p>

            ) : (

              classrooms.map((classroom) => (

                <div key={classroom.id}>

                  <div className="flex items-center justify-between mb-2">

                    <span className="text-xs font-bold text-slate-300">
                      {classroom.name}
                    </span>

                    <span className="text-xs font-black text-emerald-400">
                      {classroom.progress}%
                    </span>

                  </div>

                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">

                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all"
                      style={{
                        width: `${classroom.progress}%`,
                      }}
                    />

                  </div>

                  <p className="text-[10px] text-slate-600 mt-1.5">
                    {classroom.students} students enrolled
                  </p>

                </div>

              ))

            )}

          </div>

        </div>

      </section>

      {/* OVERALL PROGRESS */}
      {!loading && classrooms.length > 0 && (
        <div className="text-xs text-slate-500">
          Average classroom progress:{' '}
          <span className="font-bold text-emerald-400">
            {averageProgress}%
          </span>
        </div>
      )}

    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  iconClass: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  detail,
  iconClass,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

      <div
        className={`w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center ${iconClass}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-[10px] uppercase tracking-wider font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-600">
        {detail}
      </p>

    </div>
  );
};

/* =========================================================
   CLASSROOM CARD
========================================================= */

interface ClassroomCardProps {
  classroom: Classroom;
  onOpen: () => void;
}

const ClassroomCard: React.FC<ClassroomCardProps> = ({
  classroom,
  onOpen,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

      <div className="flex items-center justify-between">

        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">

          <School className="w-4 h-4 text-emerald-400" />

        </div>

        {classroom.code && (
          <span className="text-[10px] font-black text-slate-600">
            {classroom.code}
          </span>
        )}

      </div>

      <h3 className="mt-4 text-sm font-black text-white">
        {classroom.name}
      </h3>

      <div className="grid grid-cols-3 gap-2 mt-4">

        <MiniStat
          value={classroom.students}
          label="Students"
        />

        <MiniStat
          value={classroom.videos}
          label="Videos"
        />

        <MiniStat
          value={classroom.assignments}
          label="Assignments"
        />

      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-950 border border-slate-800 py-3 text-[10px] font-black text-slate-300 hover:text-white hover:border-emerald-500/30 transition-all"
      >
        Open Classroom
        <ArrowUpRight className="w-3.5 h-3.5" />
      </button>

    </div>
  );
};

const MiniStat: React.FC<{
  value: number;
  label: string;
}> = ({ value, label }) => {
  return (
    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">

      <p className="text-base font-black text-white">
        {value}
      </p>

      <p className="text-[8px] uppercase tracking-wider font-bold text-slate-600">
        {label}
      </p>

    </div>
  );
};