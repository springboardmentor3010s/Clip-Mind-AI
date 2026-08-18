// src/pages/EducatorContentPage.tsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Video,
  Plus,
  Search,
  PlayCircle,
  Pencil,
  Trash2,
  Share2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  CalendarDays,
  Eye,
  Clock3,
  Sparkles,
  ListVideo,
  FileText,
  Tag,
  ChevronRight,
  Languages,
} from 'lucide-react';

import {
  api,
  Classroom,
  KeyMoment,
  TranscriptResponse,
  Video as ApiVideo,
} from '../services/api';

interface VideoItem extends ApiVideo {}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8001';

const formatDuration = (
  seconds?: number | null,
) => {
  if (
    seconds === undefined ||
    seconds === null ||
    seconds < 0
  ) {
    return '--';
  }

  const total = Math.round(seconds);

  const h = Math.floor(total / 3600);
  const m = Math.floor(
    (total % 3600) / 60,
  );
  const s = total % 60;

  if (h) {
    return `${h}h ${String(m).padStart(
      2,
      '0',
    )}m`;
  }

  return `${m}:${String(s).padStart(
    2,
    '0',
  )}`;
};

const formatTimestamp = (
  seconds?: number | null,
) => {
  if (
    seconds === undefined ||
    seconds === null ||
    Number.isNaN(seconds)
  ) {
    return '00:00';
  }

  const total = Math.max(
    0,
    Math.floor(seconds),
  );

  const hours = Math.floor(
    total / 3600,
  );

  const minutes = Math.floor(
    (total % 3600) / 60,
  );

  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(
      minutes,
    ).padStart(2, '0')}:${String(
      secs,
    ).padStart(2, '0')}`;
  }

  return `${minutes}:${String(
    secs,
  ).padStart(2, '0')}`;
};

const formatSize = (
  bytes?: number | null,
) => {
  if (!bytes || bytes <= 0) {
    return '--';
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 * 1024 * 1024)
  ).toFixed(2)} GB`;
};

const formatDate = (
  date?: string | null,
) => {
  if (!date) {
    return '--';
  }

  const value = new Date(date);

  return Number.isNaN(
    value.getTime(),
  )
    ? '--'
    : value.toLocaleDateString();
};

