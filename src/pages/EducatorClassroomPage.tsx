import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BookOpen,
  Copy,
  Check,
  Plus,
  Search,
  RefreshCw,
  Users,
  Video,
  FileText,
  Trash2,
  X,
  ArrowLeft,
  GraduationCap,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { api } from '../services/api';

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

interface Student {
  id: string;
  name: string;
  email: string;
  classroomId: string;
  classroom: string;
  joinedAt?: string | null;
}

const EducatorClassroomPage: React.FC = () => {
  const [classrooms, setClassrooms] =
    useState<Classroom[]>([]);

  const [selectedClassroom, setSelectedClassroom] =
    useState<Classroom | null>(null);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [search, setSearch] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isCreating, setIsCreating] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [isLoadingStudents, setIsLoadingStudents] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [copiedCode, setCopiedCode] =
    useState<string | null>(null);

  const [classroomToDelete, setClassroomToDelete] =
    useState<Classroom | null>(null);

  const [newClassroom, setNewClassroom] =
    useState({
      name: '',
      description: '',
    });

  // =====================================================
  // LOAD CLASSROOMS
  // =====================================================

  const loadClassrooms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data =
        await api.getClassrooms();

      setClassrooms(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err: any) {
      console.error(
        'Failed to load classrooms:',
        err
      );

      setError(
        err?.message ||
          'Unable to load classrooms.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredClassrooms =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return classrooms;
      }

      return classrooms.filter(
        (classroom) =>
          classroom.name
            .toLowerCase()
            .includes(query) ||
          classroom.description
            ?.toLowerCase()
            .includes(query) ||
          classroom.code
            .toLowerCase()
            .includes(query)
      );
    }, [
      classrooms,
      search,
    ]);

  // =====================================================
  // CREATE CLASSROOM
  // =====================================================

  const handleCreateClassroom = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const name =
      newClassroom.name.trim();

    const description =
      newClassroom.description.trim();

    if (!name) {
      setError(
        'Classroom name is required.'
      );
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      await api.createClassroom({
        name,
        description,
      });

      setNewClassroom({
        name: '',
        description: '',
      });

      setShowCreateModal(false);

      await loadClassrooms();
    } catch (err: any) {
      console.error(
        'Failed to create classroom:',
        err
      );

      setError(
        err?.message ||
          'Unable to create classroom.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  // =====================================================
  // COPY CLASSROOM CODE
  // =====================================================

  const copyClassroomCode = async (
    code: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setCopiedCode(code);

      setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
    } catch (err) {
      console.error(
        'Failed to copy classroom code:',
        err
      );
    }
  };

  // =====================================================
  // DELETE CLASSROOM
  // =====================================================

  const handleDeleteClassroom = async () => {
    if (!classroomToDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      /*
       * The backend endpoint is:
       *
       * DELETE /classrooms/{classroom_id}
       *
       * If your api.ts does not yet contain this
       * function, add:
       *
       * deleteClassroom: (classroomId: string) =>
       *   fetchApi<{ message: string }>(
       *     `/classrooms/${classroomId}`,
       *     {
       *       method: 'DELETE',
       *     }
       *   ),
       */

      await api.deleteClassroom(
        classroomToDelete.id
      );

      if (
        selectedClassroom?.id ===
        classroomToDelete.id
      ) {
        setSelectedClassroom(null);
      }

      setClassroomToDelete(null);

      await loadClassrooms();
    } catch (err: any) {
      console.error(
        'Failed to delete classroom:',
        err
      );

      setError(
        err?.message ||
          'Unable to delete classroom.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // =====================================================
  // LOAD STUDENTS
  // =====================================================

  const loadStudents = async (
    classroomId: string
  ) => {
    try {
      setIsLoadingStudents(true);

      const data =
        await api.getEducatorStudents();

      const classroomStudents =
        (data || []).filter(
          (student) =>
            student.classroomId ===
            classroomId
        );

      setStudents(
        classroomStudents
      );
    } catch (err: any) {
      console.error(
        'Failed to load classroom students:',
        err
      );

      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // =====================================================
  // OPEN CLASSROOM
  // =====================================================

  const openClassroom = async (
    classroom: Classroom
  ) => {
    setSelectedClassroom(
      classroom
    );

    await loadStudents(
      classroom.id
    );
  };

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = () => {
    setSelectedClassroom(null);
    setStudents([]);
  };

  // =====================================================
  // CLASSROOM DETAILS
  // =====================================================

  if (selectedClassroom) {
    return (
      <div className="space-y-8 pb-16">

        {/* BACK */}

        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Classrooms
        </button>

        {/* HEADER */}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5">

                <BookOpen className="w-3.5 h-3.5 text-blue-400" />

                <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
                  Classroom
                </span>

              </div>

              <h1 className="text-3xl font-black text-white mt-4">
                {selectedClassroom.name}
              </h1>

              <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                {selectedClassroom.description ||
                  'No description provided.'}
              </p>

            </div>

            {/* CLASS CODE */}

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 min-w-[220px]">

              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                Classroom Code
              </p>

              <div className="flex items-center gap-3 mt-2">

                <p className="text-2xl font-black tracking-widest text-white">
                  {selectedClassroom.code}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    copyClassroomCode(
                      selectedClassroom.code
                    )
                  }
                  className="p-2 rounded-lg border border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                  title="Copy classroom code"
                >
                  {copiedCode ===
                  selectedClassroom.code ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

              </div>

              <p className="text-[10px] text-slate-500 mt-2">
                Share this code with your students.
              </p>

            </div>

          </div>

        </div>

        {/* STATISTICS */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <StatCard
            icon={
              <Users className="w-5 h-5 text-blue-400" />
            }
            label="Students"
            value={String(
              selectedClassroom.students || 0
            )}
          />

          <StatCard
            icon={
              <Video className="w-5 h-5 text-purple-400" />
            }
            label="Videos"
            value={String(
              selectedClassroom.videos || 0
            )}
          />

          <StatCard
            icon={
              <FileText className="w-5 h-5 text-emerald-400" />
            }
            label="Assignments"
            value={String(
              selectedClassroom.assignments || 0
            )}
          />

        </div>

        {/* STUDENTS */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

          <div className="p-5 border-b border-slate-800 flex items-center justify-between">

            <div>

              <h2 className="text-sm font-black text-white">
                Enrolled Students
              </h2>

              <p className="text-[10px] text-slate-500 mt-1">
                Students who joined using this classroom code.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                loadStudents(
                  selectedClassroom.id
                )
              }
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isLoadingStudents
                    ? 'animate-spin'
                    : ''
                }`}
              />
            </button>

          </div>

          {isLoadingStudents ? (

            <div className="py-14 text-center">

              <Loader2 className="w-6 h-6 mx-auto text-blue-400 animate-spin" />

              <p className="text-xs text-slate-500 mt-3">
                Loading students...
              </p>

            </div>

          ) : students.length === 0 ? (

            <div className="py-14 text-center">

              <GraduationCap className="w-10 h-10 mx-auto text-slate-700" />

              <p className="text-sm font-bold text-slate-300 mt-4">
                No students joined yet
              </p>

              <p className="text-xs text-slate-600 mt-1">
                Share the classroom code with your students.
              </p>

              <button
                type="button"
                onClick={() =>
                  copyClassroomCode(
                    selectedClassroom.code
                  )
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500"
              >
                <Copy className="w-4 h-4" />
                Copy Join Code
              </button>

            </div>

          ) : (

            <div className="divide-y divide-slate-800/70">

              {students.map(
                (student) => (

                  <div
                    key={`${student.classroomId}-${student.id}`}
                    className="p-5 flex items-center gap-4"
                  >

                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">

                      <GraduationCap className="w-4 h-4 text-blue-400" />

                    </div>

                    <div className="flex-1 min-w-0">

                      <p className="text-xs font-bold text-white truncate">
                        {student.name}
                      </p>

                      <p className="text-[10px] text-slate-500 truncate mt-1">
                        {student.email}
                      </p>

                    </div>

                    <div className="hidden sm:block text-right">

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

          )}

        </div>

        {/* DANGER ZONE */}

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <p className="text-xs font-black text-red-300">
                Delete Classroom
              </p>

              <p className="text-[10px] text-red-400/70 mt-1">
                Delete this classroom permanently.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setClassroomToDelete(
                  selectedClassroom
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete Classroom
            </button>

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN CLASSROOM PAGE
  // =====================================================

  return (
    <div className="space-y-8 pb-16">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 mb-4">

            <BookOpen className="w-3.5 h-3.5 text-blue-400" />

            <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
              Classroom Management
            </span>

          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white">
            My Classrooms
          </h1>

          <p className="text-xs text-slate-400 mt-2">
            Create classrooms, share join codes, and manage your students.
          </p>

        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateModal(true);
            setError(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/10 hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Create Classroom
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">

          <div className="flex items-center gap-3">

            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />

            <div className="flex-1">

              <p className="text-xs font-bold text-red-300">
                Something went wrong
              </p>

              <p className="text-[10px] text-red-400/80 mt-1">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>

          </div>

        </div>
      )}

      {/* SEARCH + REFRESH */}

      <div className="flex flex-col sm:flex-row gap-3">

        <div className="relative flex-1">

          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search classrooms..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-11 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40"
          />

        </div>

        <button
          type="button"
          onClick={loadClassrooms}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs font-bold text-slate-400 hover:text-white"
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

      {/* LOADING */}

      {isLoading ? (

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-20 text-center">

          <Loader2 className="w-7 h-7 mx-auto text-blue-400 animate-spin" />

          <p className="text-xs text-slate-500 mt-3">
            Loading classrooms...
          </p>

        </div>

      ) : filteredClassrooms.length === 0 ? (

        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 py-20 text-center">

          <BookOpen className="w-12 h-12 mx-auto text-slate-700" />

          <h2 className="text-lg font-black text-slate-300 mt-5">
            {classrooms.length === 0
              ? 'No classrooms yet'
              : 'No classrooms found'}
          </h2>

          <p className="text-xs text-slate-600 mt-2">
            {classrooms.length === 0
              ? 'Create your first classroom to start teaching.'
              : 'Try another search term.'}
          </p>

          {classrooms.length === 0 && (
            <button
              type="button"
              onClick={() =>
                setShowCreateModal(true)
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-500"
            >
              <Plus className="w-4 h-4" />
              Create Classroom
            </button>
          )}

        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {filteredClassrooms.map(
            (classroom) => (

              <div
                key={classroom.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-blue-500/30 transition"
              >

                <div className="p-5">

                  <div className="flex items-start justify-between gap-4">

                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">

                      <BookOpen className="w-5 h-5 text-blue-400" />

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setClassroomToDelete(
                          classroom
                        )
                      }
                      className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete classroom"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                  <h2 className="text-lg font-black text-white mt-5">
                    {classroom.name}
                  </h2>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[32px]">
                    {classroom.description ||
                      'No description provided.'}
                  </p>

                  {/* CODE */}

                  <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-[9px] uppercase tracking-wider font-bold text-slate-600">
                          Join Code
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
                        className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
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

                  {/* STATS */}

                  <div className="grid grid-cols-3 gap-2 mt-4">

                    <MiniStat
                      icon={
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                      }
                      value={
                        classroom.students
                      }
                      label="Students"
                    />

                    <MiniStat
                      icon={
                        <Video className="w-3.5 h-3.5 text-purple-400" />
                      }
                      value={
                        classroom.videos
                      }
                      label="Videos"
                    />

                    <MiniStat
                      icon={
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      }
                      value={
                        classroom.assignments
                      }
                      label="Tasks"
                    />

                  </div>

                  {/* OPEN */}

                  <button
                    type="button"
                    onClick={() =>
                      openClassroom(
                        classroom
                      )
                    }
                    className="w-full mt-5 rounded-xl bg-slate-800 hover:bg-blue-600 py-3 text-xs font-bold text-slate-200 hover:text-white transition"
                  >
                    Manage Classroom
                  </button>

                </div>

              </div>

            )
          )}

        </div>

      )}

      {/* CREATE MODAL */}

      {showCreateModal && (

        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">

          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0B1020] shadow-2xl">

            <div className="p-6 border-b border-slate-800 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-black text-white">
                  Create Classroom
                </h2>

                <p className="text-[10px] text-slate-500 mt-1">
                  Create a classroom and receive a unique join code.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                disabled={isCreating}
                className="p-2 rounded-lg text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            <form
              onSubmit={
                handleCreateClassroom
              }
              className="p-6 space-y-5"
            >

              <div>

                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Classroom Name
                </label>

                <input
                  value={
                    newClassroom.name
                  }
                  onChange={(event) =>
                    setNewClassroom(
                      (previous) => ({
                        ...previous,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="e.g. Data Structures"
                  disabled={isCreating}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />

              </div>

              <div>

                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Description
                </label>

                <textarea
                  value={
                    newClassroom.description
                  }
                  onChange={(event) =>
                    setNewClassroom(
                      (previous) => ({
                        ...previous,
                        description:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Describe this classroom..."
                  rows={4}
                  disabled={isCreating}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />

              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                <p className="text-[10px] font-bold text-blue-300">
                  Classroom code
                </p>

                <p className="text-[10px] text-slate-500 mt-1">
                  A unique join code will automatically be generated when you create the classroom.
                </p>

              </div>

              <button
                type="submit"
                disabled={
                  isCreating ||
                  !newClassroom.name.trim()
                }
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-xs font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >

                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Classroom
                  </>
                )}

              </button>

            </form>

          </div>

        </div>

      )}

      {/* DELETE CONFIRMATION */}

      {classroomToDelete && (

        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">

          <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#0B1020] p-6">

            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">

              <Trash2 className="w-5 h-5 text-red-400" />

            </div>

            <h2 className="text-lg font-black text-white mt-5">
              Delete Classroom?
            </h2>

            <p className="text-xs text-slate-400 mt-2">
              Are you sure you want to delete{' '}
              <span className="font-bold text-white">
                {classroomToDelete.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex gap-3 mt-6">

              <button
                type="button"
                onClick={() =>
                  setClassroomToDelete(
                    null
                  )
                }
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-slate-800 py-3 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteClassroom
                }
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >

                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

// =====================================================
// STAT CARD
// =====================================================

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({
  icon,
  label,
  value,
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

    <div className="flex items-center gap-3">

      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center">
        {icon}
      </div>

      <div>

        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
          {label}
        </p>

        <p className="text-xl font-black text-white mt-1">
          {value}
        </p>

      </div>

    </div>

  </div>
);

// =====================================================
// MINI STAT
// =====================================================

const MiniStat: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
}> = ({
  icon,
  value,
  label,
}) => (
  <div className="rounded-xl bg-slate-950 p-3">

    {icon}

    <p className="text-sm font-black text-white mt-1">
      {value || 0}
    </p>

    <p className="text-[9px] text-slate-600">
      {label}
    </p>

  </div>
);

export default EducatorClassroomPage;