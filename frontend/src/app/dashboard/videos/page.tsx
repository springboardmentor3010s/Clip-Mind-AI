"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/config';
import { authFetch } from '@/lib/authFetch';
import { Film, Play, Clock, FileText, ArrowRight, Trash2, Pencil, Check, X } from 'lucide-react';
import VideoUpload from '@/components/VideoUpload';
import { useAuth } from '@/context/AuthContext';

interface VideoItem {
  id: number;
  title: string;
  filename: string;
  status: string;
  created_at: string;
}

export default function VideosPage() {
  const { user } = useAuth();
  const canManageContent = (user as any)?.role !== 'Learner';
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/upload/videos`);
        if (res.ok) {
          const data = await res.json();
          setVideos(data);
        }
      } catch (err) {
        console.error("Failed to fetch videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleDelete = async (video: VideoItem) => {
    const confirmed = window.confirm(
      `Delete "${video.title || video.filename}"? This permanently removes the video, transcript, summary, key moments, and analytics for it.`
    );
    if (!confirmed) return;

    setDeletingId(video.id);
    try {
      const res = await authFetch(`/upload/video/${video.id}`, { method: 'DELETE' });
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== video.id));
      } else {
        alert('Failed to delete video.');
      }
    } catch (err) {
      console.error("Failed to delete video:", err);
      alert('Failed to delete video.');
    } finally {
      setDeletingId(null);
    }
  };

  const startRename = (video: VideoItem) => {
    setRenamingId(video.id);
    setRenameValue(video.title || video.filename);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const saveRename = async (video: VideoItem) => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === video.title) {
      cancelRename();
      return;
    }
    setSavingRename(true);
    try {
      const res = await authFetch(`/upload/video/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, title: trimmed } : v)));
        cancelRename();
      } else {
        alert('Failed to rename video.');
      }
    } catch (err) {
      console.error('Failed to rename video:', err);
      alert('Failed to rename video.');
    } finally {
      setSavingRename(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-headline-medium font-bold text-md-on-surface tracking-tight flex items-center gap-3">
            My Videos
            <Film className="text-md-primary h-6 w-6" />
          </h1>
          <p className="text-md-on-surface-variant mt-2">View and manage all uploaded video files and their AI transcripts.</p>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-md-surface-container p-6 rounded-xl animate-pulse h-48 flex flex-col justify-between">
              <div className="h-6 bg-md-surface-container-highest rounded w-3/4"></div>
              <div className="h-4 bg-md-surface-container-highest rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-md-surface-container p-12 rounded-xl text-center space-y-6">
          <div className="w-16 h-16 bg-md-surface-container-highest rounded-2xl flex items-center justify-center mx-auto text-md-on-surface-variant">
            <Film size={32} />
          </div>
          <div>
            <h3 className="text-title-large font-semibold text-md-on-surface">No videos uploaded yet</h3>
            <p className="text-md-on-surface-variant mt-1">
              {canManageContent
                ? 'Upload a video to get started with AI transcription and key moments.'
                : 'Check back once a Creator or Educator has uploaded content.'}
            </p>
          </div>
          {canManageContent && (
            <div className="pt-4 max-w-xl mx-auto">
              <VideoUpload />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-md-surface-container p-6 rounded-xl transition-all hover:bg-md-surface-container-high flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 text-label-small font-semibold rounded-full ${
                    video.status === 'COMPLETED'
                      ? 'bg-md-success-container text-md-on-success-container'
                      : video.status === 'FAILED'
                      ? 'bg-md-error-container text-md-on-error-container'
                      : 'bg-md-secondary-container text-md-on-secondary-container animate-pulse'
                  }`}>
                    {video.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-label-small text-md-on-surface-variant flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>
                    {canManageContent && renamingId !== video.id && (
                      <button
                        onClick={() => startRename(video)}
                        title="Rename video"
                        className="p-1.5 rounded-full text-md-on-surface-variant hover:text-md-primary hover:bg-md-primary-container transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canManageContent && (
                      <button
                        onClick={() => handleDelete(video)}
                        disabled={deletingId === video.id}
                        title="Delete video"
                        className="p-1.5 rounded-full text-md-on-surface-variant hover:text-md-error hover:bg-md-error-container transition-colors disabled:opacity-38"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {renamingId === video.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(video);
                        if (e.key === 'Escape') cancelRename();
                      }}
                      className="flex-1 min-w-0 px-2 py-1 text-title-medium font-bold bg-md-surface-container-highest text-md-on-surface rounded-md border border-md-outline focus:outline-none focus:ring-2 focus:ring-md-primary"
                    />
                    <button
                      onClick={() => saveRename(video)}
                      disabled={savingRename}
                      title="Save"
                      className="p-1.5 rounded-full text-md-primary hover:bg-md-primary-container transition-colors disabled:opacity-38"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelRename}
                      title="Cancel"
                      className="p-1.5 rounded-full text-md-on-surface-variant hover:bg-md-surface-container-highest transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-title-medium font-bold text-md-on-surface group-hover:text-md-primary transition-colors line-clamp-2">
                      {video.title || video.filename}
                    </h3>
                    {video.title && video.title !== video.filename && (
                      <p className="text-label-small text-md-on-surface-variant/70 truncate mt-0.5">
                        ({video.filename})
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-md-outline-variant flex items-center justify-between">
                <span className="text-label-small text-md-on-surface-variant flex items-center gap-1">
                  <FileText size={14} />
                  ID: #{video.id}
                </span>
                <Link
                  href={`/dashboard/video/${video.id}`}
                  className="px-4 py-2 bg-md-primary hover:opacity-90 text-md-on-primary font-semibold text-label-large rounded-full transition-all flex items-center gap-1.5"
                >
                  <Play size={14} />
                  Open Video
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