const buildMediaUrl = (
  url?: string | null,
) => {
  if (!url) {
    return '';
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  return `${API_BASE_URL}${
    url.startsWith('/')
      ? url
      : `/${url}`
  }`;
};

export const EducatorContentPage: React.FC =
  () => {
    const [
      videos,
      setVideos,
    ] = useState<VideoItem[]>([]);

    const [
      classrooms,
      setClassrooms,
    ] = useState<Classroom[]>([]);

    const [
      search,
      setSearch,
    ] = useState('');

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      error,
      setError,
    ] = useState('');

    const [
      success,
      setSuccess,
    ] = useState('');

    const [
      showUpload,
      setShowUpload,
    ] = useState(false);

    const [
      showEdit,
      setShowEdit,
    ] = useState(false);

    const [
      showShare,
      setShowShare,
    ] = useState(false);

    const [
      showViewer,
      setShowViewer,
    ] = useState(false);

    const [
      selectedVideo,
      setSelectedVideo,
    ] =
      useState<VideoItem | null>(null);

    const [
      transcript,
      setTranscript,
    ] =
      useState<TranscriptResponse | null>(
        null,
      );

    const [
      keyMoments,
      setKeyMoments,
    ] = useState<KeyMoment[]>([]);

    const [
      loadingAnalysis,
      setLoadingAnalysis,
    ] = useState(false);

    const [
      transcriptSearch,
      setTranscriptSearch,
    ] = useState('');

    const [
      activeSegmentId,
      setActiveSegmentId,
    ] = useState<string | null>(
      null,
    );

    const [
      title,
      setTitle,
    ] = useState('');

    const [
      description,
      setDescription,
    ] = useState('');

    const [
      category,
      setCategory,
    ] = useState('General');

    const [
      uploadFile,
      setUploadFile,
    ] = useState<File | null>(
      null,
    );

    const [
      uploadProgress,
      setUploadProgress,
    ] = useState(0);

    const [
      saving,
      setSaving,
    ] = useState(false);

    const [
      shareClassroomId,
      setShareClassroomId,
    ] = useState('');

    const [
      sharing,
      setSharing,
    ] = useState(false);

    const fileRef =
      useRef<HTMLInputElement>(null);

    const videoRef =
      useRef<HTMLVideoElement>(null);

    const loadContent =
      async () => {
        setLoading(true);
        setError('');

        try {
          const [
            videoData,
            classroomData,
          ] = await Promise.all([
            api.getVideos(),
            api.getClassrooms(),
          ]);

          setVideos(
            (videoData ||
              []) as VideoItem[],
          );

          setClassrooms(
            classroomData || [],
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load teaching content.',
          );
        } finally {
          setLoading(false);
        }
      };

    useEffect(() => {
      loadContent();
    }, []);

    const filteredVideos =
      useMemo(() => {
        const query = search
          .trim()
          .toLowerCase();

        if (!query) {
          return videos;
        }

        return videos.filter(
          (video) =>
            [
              video.title,
              video.description,
              video.category,
              video.status,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(query),
        );
      }, [videos, search]);

    const filteredTranscript =
      useMemo(() => {
        const segments =
          transcript?.segments || [];

        const query =
          transcriptSearch
            .trim()
            .toLowerCase();

        if (!query) {
          return segments;
        }

        return segments.filter(
          (segment) =>
            segment.text
              .toLowerCase()
              .includes(query),
        );
      }, [
        transcript,
        transcriptSearch,
      ]);

    const openEdit = (
      video: VideoItem,
    ) => {
      setSelectedVideo(video);
      setTitle(video.title || '');
      setDescription(
        video.description || '',
      );
      setCategory(
        video.category || 'General',
      );
      setError('');
      setShowEdit(true);
    };

    const handleEdit =
      async (
        event: React.FormEvent,
      ) => {
        event.preventDefault();

        if (
          !selectedVideo ||
          !title.trim()
        ) {
          return;
        }

        setSaving(true);
        setError('');

        try {
          await api.updateVideo(
            selectedVideo.id,
            {
              title: title.trim(),
              description:
                description.trim(),
              category:
                category.trim() ||
                'General',
            },
          );

          setVideos(
            (current) =>
              current.map(
                (video) =>
                  video.id ===
                  selectedVideo.id
                    ? {
                        ...video,
                        title:
                          title.trim(),
                        description:
                          description.trim(),
                        category:
                          category.trim() ||
                          'General',
                      }
                    : video,
              ),
          );

          setSuccess(
            'Video details updated successfully.',
          );

          setShowEdit(false);
          setSelectedVideo(null);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to update video.',
          );
        } finally {
          setSaving(false);
        }
      };

    const handleDelete =
      async (
        video: VideoItem,
      ) => {
        const confirmed =
          window.confirm(
            `Delete "${video.title}"? This cannot be undone.`,
          );

        if (!confirmed) {
          return;
        }

        setError('');

        try {
          await api.deleteVideo(
            video.id,
          );

          setVideos(
            (current) =>
              current.filter(
                (item) =>
                  item.id !==
                  video.id,
              ),
          );

          setSuccess(
            'Video deleted successfully.',
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to delete video.',
          );
        }
      };

    const handleUpload =
      async (
        event: React.FormEvent,
      ) => {
        event.preventDefault();

        if (!uploadFile) {
          setError(
            'Please select a video file.',
          );
          return;
        }

        if (!title.trim()) {
          setError(
            'Please enter a video title.',
          );
          return;
        }

        setSaving(true);
        setError('');
        setUploadProgress(0);

        try {
          const formData =
            new FormData();

          formData.append(
            'file',
            uploadFile,
          );

          formData.append(
            'title',
            title.trim(),
          );

          formData.append(
            'description',
            description.trim(),
          );

          formData.append(
            'category',
            category.trim() ||
              'General',
          );

          await api.uploadVideo(
            formData,
            setUploadProgress,
          );

          setSuccess(
            'Video uploaded. AI processing has started.',
          );

          setShowUpload(false);
          setUploadFile(null);
          setTitle('');
          setDescription('');
          setCategory('General');
          setUploadProgress(0);

          await loadContent();
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to upload video.',
          );
        } finally {
          setSaving(false);
        }
      };

    const openShare = (
      video: VideoItem,
    ) => {
      setSelectedVideo(video);
      setShareClassroomId('');
      setError('');
      setShowShare(true);
    };

    const handleShare =
      async (
        event: React.FormEvent,
      ) => {
        event.preventDefault();

        if (
          !selectedVideo ||
          !shareClassroomId
        ) {
          setError(
            'Select a classroom first.',
          );
          return;
        }

        setSharing(true);
        setError('');

        try {
          await api.shareVideoToClassroom(
            shareClassroomId,
            selectedVideo.id,
          );

          setSuccess(
            `"${selectedVideo.title}" was shared with the classroom.`,
          );

          setShowShare(false);
          setSelectedVideo(null);

          await loadContent();
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to share the video.',
          );
        } finally {
          setSharing(false);
        }
      };

    const openVideo =
      async (
        video: VideoItem,
      ) => {
        if (!video.fileUrl) {
          setError(
            'This video does not have a playable file URL.',
          );
          return;
        }

        setSelectedVideo(video);
        setTranscript(null);
        setKeyMoments([]);
        setTranscriptSearch('');
        setActiveSegmentId(null);
        setShowViewer(true);
        setLoadingAnalysis(true);
        setError('');

        try {
          const [
            transcriptData,
            momentsData,
          ] = await Promise.all([
            api.getTranscript(
              video.id,
            ),
            api.getKeyMoments(
              video.id,
            ),
          ]);

          setTranscript(
            transcriptData,
          );

          setKeyMoments(
            momentsData || [],
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load transcript and key moments.',
          );
        } finally {
          setLoadingAnalysis(false);
        }
      };

    const seekVideo = (
      seconds: number,
      segmentId?: string,
    ) => {
      if (!videoRef.current) {
        return;
      }

      videoRef.current.currentTime =
        seconds;

      setActiveSegmentId(
        segmentId || null,
      );

      videoRef.current
        .play()
        .catch(() => {});
    };

    const closeViewer = () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }

      setShowViewer(false);
      setSelectedVideo(null);
      setTranscript(null);
      setKeyMoments([]);
      setTranscriptSearch('');
      setActiveSegmentId(null);
    };

    return (
      <div className="space-y-8 pb-16">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>

            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 mb-4">
              <Video className="w-3.5 h-3.5 text-purple-400" />

              <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                Teaching Content
              </span>
            </div>

            <h1 className="text-2xl font-black text-white">
              Content Library
            </h1>

            <p className="text-xs text-slate-400 mt-2 max-w-2xl">
              Manage uploaded teaching videos,
              edit content, share videos with
              classrooms, and explore AI-generated
              transcripts and key moments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError('');
              setTitle('');
              setDescription('');
              setCategory('General');
              setUploadFile(null);
              setShowUpload(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-xs font-black text-white"
          >
            <Plus className="w-4 h-4" />
            Add Content
          </button>
        </div>

        {/* =====================================================
            ALERTS
        ====================================================== */}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />

            <span className="flex-1">
              {success}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccess('')
              }
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />

            <span className="flex-1">
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =====================================================
            STATS
        ====================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <StatCard
            label="My Videos"
            value={String(
              videos.length,
            )}
            icon={
              <Video className="w-4 h-4" />
            }
          />

          <StatCard
            label="Classrooms"
            value={String(
              classrooms.length,
            )}
            icon={
              <Users className="w-4 h-4" />
            }
          />

          <StatCard
            label="Processed"
            value={String(
              videos.filter(
                (v) =>
                  v.status ===
                  'COMPLETED',
              ).length,
            )}
            icon={
              <CheckCircle2 className="w-4 h-4" />
            }
          />

        </div>

        {/* =====================================================
            SEARCH
        ====================================================== */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">

          <div className="relative">

            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search videos by title, category or status..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-11 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/40"
            />

          </div>

        </div>

        {/* =====================================================
            VIDEO LIST
        ====================================================== */}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading real content...
          </div>
        ) : filteredVideos.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-14 text-center">

            <Video className="w-10 h-10 text-slate-700 mx-auto mb-4" />

            <h3 className="text-sm font-bold text-slate-300">
              No videos found
            </h3>

            <p className="text-xs text-slate-600 mt-1">
              Upload your first teaching
              video to build the content
              library.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {filteredVideos.map(
              (video) => (
                <div
                  key={video.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden hover:border-purple-500/20 transition-all"
                >

                  <div className="p-5">

                    <div className="flex gap-4">

                      <button
                        type="button"
                        onClick={() =>
                          openVideo(
                            video,
                          )
                        }
                        className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center"
                        title="Open video intelligence viewer"
                      >
                        {video.thumbnailUrl ? (
                          <img
                            src={buildMediaUrl(
                              video.thumbnailUrl,
                            )}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PlayCircle className="w-7 h-7 text-purple-400" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <h3 className="text-sm font-black text-white truncate">
                              {video.title}
                            </h3>

                            <p className="text-[10px] text-slate-500 mt-1">
                              {video.category ||
                                'General'}{' '}
                              ·{' '}
                              {formatDuration(
                                video.duration,
                              )}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${
                              video.status ===
                              'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {video.status ||
                              'UNKNOWN'}
                          </span>

                        </div>

                        <p className="text-[11px] text-slate-500 mt-3 line-clamp-2">
                          {video.description ||
                            'No description provided.'}
                        </p>

                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-5">

                      <Info
                        icon={
                          <Eye className="w-3 h-3" />
                        }
                        label="Views"
                        value={String(
                          video.viewsCount ??
                            0,
                        )}
                      />

                      <Info
                        icon={
                          <CalendarDays className="w-3 h-3" />
                        }
                        label="Added"
                        value={formatDate(
                          video.createdAt,
                        )}
                      />

                      <Info
                        icon={
                          <Video className="w-3 h-3" />
                        }
                        label="Size"
                        value={formatSize(
                          video.size,
                        )}
                      />

                    </div>

                    {video.status &&
                      video.status !==
                        'COMPLETED' && (
                        <div className="mt-4">

                          <div className="flex justify-between text-[9px] mb-1">

                            <span className="text-slate-600">
                              Processing
                            </span>

                            <span className="text-purple-400 font-bold">
                              {video.progress ??
                                0}
                              %
                            </span>

                          </div>

                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">

                            <div
                              className="h-full bg-purple-500 rounded-full transition-all"
                              style={{
                                width: `${video.progress ?? 0}%`,
                              }}
                            />

                          </div>
                        </div>
                      )}

                    <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800">

                      <ActionButton
                        icon={
                          <PlayCircle className="w-3.5 h-3.5" />
                        }
                        label="Open"
                        onClick={() =>
                          openVideo(
                            video,
                          )
                        }
                      />

                      <ActionButton
                        icon={
                          <Pencil className="w-3.5 h-3.5" />
                        }
                        label="Edit"
                        onClick={() =>
                          openEdit(
                            video,
                          )
                        }
                      />

                      <ActionButton
                        icon={
                          <Share2 className="w-3.5 h-3.5" />
                        }
                        label="Share"
                        onClick={() =>
                          openShare(
                            video,
                          )
                        }
                      />

                      <ActionButton
                        danger
                        icon={
                          <Trash2 className="w-3.5 h-3.5" />
                        }
                        label="Delete"
                        onClick={() =>
                          handleDelete(
                            video,
                          )
                        }
                      />

                    </div>

                  </div>
                </div>
              ),
            )}

          </div>
        )}

        {/* =====================================================
            UPLOAD MODAL
        ====================================================== */}

        {showUpload && (
          <Modal
            title="Add Teaching Content"
            onClose={() =>
              !saving &&
              setShowUpload(false)
            }
          >
            <form
              onSubmit={handleUpload}
              className="space-y-5"
            >

              <Field label="Video File">
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  onChange={(event) =>
                    setUploadFile(
                      event.target
                        .files?.[0] ||
                        null,
                    )
                  }
                  className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-500/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-purple-300"
                  required
                />
              </Field>

              <Field label="Title">
                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value,
                    )
                  }
                  placeholder="e.g. REST API Fundamentals"
                  className="input"
                  required
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Describe what students will learn..."
                  className="input resize-none"
                />
              </Field>

              <Field label="Category">
                <input
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value,
                    )
                  }
                  placeholder="e.g. Computer Networks"
                  className="input"
                />
              </Field>

              {saving && (
                <ProgressBar
                  value={
                    uploadProgress
                  }
                  label="Uploading"
                />
              )}

              <ModalActions
                busy={saving}
                submitLabel="Upload Video"
                onCancel={() =>
                  setShowUpload(false)
                }
              />

            </form>
          </Modal>
        )}

        {/* =====================================================
            EDIT MODAL
        ====================================================== */}

        {showEdit &&
          selectedVideo && (
            <Modal
              title="Edit Video Details"
              onClose={() =>
                !saving &&
                setShowEdit(false)
              }
            >
              <form
                onSubmit={handleEdit}
                className="space-y-5"
              >

                <Field label="Title">
                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value,
                      )
                    }
                    className="input"
                    required
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value,
                      )
                    }
                    rows={4}
                    className="input resize-none"
                  />
                </Field>

                <Field label="Category">
                  <input
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value,
                      )
                    }
                    className="input"
                  />
                </Field>

                <ModalActions
                  busy={saving}
                  submitLabel="Save Changes"
                  onCancel={() =>
                    setShowEdit(false)
                  }
                />

              </form>
            </Modal>
          )}

        {/* =====================================================
            SHARE MODAL
        ====================================================== */}

        {showShare &&
          selectedVideo && (
            <Modal
              title="Share Video with Classroom"
              onClose={() =>
                !sharing &&
                setShowShare(false)
              }
            >
              <form
                onSubmit={handleShare}
                className="space-y-5"
              >

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">

                  <p className="text-xs font-bold text-white">
                    {selectedVideo.title}
                  </p>

                  <p className="text-[10px] text-slate-500 mt-1">
                    Only classrooms returned
                    by the backend are shown.
                  </p>

                </div>

                <Field label="Classroom">

                  <select
                    value={
                      shareClassroomId
                    }
                    onChange={(e) =>
                      setShareClassroomId(
                        e.target.value,
                      )
                    }
                    className="input"
                    required
                  >

                    <option value="">
                      Select classroom
                    </option>

                    {classrooms.map(
                      (classroom) => (
                        <option
                          key={
                            classroom.id
                          }
                          value={
                            classroom.id
                          }
                        >
                          {classroom.name}{' '}
                          (
                          {
                            classroom.code
                          }
                          )
                        </option>
                      ),
                    )}

                  </select>

                </Field>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-[10px] text-blue-300">
                  The backend validates that
                  you own the video and that
                  the classroom belongs to you.
                </div>

                <ModalActions
                  busy={sharing}
                  submitLabel="Share Video"
                  onCancel={() =>
                    setShowShare(false)
                  }
                />

              </form>
            </Modal>
          )}

        {/* =====================================================
            VIDEO INTELLIGENCE VIEWER
        ====================================================== */}

        {showViewer &&
          selectedVideo && (
            <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm overflow-y-auto">

              <div className="min-h-screen p-3 sm:p-5 lg:p-8">

                <div className="mx-auto max-w-7xl rounded-3xl border border-slate-800 bg-[#080D18] shadow-2xl overflow-hidden">

                  {/* VIEWER HEADER */}

                  <div className="flex items-center justify-between gap-4 p-5 lg:p-6 border-b border-slate-800">

                    <div className="min-w-0">

                      <div className="flex items-center gap-2 mb-1">

                        <Sparkles className="w-4 h-4 text-purple-400" />

                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                          AI Video Intelligence
                        </span>

                      </div>

                      <h2 className="text-lg lg:text-xl font-black text-white truncate">
                        {selectedVideo.title}
                      </h2>

                      <p className="text-xs text-slate-500 mt-1">
                        Transcript · Key Moments
                        · Timestamp Navigation
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={
                        closeViewer
                      }
                      className="w-10 h-10 shrink-0 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>

                  </div>

                  {/* VIDEO + KEY MOMENTS */}

                  <div className="grid lg:grid-cols-[1.6fr_0.9fr]">

                    {/* VIDEO */}

                    <div className="p-4 lg:p-6">

                      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black">

                        <video
                          ref={videoRef}
                          controls
                          playsInline
                          className="w-full aspect-video bg-black"
                          src={buildMediaUrl(
                            selectedVideo.fileUrl,
                          )}
                        />

                      </div>

                      {/* VIDEO INFO */}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">

                        <Info
                          icon={
                            <Clock3 className="w-3 h-3" />
                          }
                          label="Duration"
                          value={formatDuration(
                            selectedVideo.duration,
                          )}
                        />

                        <Info
                          icon={
                            <Eye className="w-3 h-3" />
                          }
                          label="Views"
                          value={String(
                            selectedVideo.viewsCount ??
                              0,
                          )}
                        />

                        <Info
                          icon={
                            <CheckCircle2 className="w-3 h-3" />
                          }
                          label="Status"
                          value={
                            selectedVideo.status ||
                            '--'
                          }
                        />

                        <Info
                          icon={
                            <CalendarDays className="w-3 h-3" />
                          }
                          label="Added"
                          value={formatDate(
                            selectedVideo.createdAt,
                          )}
                        />

                      </div>

                      {/* DESCRIPTION */}

                      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

                        <div className="flex items-center gap-2">

                          <FileText className="w-3.5 h-3.5 text-slate-500" />

                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-600">
                            Description
                          </p>

                        </div>

                        <p className="text-sm text-slate-300 mt-2 leading-6">
                          {selectedVideo.description ||
                            'No description provided.'}
                        </p>

                      </div>

                    </div>

                    {/* KEY MOMENTS */}

                    <div className="border-l border-slate-800 bg-slate-950/40">

                      <div className="p-5 border-b border-slate-800">

                        <div className="flex items-center justify-between">

                          <div>

                            <div className="flex items-center gap-2">

                              <ListVideo className="w-4 h-4 text-purple-400" />

                              <h3 className="text-sm font-black text-white">
                                Key Moments
                              </h3>

                            </div>

                            <p className="text-[10px] text-slate-600 mt-1">
                              AI-detected important
                              sections
                            </p>

                          </div>

                          <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[9px] font-black text-purple-400">
                            {keyMoments.length}
                          </span>

                        </div>

                      </div>

                      <div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">

                        {loadingAnalysis ? (

                          <div className="flex items-center justify-center py-16 text-slate-500">

                            <Loader2 className="w-5 h-5 animate-spin mr-2" />

                            Loading AI analysis...

                          </div>

                        ) : keyMoments.length ===
                          0 ? (

                          <div className="py-12 text-center">

                            <ListVideo className="w-8 h-8 text-slate-700 mx-auto mb-3" />

                            <p className="text-xs text-slate-500">
                              No key moments
                              available.
                            </p>

                          </div>

                        ) : (

                          keyMoments.map(
                            (
                              moment,
                              index,
                            ) => (

                              <button
                                key={
                                  moment.id
                                }
                                type="button"
                                onClick={() =>
                                  seekVideo(
                                    moment.startTime,
                                  )
                                }
                                className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/70 p-4 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all"
                              >

                                <div className="flex items-start gap-3">

                                  <div className="w-8 h-8 shrink-0 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-[10px] font-black">
                                    {index +
                                      1}
                                  </div>

                                  <div className="min-w-0 flex-1">

                                    <div className="flex items-center justify-between gap-2">

                                      <span className="text-[10px] font-black text-purple-400">
                                        {formatTimestamp(
                                          moment.startTime,
                                        )}
                                      </span>

                                      {moment.importanceScore !=
                                        null && (
                                        <span className="text-[9px] font-bold text-amber-400">
                                          {
                                            moment.importanceScore
                                          }
                                          %
                                        </span>
                                      )}

                                    </div>

                                    <p className="text-xs font-black text-white mt-1">
                                      {
                                        moment.title
                                      }
                                    </p>

                                    {moment.description && (
                                      <p className="text-[10px] leading-5 text-slate-500 mt-1">
                                        {
                                          moment.description
                                        }
                                      </p>
                                    )}

                                    {moment.topic && (
                                      <div className="flex items-center gap-1.5 mt-2">

                                        <Tag className="w-3 h-3 text-slate-600" />

                                        <span className="text-[8px] font-bold text-slate-500">
                                          {
                                            moment.topic
                                          }
                                        </span>

                                      </div>
                                    )}

                                    {moment.keywords &&
                                      moment.keywords.length >
                                        0 && (

                                        <div className="flex flex-wrap gap-1.5 mt-3">

                                          {moment.keywords
                                            .slice(
                                              0,
                                              5,
                                            )
                                            .map(
                                              (
                                                keyword,
                                              ) => (
                                                <span
                                                  key={
                                                    keyword
                                                  }
                                                  className="rounded-md bg-slate-800 px-2 py-1 text-[8px] font-bold text-slate-400"
                                                >
                                                  {
                                                    keyword
                                                  }
                                                </span>
                                              ),
                                            )}

                                        </div>

                                      )}

                                  </div>

                                  <ChevronRight className="w-4 h-4 text-slate-700 shrink-0 mt-1" />

                                </div>

                              </button>

                            ),
                          )

                        )}

                      </div>

                    </div>

                  </div>

                  {/* TRANSCRIPT */}

                  <div className="border-t border-slate-800">

                    <div className="p-5 lg:p-6">

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        <div>

                          <div className="flex items-center gap-2">

                            <FileText className="w-4 h-4 text-cyan-400" />

                            <h3 className="text-sm font-black text-white">
                              AI Transcript
                            </h3>

                            {transcript?.language && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 text-[8px] font-black text-cyan-400 uppercase">

                                <Languages className="w-3 h-3" />

                                {
                                  transcript.language
                                }

                              </span>
                            )}

                          </div>

                          <p className="text-[10px] text-slate-600 mt-1">
                            Click any timestamp to
                            jump to that point in
                            the video.
                          </p>

                        </div>

                        <div className="relative w-full md:w-72">

                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />

                          <input
                            value={
                              transcriptSearch
                            }
                            onChange={(
                              e,
                            ) =>
                              setTranscriptSearch(
                                e.target.value,
                              )
                            }
                            placeholder="Search transcript..."
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/40"
                          />

                        </div>

                      </div>

                      {loadingAnalysis ? (

                        <div className="flex justify-center py-12 text-slate-500">

                          <Loader2 className="w-5 h-5 animate-spin mr-2" />

                          Loading transcript...

                        </div>

                      ) : filteredTranscript.length ===
                        0 ? (

                        <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center mt-5">

                          <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />

                          <p className="text-xs text-slate-500">
                            No transcript segments
                            found.
                          </p>

                        </div>

                      ) : (

                        <div className="mt-5 max-h-[520px] overflow-y-auto space-y-1 pr-2">

                          {filteredTranscript.map(
                            (
                              segment,
                            ) => {

                              const segmentId =
                                segment.id ||
                                `${segment.start}-${segment.end}`;

                              const active =
                                activeSegmentId ===
                                segmentId;

                              return (
                                <button
                                  key={
                                    segmentId
                                  }
                                  type="button"
                                  onClick={() =>
                                    seekVideo(
                                      segment.start,
                                      segmentId,
                                    )
                                  }
                                  className={`w-full text-left rounded-xl p-4 transition-all group ${
                                    active
                                      ? 'bg-purple-500/10 border border-purple-500/30'
                                      : 'border border-transparent hover:bg-slate-900 hover:border-slate-800'
                                  }`}
                                >

                                  <div className="flex gap-4">

                                    <span
                                      className={`w-14 shrink-0 text-[10px] font-black pt-0.5 ${
                                        active
                                          ? 'text-purple-300'
                                          : 'text-purple-400'
                                      }`}
                                    >
                                      {formatTimestamp(
                                        segment.start,
                                      )}
                                    </span>

                                    <div className="flex-1">

                                      <p
                                        className={`text-xs leading-6 ${
                                          active
                                            ? 'text-white'
                                            : 'text-slate-300 group-hover:text-white'
                                        }`}
                                      >
                                        {
                                          segment.text
                                        }
                                      </p>

                                      <div className="flex gap-3 mt-1">

                                        {segment.speaker && (
                                          <span className="text-[8px] text-slate-600">
                                            {
                                              segment.speaker
                                            }
                                          </span>
                                        )}

                                        {segment.confidence !=
                                          null && (
                                          <span className="text-[8px] text-slate-700">
                                            {Math.round(
                                              segment.confidence *
                                                100,
                                            )}
                                            %
                                            confidence
                                          </span>
                                        )}

                                      </div>

                                    </div>

                                    <PlayCircle
                                      className={`w-4 h-4 shrink-0 mt-1 ${
                                        active
                                          ? 'text-purple-400'
                                          : 'text-slate-700 group-hover:text-purple-400'
                                      }`}
                                    />

                                  </div>

                                </button>
                              );
                            },
                          )}

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

      </div>
    );
  };

const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
}> = ({
  label,
  value,
  icon,
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
      {icon}
    </div>

    <p className="mt-4 text-[10px] uppercase tracking-wider font-bold text-slate-500">
      {label}
    </p>

    <p className="mt-1 text-2xl font-black text-white">
      {value}
    </p>

  </div>
);

const Info: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({
  icon,
  label,
  value,
}) => (
  <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">

    <div className="flex items-center gap-1.5 text-slate-600">

      {icon}

      <span className="text-[9px] uppercase font-bold">
        {label}
      </span>

    </div>

    <p className="mt-1 text-[11px] font-bold text-slate-300 truncate">
      {value}
    </p>

  </div>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({
  icon,
  label,
  onClick,
  danger,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold transition ${
      danger
        ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
        : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {icon}
    {label}
  </button>
);

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({
  label,
  children,
}) => (
  <div>

    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
      {label}
    </label>

    {children}

  </div>
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({
  title,
  onClose,
  children,
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">

    <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0A1020] shadow-2xl my-8">

      <div className="flex items-center justify-between p-6 border-b border-slate-800">

        <h2 className="text-sm font-black text-white">
          {title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

      </div>

      <div className="p-6">
        {children}
      </div>

    </div>

  </div>
);

const ModalActions: React.FC<{
  busy: boolean;
  submitLabel: string;
  onCancel: () => void;
}> = ({
  busy,
  submitLabel,
  onCancel,
}) => (
  <div className="flex justify-end gap-3 pt-2">

    <button
      type="button"
      disabled={busy}
      onClick={onCancel}
      className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-50"
    >
      Cancel
    </button>

    <button
      type="submit"
      disabled={busy}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-xs font-black text-white disabled:opacity-50"
    >

      {busy && (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      )}

      {submitLabel}

    </button>

  </div>
);

const ProgressBar: React.FC<{
  value: number;
  label: string;
}> = ({
  value,
  label,
}) => (
  <div>

    <div className="flex justify-between text-[10px] mb-1">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="text-purple-400 font-bold">
        {value}%
      </span>

    </div>

    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">

      <div
        className="h-full bg-purple-500 rounded-full transition-all"
        style={{
          width: `${value}%`,
        }}
      />

    </div>

  </div>
);

export default EducatorContentPage;