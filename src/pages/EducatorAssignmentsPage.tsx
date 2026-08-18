import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Clock3,
  CheckCircle2,
  X,
  Loader2,
  Pencil,
  Trash2,
  Video,
  CalendarDays,
  Users,
  AlertCircle,
} from 'lucide-react';

import { api, Classroom, EducatorAssignment, ClassroomVideo } from '../services/api';

type FormMode = 'create' | 'edit';

interface AssignmentForm {
  title: string;
  description: string;
  classroomId: string;
  dueDate: string;
  videoId: string;
}

const emptyForm: AssignmentForm = {
  title: '',
  description: '',
  classroomId: '',
  dueDate: '',
  videoId: '',
};

const toDateInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const getStatus = (assignment: EducatorAssignment) => {
  if (assignment.status) return assignment.status;

  if (assignment.dueDate) {
    const due = new Date(assignment.dueDate).getTime();
    if (!Number.isNaN(due) && due < Date.now()) return 'Overdue';
  }

  return 'Active';
};

export const EducatorAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<EducatorAssignment[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [videos, setVideos] = useState<ClassroomVideo[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assignmentData, classroomData, videoData] = await Promise.all([
        api.getEducatorAssignments(),
        api.getClassrooms(),
        api.getVideos(),
      ]);

      setAssignments(Array.isArray(assignmentData) ? assignmentData : []);
      setClassrooms(Array.isArray(classroomData) ? classroomData : []);

      /*
       * getVideos() returns the educator's real uploaded videos.
       * Normalize them to the small shape required by the selector.
       */
      setVideos(
        Array.isArray(videoData)
          ? (videoData as any[]).map((video) => ({
              id: video.id,
              title: video.title,
              description: video.description,
              fileUrl: video.fileUrl || '',
              thumbnailUrl: video.thumbnailUrl,
              duration: video.duration,
              size: video.size,
              status: video.status,
              progress: video.progress,
              category: video.category,
              viewsCount: video.viewsCount,
              createdAt: video.createdAt,
            }))
          : [],
      );
    } catch (err: any) {
      console.error('Failed to load assignments:', err);
      setError(err?.message || 'Unable to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMode('create');
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (assignment: EducatorAssignment) => {
    setError(null);
    setSuccess(null);
    setMode('edit');
    setEditingId(assignment.id);

    setForm({
      title: assignment.title || '',
      description: assignment.description || '',
      classroomId: assignment.classroomId || '',
      dueDate: toDateInput(assignment.dueDate),
      videoId: assignment.videoId || '',
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError('Please enter an assignment title.');
      return;
    }

    if (!form.classroomId) {
      setError('Please select a classroom.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        classroomId: form.classroomId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        dueDate: form.dueDate || null,
        videoId: form.videoId || null,
      };

      if (mode === 'edit' && editingId) {
        await api.updateEducatorAssignment(editingId, payload);
        setSuccess('Assignment updated successfully.');
      } else {
        await api.createEducatorAssignment(payload);
        setSuccess('Assignment created successfully.');
      }

      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      console.error('Failed to save assignment:', err);
      setError(err?.message || 'Unable to save assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignment: EducatorAssignment) => {
    const confirmed = window.confirm(
      `Delete "${assignment.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(assignment.id);
      setError(null);
      setSuccess(null);

      await api.deleteEducatorAssignment(assignment.id);

      setAssignments((current) =>
        current.filter((item) => item.id !== assignment.id),
      );

      setSuccess('Assignment deleted successfully.');
    } catch (err: any) {
      console.error('Failed to delete assignment:', err);
      setError(err?.message || 'Unable to delete assignment.');
    } finally {
      setDeletingId(null);
    }
  };

  const selectedClassroom = useMemo(
    () => classrooms.find((classroom) => classroom.id === form.classroomId),
    [classrooms, form.classroomId],
  );

  const availableVideos = useMemo(() => {
    /*
     * Only use real uploaded videos returned by the backend.
     * Do not create fake/demo video entries.
     */
    return videos.filter(
      (video) =>
        !video.status ||
        video.status === 'COMPLETED' ||
        video.progress === 100,
    );
  }, [videos]);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 mb-4">
            <ClipboardList className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-300">
              Coursework
            </span>
          </div>

          <h1 className="text-2xl font-black text-white">
            Assignments
          </h1>

          <p className="text-xs text-slate-400 mt-2">
            Create, edit and manage assignments for your real classrooms.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3 text-xs font-black text-white hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && !showModal && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-orange-400 mx-auto" />
          <p className="mt-3 text-xs text-slate-500">
            Loading real assignments...
          </p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <ClipboardList className="w-10 h-10 text-slate-700 mx-auto mb-4" />
          <h3 className="text-sm font-black text-slate-300">
            No assignments yet
          </h3>
          <p className="text-xs text-slate-500 mt-2">
            Create an assignment for one of your real classrooms.
          </p>

          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-white"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {assignments.map((assignment) => {
            const status = getStatus(assignment);
            const classroom =
              assignment.classroom ||
              classrooms.find(
                (classroom) =>
                  classroom.id === assignment.classroomId,
              )?.name ||
              'Classroom';

            const videoTitle =
              assignment.videoTitle ||
              availableVideos.find(
                (video) => video.id === assignment.videoId,
              )?.title;

            const isDeleting = deletingId === assignment.id;

            return (
              <div
                key={assignment.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-orange-500/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white">
                      {assignment.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Users className="w-3 h-3" />
                        {classroom}
                      </span>

                      {videoTitle && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-cyan-400">
                          <Video className="w-3 h-3" />
                          {videoTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black border ${
                      status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : status === 'Overdue'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                {assignment.description && (
                  <p className="mt-4 text-xs text-slate-500 leading-5">
                    {assignment.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-5 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="w-3.5 h-3.5 text-orange-400" />
                    {assignment.dueDate
                      ? `Due ${new Date(
                          assignment.dueDate,
                        ).toLocaleDateString()}`
                      : 'No due date'}
                  </span>

                  {assignment.createdAt && (
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Created{' '}
                      {new Date(
                        assignment.createdAt,
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-5 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => openEdit(assignment)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(assignment)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-[10px] font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#0A1020] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-black text-white">
                  {mode === 'edit'
                    ? 'Edit Assignment'
                    : 'Create Assignment'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  {mode === 'edit'
                    ? 'Update the real assignment stored in the backend.'
                    : 'Create coursework for one of your real classrooms.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-4"
            >
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-3 text-[11px] text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Title
                </label>

                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  placeholder="e.g. REST API Practice"
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Classroom
                </label>

                <select
                  value={form.classroomId}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      classroomId: e.target.value,
                      videoId: '',
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50"
                  required
                >
                  <option value="">Select classroom</option>

                  {classrooms.map((classroom) => (
                    <option
                      key={classroom.id}
                      value={classroom.id}
                    >
                      {classroom.name}
                      {classroom.code
                        ? ` (${classroom.code})`
                        : ''}
                    </option>
                  ))}
                </select>

                {selectedClassroom && (
                  <p className="mt-2 text-[10px] text-slate-600">
                    Classroom ID: {selectedClassroom.id}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Video
                  <span className="ml-1 normal-case font-normal text-slate-600">
                    optional
                  </span>
                </label>

                <select
                  value={form.videoId}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      videoId: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50"
                >
                  <option value="">
                    No video attached
                  </option>

                  {availableVideos.map((video) => (
                    <option
                      key={video.id}
                      value={video.id}
                    >
                      {video.title}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-[10px] text-slate-600">
                  Only real completed videos from your content library are
                  listed. The backend will validate the selected video.
                </p>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Describe the assignment..."
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none resize-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Due Date
                </label>

                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      dueDate: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3 text-xs font-black text-white disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {mode === 'edit'
                        ? 'Saving...'
                        : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {mode === 'edit' ? (
                        <Pencil className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {mode === 'edit'
                        ? 'Save Changes'
                        : 'Create Assignment'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducatorAssignmentsPage;