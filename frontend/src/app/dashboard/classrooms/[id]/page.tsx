"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';
import { useAuth } from '@/context/AuthContext';
import { Users2, ArrowLeft, Trash2, Plus, Play, BarChart3, Eye, Bookmark as BookmarkIcon, GraduationCap } from 'lucide-react';

interface Student {
  id: string;
  username: string;
  email: string;
  joined_at: string;
}
interface ClassroomVideo {
  id: number;
  title: string;
  status: string;
  added_at: string;
}
interface ClassroomDetail {
  id: number;
  name: string;
  educator_id: string;
  educator_username: string | null;
  students: Student[];
  videos: ClassroomVideo[];
}
interface VideoOption {
  id: number;
  title: string;
  filename: string;
}
interface VideoAnalytics {
  video_id: number;
  video_title: string;
  views: number;
  unique_viewers: number;
  bookmarks_by_type: Record<string, number>;
  total_bookmarks: number;
  study_mode_starts: number;
  unique_study_engagers: number;
}
interface ClassroomAnalytics {
  student_count: number;
  videos: VideoAnalytics[];
}

export default function ClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params?.id as string;
  const { user } = useAuth();
  const role = (user as any)?.role;
  const isEducator = role === 'Educator' || role === 'Administrator';

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentEmail, setStudentEmail] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  const [allVideos, setAllVideos] = useState<VideoOption[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);

  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<ClassroomAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchClassroom = async () => {
    try {
      const res = await authFetch(`/classrooms/${classroomId}`);
      if (res.ok) {
        setClassroom(await res.json());
        setError(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Could not load this classroom.');
      }
    } catch (e) {
      setError('Failed to load classroom.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classroomId) fetchClassroom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  useEffect(() => {
    if (isEducator) {
      authFetch('/upload/videos').then(async (res) => {
        if (res.ok) setAllVideos(await res.json());
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEducator]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim()) return;
    setAddingStudent(true);
    try {
      const res = await authFetch(`/classrooms/${classroomId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail.trim() }),
      });
      if (res.ok) {
        setClassroom(await res.json());
        setStudentEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || 'Failed to add student.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    const res = await authFetch(`/classrooms/${classroomId}/students/${studentId}`, { method: 'DELETE' });
    if (res.ok) setClassroom(await res.json());
  };

  const handleAddVideo = async () => {
    if (!selectedVideoId) return;
    setAddingVideo(true);
    try {
      const res = await authFetch(`/classrooms/${classroomId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: parseInt(selectedVideoId) }),
      });
      if (res.ok) {
        setClassroom(await res.json());
        setSelectedVideoId('');
      } else {
        alert('Failed to assign video.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingVideo(false);
    }
  };

  const handleRemoveVideo = async (videoId: number) => {
    const res = await authFetch(`/classrooms/${classroomId}/videos/${videoId}`, { method: 'DELETE' });
    if (res.ok) setClassroom(await res.json());
  };

  const handleToggleAnalytics = async () => {
    if (!showAnalytics && !analytics) {
      setLoadingAnalytics(true);
      try {
        const res = await authFetch(`/classrooms/${classroomId}/analytics`);
        if (res.ok) setAnalytics(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAnalytics(false);
      }
    }
    setShowAnalytics((s) => !s);
  };

  const unassignedVideos = allVideos.filter((v) => !classroom?.videos.some((cv) => cv.id === v.id));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <button
        onClick={() => router.push('/dashboard/classrooms')}
        className="flex items-center gap-1.5 text-label-large font-medium text-md-on-surface-variant hover:text-md-on-surface transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Classrooms
      </button>

      {loading ? (
        <p className="text-md-on-surface-variant">Loading...</p>
      ) : error ? (
        <div className="bg-md-surface-container p-8 rounded-xl text-center text-md-on-surface-variant">{error}</div>
      ) : classroom ? (
        <>
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-headline-medium font-bold text-md-on-surface tracking-tight flex items-center gap-3">
                {classroom.name}
                <Users2 className="text-md-primary h-6 w-6" />
              </h1>
              <p className="text-md-on-surface-variant mt-2">
                {classroom.students.length} student{classroom.students.length === 1 ? '' : 's'} · {classroom.videos.length} video{classroom.videos.length === 1 ? '' : 's'}
              </p>
            </div>
            {isEducator && (
              <button
                onClick={handleToggleAnalytics}
                className="flex items-center gap-1.5 px-4 py-2 bg-md-primary-container text-md-on-primary-container text-label-large font-semibold rounded-full transition-all hover:opacity-90 shrink-0"
              >
                <BarChart3 size={16} />
                {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
              </button>
            )}
          </header>

          {showAnalytics && (
            <div className="bg-md-surface-container rounded-xl overflow-hidden">
              <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high">
                <h3 className="text-title-large font-semibold text-md-on-surface">Classroom Content Analytics</h3>
              </div>
              {loadingAnalytics ? (
                <p className="p-6 text-md-on-surface-variant">Loading analytics...</p>
              ) : analytics && analytics.videos.length > 0 ? (
                <div className="divide-y divide-md-outline-variant">
                  {analytics.videos.map((v) => (
                    <div key={v.video_id} className="p-4 space-y-2">
                      <p className="text-title-medium font-semibold text-md-on-surface">{v.video_title}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container-highest text-label-small text-md-on-surface-variant">
                          <Eye size={12} />
                          {v.views} views ({v.unique_viewers} of {analytics.student_count} students)
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container-highest text-label-small text-md-on-surface-variant">
                          <BookmarkIcon size={12} />
                          {v.total_bookmarks} bookmarks
                          {Object.keys(v.bookmarks_by_type).length > 0 &&
                            ` (${Object.entries(v.bookmarks_by_type).map(([t, c]) => `${t}: ${c}`).join(', ')})`}
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container-highest text-label-small text-md-on-surface-variant">
                          <GraduationCap size={12} />
                          {v.unique_study_engagers} of {analytics.student_count} students used Study Mode
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-md-on-surface-variant italic">No videos assigned yet, or no engagement recorded.</p>
              )}
            </div>
          )}

          {isEducator && (
            <div className="bg-md-surface-container rounded-xl overflow-hidden">
              <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high">
                <h3 className="text-title-large font-semibold text-md-on-surface">Students</h3>
              </div>
              <form onSubmit={handleAddStudent} className="p-4 flex items-center gap-2 border-b border-md-outline-variant">
                <input
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  type="email"
                  placeholder="Student's account email"
                  className="flex-1 px-4 py-2 bg-md-surface-container-highest rounded-full text-md-on-surface placeholder:text-md-on-surface-variant focus:outline-none focus:ring-2 focus:ring-md-primary"
                />
                <button
                  type="submit"
                  disabled={addingStudent || !studentEmail.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-md-primary hover:opacity-90 text-md-on-primary text-label-large font-semibold rounded-full transition-all disabled:opacity-50 shrink-0"
                >
                  <Plus size={14} />
                  Add
                </button>
              </form>
              {classroom.students.length === 0 ? (
                <p className="p-4 text-body-small text-md-on-surface-variant italic">No students added yet.</p>
              ) : (
                <div className="divide-y divide-md-outline-variant">
                  {classroom.students.map((s) => (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-body-medium text-md-on-surface">{s.username}</p>
                        <p className="text-label-small text-md-on-surface-variant">{s.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(s.id)}
                        className="p-2 text-md-on-surface-variant hover:text-md-error rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-md-surface-container rounded-xl overflow-hidden">
            <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high">
              <h3 className="text-title-large font-semibold text-md-on-surface">Videos</h3>
            </div>
            {isEducator && (
              <div className="p-4 flex items-center gap-2 border-b border-md-outline-variant">
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="flex-1 px-4 py-2 bg-md-surface-container-highest rounded-full text-md-on-surface focus:outline-none focus:ring-2 focus:ring-md-primary"
                >
                  <option value="">Select a video to assign...</option>
                  {unassignedVideos.map((v) => (
                    <option key={v.id} value={v.id}>{v.title || v.filename}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddVideo}
                  disabled={addingVideo || !selectedVideoId}
                  className="flex items-center gap-1.5 px-4 py-2 bg-md-primary hover:opacity-90 text-md-on-primary text-label-large font-semibold rounded-full transition-all disabled:opacity-50 shrink-0"
                >
                  <Plus size={14} />
                  Assign
                </button>
              </div>
            )}
            {classroom.videos.length === 0 ? (
              <p className="p-4 text-body-small text-md-on-surface-variant italic">No videos assigned yet.</p>
            ) : (
              <div className="divide-y divide-md-outline-variant">
                {classroom.videos.map((v) => (
                  <div key={v.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <p className="text-body-medium text-md-on-surface truncate">{v.title}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/dashboard/video/${v.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-md-primary hover:opacity-90 text-md-on-primary text-label-small font-semibold rounded-full transition-all"
                      >
                        <Play size={12} />
                        Open
                      </Link>
                      {isEducator && (
                        <button
                          onClick={() => handleRemoveVideo(v.id)}
                          className="p-2 text-md-on-surface-variant hover:text-md-error rounded-full transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
