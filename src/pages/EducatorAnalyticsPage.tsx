import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Loader2,
  RefreshCw,
  Users,
  Video,
} from 'lucide-react';
import { api } from '../services/api';

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  students: number;
  videos: number;
  assignments: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  classroomId: string;
  classroom: string;
  joinedAt?: string | null;
}

interface Assignment {
  id: string;
  classroomId: string;
  classroom: string | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status?: string;
}

export const EducatorAnalyticsPage: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>(
    []
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        classroomData,
        studentData,
        assignmentData,
      ] = await Promise.all([
        api.getClassrooms(),
        api.getEducatorStudents(),
        api.getEducatorAssignments(),
      ]);

      setClassrooms(classroomData);
      setStudents(studentData);
      setAssignments(assignmentData);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          'Unable to load analytics.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totalVideos = useMemo(
    () =>
      classrooms.reduce(
        (total, classroom) =>
          total + Number(classroom.videos || 0),
        0
      ),
    [classrooms]
  );

  const classroomStats = useMemo(() => {
    return classrooms.map((classroom) => {
      const realStudents = students.filter(
        (student) =>
          student.classroomId === classroom.id
      ).length;

      const realAssignments =
        assignments.filter(
          (assignment) =>
            assignment.classroomId === classroom.id
        ).length;

      return {
        ...classroom,
        realStudents,
        realAssignments,
      };
    });
  }, [classrooms, students, assignments]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-cyan-400">
            <BarChart3 className="w-3.5 h-3.5" />
            Class Performance
          </div>

          <h1 className="mt-4 text-3xl font-black text-white">
            Class Analytics
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Real-time overview of your classrooms, students,
            videos and assignments.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* REAL TOTALS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users />}
          label="Students"
          value={students.length}
          description="Students enrolled"
        />

        <MetricCard
          icon={<BookOpen />}
          label="Classrooms"
          value={classrooms.length}
          description="Active classrooms"
        />

        <MetricCard
          icon={<Video />}
          label="Videos"
          value={totalVideos}
          description="Shared classroom videos"
        />

        <MetricCard
          icon={<ClipboardList />}
          label="Assignments"
          value={assignments.length}
          description="Created assignments"
        />
      </div>

      {/* CLASSROOM PERFORMANCE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50">
        <div className="border-b border-slate-800 p-6">
          <h2 className="font-black text-white">
            Classroom Breakdown
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Data is calculated from the classrooms, students
            and assignments returned by the backend.
          </p>
        </div>

        {classroomStats.length === 0 ? (
          <div className="p-14 text-center text-sm text-slate-500">
            No classroom data available.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {classroomStats.map((classroom) => {
              const studentCount =
                classroom.realStudents ||
                classroom.students ||
                0;

              const maxStudents = Math.max(
                ...classroomStats.map(
                  (item) =>
                    item.realStudents ||
                    item.students ||
                    0
                ),
                1
              );

              const percentage =
                (studentCount /
                  maxStudents) *
                100;

              return (
                <div
                  key={classroom.id}
                  className="p-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-white">
                          {classroom.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {classroom.code}
                        </p>
                      </div>

                      <span className="text-xs font-black text-cyan-400">
                        {studentCount} students
                      </span>
                    </div>

                    {/* STUDENT DISTRIBUTION */}
                    <div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* REAL COUNTS */}
                    <div className="grid grid-cols-3 gap-3">
                      <BreakdownStat
                        label="Students"
                        value={studentCount}
                      />

                      <BreakdownStat
                        label="Videos"
                        value={
                          classroom.videos || 0
                        }
                      />

                      <BreakdownStat
                        label="Assignments"
                        value={
                          classroom.realAssignments
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXPLANATION */}
      <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-5">
        <div className="flex gap-3">
          <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />

          <div>
            <h3 className="font-bold text-white">
              Analytics data status
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Student counts, classroom counts, video counts
              and assignment counts are connected to the
              backend. Progress and completion percentages
              are intentionally not displayed because the
              current backend does not provide student
              progress or assignment-submission data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================= */

const MetricCard = ({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
    <div className="flex items-center justify-between">
      <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
        {icon}
      </div>
    </div>

    <p className="mt-5 text-[10px] font-black uppercase tracking-wider text-slate-500">
      {label}
    </p>

    <p className="mt-2 text-3xl font-black text-white">
      {value}
    </p>

    <p className="mt-1 text-xs text-slate-600">
      {description}
    </p>
  </div>
);

const BreakdownStat = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
    <p className="text-[9px] font-black uppercase tracking-wider text-slate-600">
      {label}
    </p>

    <p className="mt-1 text-lg font-black text-white">
      {value}
    </p>
  </div>
);

export default EducatorAnalyticsPage;