import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Users,
  Search,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  UserPlus,
  Copy,
  Check,
  X,
  BookOpen,
  ChevronDown,
} from 'lucide-react';

import { api } from '../services/api';

interface Student {
  id: string;
  name: string;
  email: string;
  classroomId: string;
  classroom: string;
  joinedAt?: string | null;
}

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  educatorId: string;
  educatorName?: string;
  students: number;
  videos: number;
  assignments: number;
  createdAt: string;
  updatedAt?: string;
}

export const EducatorStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const [search, setSearch] = useState('');
  const [selectedClassroom, setSelectedClassroom] =
    useState('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClassrooms, setIsLoadingClassrooms] =
    useState(true);

  const [error, setError] = useState<string | null>(null);

  const [showInviteModal, setShowInviteModal] =
    useState(false);

  const [copiedCode, setCopiedCode] =
    useState<string | null>(null);

  /* =====================================================
     LOAD STUDENTS
  ===================================================== */

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await api.getEducatorStudents();

      setStudents(data || []);
    } catch (err: any) {
      console.error(
        'Failed to load educator students:',
        err
      );

      setError(
        err?.message ||
          'Unable to load students.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================================================
     LOAD CLASSROOMS
  ===================================================== */

  const loadClassrooms = async () => {
    try {
      setIsLoadingClassrooms(true);

      const data = await api.getClassrooms();

      setClassrooms(data || []);
    } catch (err: any) {
      console.error(
        'Failed to load educator classrooms:',
        err
      );

      /*
       * Do not replace the students error.
       * The student page can still work if classrooms
       * fail temporarily.
       */
    } finally {
      setIsLoadingClassrooms(false);
    }
  };

  /* =====================================================
     LOAD EVERYTHING
  ===================================================== */

  const loadData = async () => {
    await Promise.all([
      loadStudents(),
      loadClassrooms(),
    ]);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =====================================================
     FILTER STUDENTS
  ===================================================== */

  const filteredStudents = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return students.filter((student) => {
      const matchesClassroom =
        selectedClassroom === 'ALL' ||
        student.classroomId === selectedClassroom;

      if (!matchesClassroom) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        student.name,
        student.email,
        student.classroom,
      ].some((value) =>
        (value || '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [
    students,
    search,
    selectedClassroom,
  ]);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalStudents = students.length;

  const classroomCount = new Set(
    students.map(
      (student) => student.classroomId
    )
  ).size;

  const latestJoined = students
    .map((student) =>
      student.joinedAt
        ? new Date(
            student.joinedAt
          ).getTime()
        : 0
    )
    .filter((value) => value > 0)
    .sort((a, b) => b - a)[0];

  const latestJoinedText = latestJoined
    ? new Date(
        latestJoined
      ).toLocaleDateString()
    : 'No data';

  /* =====================================================
     COPY CLASSROOM CODE
  ===================================================== */

  const copyClassroomCode = async (
    code: string
  ) => {
    try {
      await navigator.clipboard.writeText(code);

      setCopiedCode(code);

      setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
    } catch (error) {
      console.error(
        'Failed to copy classroom code:',
        error
      );
    }
  };

  /* =====================================================
     SELECTED CLASSROOM
  ===================================================== */

  const selectedClassroomData =
    classrooms.find(
      (classroom) =>
        classroom.id === selectedClassroom
    );

  return (
    <div className="space-y-8 pb-16">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 mb-4">

            <Users className="w-3.5 h-3.5 text-blue-400" />

            <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
              Student Management
            </span>

          </div>

          <h1 className="text-2xl font-black text-white">
            Students
          </h1>

          <p className="text-xs text-slate-400 mt-2">
            Manage students enrolled in your classrooms.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            setShowInviteModal(true)
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add Students
        </button>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">

          <div className="flex items-center gap-3">

            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />

            <div className="flex-1">

              <p className="text-xs font-bold text-red-300">
                Unable to load students
              </p>

              <p className="text-[10px] text-red-400/80 mt-1">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-[10px] font-bold text-red-300 hover:bg-red-500/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>

          </div>

        </div>
      )}


      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Stat
          label="Total Students"
          value={String(totalStudents)}
          detail="Currently enrolled"
        />

        <Stat
          label="Classrooms"
          value={String(classroomCount)}
          detail="With enrolled students"
        />

        <Stat
          label="Latest Enrollment"
          value={latestJoinedText}
          detail="Most recent join date"
        />

      </div>


      {/* =================================================
          CLASSROOM INVITE / CODES
      ================================================= */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div>

            <div className="flex items-center gap-2">

              <BookOpen className="w-4 h-4 text-blue-400" />

              <h2 className="text-sm font-bold text-white">
                Classroom Join Codes
              </h2>

            </div>

            <p className="text-[10px] text-slate-500 mt-1">
              Share a classroom code with students so they
              can join your class.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setShowInviteModal(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-[10px] font-bold text-blue-300 hover:bg-blue-500/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Students
          </button>

        </div>


        {isLoadingClassrooms ? (

          <div className="py-10 text-center">

            <RefreshCw className="w-5 h-5 mx-auto text-blue-400 animate-spin" />

            <p className="text-xs text-slate-500 mt-3">
              Loading classrooms...
            </p>

          </div>

        ) : classrooms.length === 0 ? (

          <div className="py-12 text-center px-6">

            <BookOpen className="w-9 h-9 mx-auto text-slate-700 mb-3" />

            <p className="text-sm font-bold text-slate-300">
              No classrooms yet
            </p>

            <p className="text-xs text-slate-600 mt-1">
              Create a classroom first, then share its
              join code with students.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-800/70">

            {classrooms.map((classroom) => (

              <div
                key={classroom.id}
                className="p-5 flex flex-col lg:flex-row lg:items-center gap-5"
              >

                {/* CLASSROOM INFO */}

                <div className="flex items-center gap-3 flex-1 min-w-0">

                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">

                    <BookOpen className="w-4 h-4 text-blue-400" />

                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-bold text-white truncate">
                      {classroom.name}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      {classroom.description ||
                        'Classroom'}
                    </p>

                  </div>

                </div>


                {/* CODE */}

                <div className="flex items-center gap-3">

                  <div>

                    <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                      Classroom Code
                    </p>

                    <p className="text-sm font-black tracking-widest text-blue-300 mt-1">
                      {classroom.code}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyClassroomCode(
                        classroom.code
                      )
                    }
                    className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-950/60 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/40 transition-colors"
                    title="Copy classroom code"
                  >

                    {copiedCode ===
                    classroom.code ? (

                      <Check className="w-4 h-4 text-emerald-400" />

                    ) : (

                      <Copy className="w-4 h-4" />

                    )}

                  </button>

                </div>


                {/* STUDENT COUNT */}

                <div className="min-w-[100px]">

                  <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                    Students
                  </p>

                  <p className="text-sm font-black text-white mt-1">
                    {classroom.students ?? 0}
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>


      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

        <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row gap-3">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search students by name, email or classroom..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-11 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />

          </div>


          {/* CLASSROOM FILTER */}

          <div className="relative lg:w-64">

            <select
              value={selectedClassroom}
              onChange={(event) =>
                setSelectedClassroom(
                  event.target.value
                )
              }
              className="appearance-none w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 pr-10 text-xs text-white focus:outline-none focus:border-blue-500/50"
            >

              <option value="ALL">
                All Classrooms
              </option>

              {classrooms.map(
                (classroom) => (
                  <option
                    key={classroom.id}
                    value={classroom.id}
                  >
                    {classroom.name}
                  </option>
                )
              )}

            </select>

            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />

          </div>


          {/* REFRESH */}

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-50"
          >

            <RefreshCw
              className={`w-4 h-4 ${
                isLoading
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh

          </button>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {isLoading ? (

          <div className="py-16 text-center">

            <RefreshCw className="w-6 h-6 mx-auto text-blue-400 animate-spin" />

            <p className="text-xs text-slate-500 mt-3">
              Loading students...
            </p>

          </div>

        ) : filteredStudents.length === 0 ? (

          <div className="py-16 text-center">

            <GraduationCap className="w-10 h-10 mx-auto text-slate-700 mb-3" />

            <p className="text-sm font-bold text-slate-300">

              {students.length === 0
                ? 'No students enrolled'
                : 'No students found'}

            </p>

            <p className="text-xs text-slate-600 mt-1">

              {students.length === 0
                ? 'Students who join your classrooms will appear here automatically.'
                : 'Try another search or classroom filter.'}

            </p>

            {students.length === 0 &&
              classrooms.length > 0 && (

                <button
                  type="button"
                  onClick={() =>
                    setShowInviteModal(true)
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500"
                >

                  <UserPlus className="w-4 h-4" />

                  Invite Students

                </button>

              )}

          </div>

        ) : (

          <div>

            {/* TABLE HEADER */}

            <div className="hidden md:grid grid-cols-[1fr_180px_140px] gap-4 px-5 py-3 bg-slate-950/40 border-b border-slate-800">

              <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                Student
              </p>

              <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                Classroom
              </p>

              <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold text-right">
                Joined
              </p>

            </div>


            {/* STUDENTS */}

            <div className="divide-y divide-slate-800/70">

              {filteredStudents.map(
                (student) => (

                  <div
                    key={`${student.classroomId}-${student.id}`}
                    className="p-5 flex items-center gap-4"
                  >

                    {/* AVATAR */}

                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">

                      <GraduationCap className="w-4 h-4 text-blue-400" />

                    </div>


                    {/* STUDENT */}

                    <div className="flex-1 min-w-0">

                      <p className="text-xs font-bold text-white truncate">
                        {student.name}
                      </p>

                      <p className="text-[10px] text-slate-500 truncate mt-1">
                        {student.email}
                      </p>

                    </div>


                    {/* CLASSROOM */}

                    <div className="hidden sm:block min-w-[160px]">

                      <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                        Classroom
                      </p>

                      <p className="text-[10px] text-slate-300 mt-1 truncate">
                        {student.classroom}
                      </p>

                    </div>


                    {/* JOINED */}

                    <div className="hidden md:block min-w-[110px] text-right">

                      <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                        Joined
                      </p>

                      <p className="text-[10px] text-slate-400 mt-1">

                        {student.joinedAt
                          ? new Date(
                              student.joinedAt
                            ).toLocaleDateString()
                          : '—'}

                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        )}

      </div>


      {/* =================================================
          INVITE STUDENTS MODAL
      ================================================= */}

      {showInviteModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setShowInviteModal(false);
            }

          }}
        >

          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#0B1020] shadow-2xl shadow-black/50 overflow-hidden">

            {/* MODAL HEADER */}

            <div className="p-6 border-b border-slate-800 flex items-start justify-between">

              <div>

                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">

                  <UserPlus className="w-5 h-5 text-blue-400" />

                </div>

                <h2 className="text-lg font-black text-white">
                  Invite Students
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Share a classroom code with your students.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowInviteModal(false)
                }
                className="w-9 h-9 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800"
              >

                <X className="w-4 h-4" />

              </button>

            </div>


            {/* MODAL CONTENT */}

            <div className="p-6 space-y-4">

              {classrooms.length === 0 ? (

                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8 text-center">

                  <BookOpen className="w-8 h-8 mx-auto text-slate-700 mb-3" />

                  <p className="text-sm font-bold text-slate-300">
                    No classrooms available
                  </p>

                  <p className="text-xs text-slate-600 mt-1">
                    Create a classroom before inviting students.
                  </p>

                </div>

              ) : (

                <>
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                    <p className="text-xs font-bold text-blue-300">
                      How students join
                    </p>

                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Select a classroom below, copy its
                      code, and share it with your students.
                      Students can enter the code from
                      their learner account to join the
                      classroom. Once they join, they will
                      automatically appear in your Students
                      list.
                    </p>

                  </div>


                  {classrooms.map(
                    (classroom) => (

                      <div
                        key={classroom.id}
                        className={`rounded-2xl border p-5 transition-colors ${
                          selectedClassroom ===
                          classroom.id
                            ? 'border-blue-500/40 bg-blue-500/5'
                            : 'border-slate-800 bg-slate-950/40'
                        }`}
                      >

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                          <div className="flex-1 min-w-0">

                            <p className="text-sm font-bold text-white truncate">
                              {classroom.name}
                            </p>

                            <p className="text-[10px] text-slate-500 mt-1">
                              {classroom.students ?? 0}{' '}
                              student
                              {(classroom.students ??
                                0) === 1
                                ? ''
                                : 's'}
                            </p>

                          </div>


                          <div className="flex items-center gap-3">

                            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5">

                              <p className="text-[8px] uppercase tracking-widest text-slate-600 font-bold">
                                Join Code
                              </p>

                              <p className="text-sm font-black tracking-[0.2em] text-blue-300 mt-1">
                                {classroom.code}
                              </p>

                            </div>


                            <button
                              type="button"
                              onClick={() =>
                                copyClassroomCode(
                                  classroom.code
                                )
                              }
                              className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/40"
                              title="Copy code"
                            >

                              {copiedCode ===
                              classroom.code ? (

                                <Check className="w-4 h-4 text-emerald-400" />

                              ) : (

                                <Copy className="w-4 h-4" />

                              )}

                            </button>

                          </div>

                        </div>

                      </div>

                    )
                  )}
                </>

              )}

            </div>


            {/* MODAL FOOTER */}

            <div className="p-5 border-t border-slate-800 flex justify-end">

              <button
                type="button"
                onClick={() =>
                  setShowInviteModal(false)
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Done
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};


/* =========================================================
   STAT COMPONENT
========================================================= */

const Stat: React.FC<{
  label: string;
  value: string;
  detail: string;
}> = ({
  label,
  value,
  detail,
}) => (

  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
      {label}
    </p>

    <p className="text-2xl font-black text-white mt-2">
      {value}
    </p>

    <p className="text-[10px] text-slate-600 mt-1">
      {detail}
    </p>

  </div>

);