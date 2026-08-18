import React, { useEffect, useMemo, useState } from 'react';
import {
  Video,
  Search,
  RefreshCw,
  PlayCircle,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Trash2,
  Eye,
  Filter,
} from 'lucide-react';
import { api, getMediaUrl } from '../services/api';
import { VideoItem } from '../types';

export const AdminVideosPage: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadVideos = async () => {
    setLoading(true);

    try {
      const data = await api.getVideos();
      setVideos(data);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Delete "${title}" permanently?`
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      await api.deleteVideo(id);

      setVideos((current) =>
        current.filter((video) => video.id !== id)
      );
    } catch (error: any) {
      alert(error?.message || 'Failed to delete video.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();

    return videos.filter((video) => {
      const matchesSearch =
        !query ||
        video.title.toLowerCase().includes(query) ||
        video.description?.toLowerCase().includes(query) ||
        video.uploaderName?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'ALL' ||
        video.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [videos, search, statusFilter]);

  const completed = videos.filter(
    (v) => v.status === 'COMPLETED'
  ).length;

  const processing = videos.filter(
    (v) =>
      v.status !== 'COMPLETED' &&
      v.status !== 'FAILED'
  ).length;

  const failed = videos.filter(
    (v) => v.status === 'FAILED'
  ).length;

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <RefreshCw className="w-7 h-7 text-purple-400 animate-spin" />

        <p className="mt-4 text-sm font-semibold text-slate-400">
          Loading video management console...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-16">

      {/* HEADER */}
      <section>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">

          <div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 text-[10px] font-black uppercase tracking-wider">
              <Video className="w-3.5 h-3.5" />
              Video Management
            </div>

            <h1 className="mt-4 text-3xl font-black text-white">
              Video Operations
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Review uploaded media, processing states and
              platform video activity.
            </p>

          </div>

          <button
            type="button"
            onClick={loadVideos}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/70 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Videos
          </button>

        </div>
      </section>

      {/* VIDEO STATISTICS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <VideoStat
          label="Total Videos"
          value={videos.length}
          icon={Video}
          className="text-blue-400"
        />

        <VideoStat
          label="Completed"
          value={completed}
          icon={CheckCircle2}
          className="text-emerald-400"
        />

        <VideoStat
          label="Processing"
          value={processing}
          icon={Clock3}
          className="text-amber-400"
        />

        <VideoStat
          label="Failed"
          value={failed}
          icon={AlertTriangle}
          className="text-red-400"
        />

      </section>

      {/* SEARCH + FILTER */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

        <div className="flex flex-col lg:flex-row gap-3">

          <div className="relative flex-1">

            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search videos, descriptions or uploaders..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none focus:border-purple-500"
            />

          </div>

          <div className="relative">

            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="appearance-none w-full lg:w-56 rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-purple-500"
            >
              <option value="ALL">
                All Processing States
              </option>

              <option value="QUEUED">
                Queued
              </option>

              <option value="PROCESSING_FFMPEG">
                FFmpeg Processing
              </option>

              <option value="TRANSCRIBING_WHISPER">
                Whisper Transcription
              </option>

              <option value="SUMMARIZING_BART">
                BART Summarization
              </option>

              <option value="DETECTING_KEY_MOMENTS">
                Key Moments Detection
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="FAILED">
                Failed
              </option>

            </select>

          </div>

        </div>

      </section>

      {/* VIDEO TABLE */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

          <div>
            <h2 className="text-sm font-bold text-white">
              Media Inventory
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Showing {filteredVideos.length} of {videos.length} videos
            </p>
          </div>

          <PlayCircle className="w-5 h-5 text-purple-400" />

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-slate-950/80">

              <tr className="text-[10px] uppercase tracking-wider text-slate-500">

                <th className="px-6 py-4">
                  Video
                </th>

                <th className="px-6 py-4">
                  Uploader
                </th>

                <th className="px-6 py-4">
                  Category
                </th>

                <th className="px-6 py-4">
                  Processing
                </th>

                <th className="px-6 py-4">
                  Progress
                </th>

                <th className="px-6 py-4">
                  Views
                </th>

                <th className="px-6 py-4 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-800/70">

              {filteredVideos.map((video) => {

                const isDeleting =
                  deletingId === video.id;

                return (
                  <tr
                    key={video.id}
                    className="hover:bg-slate-950/50 transition-colors"
                  >

                    {/* VIDEO */}
                    <td className="px-6 py-4 min-w-[300px]">

                      <div className="flex items-center gap-3">

                        <div className="w-16 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">

                          {video.thumbnailUrl ? (
                            <img
                              src={getMediaUrl(
                                video.thumbnailUrl
                              )}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Video className="w-4 h-4 text-slate-600" />
                          )}

                        </div>

                        <div className="min-w-0">

                          <p className="text-xs font-bold text-white truncate max-w-[250px]">
                            {video.title}
                          </p>

                          <p className="text-[10px] text-slate-600 mt-1">
                            {video.fileName}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* UPLOADER */}
                    <td className="px-6 py-4">

                      <p className="text-xs font-semibold text-slate-300">
                        {video.uploaderName || 'Unknown'}
                      </p>

                      <p className="text-[10px] text-slate-600 mt-1">
                        {video.uploaderRole || '-'}
                      </p>

                    </td>

                    {/* CATEGORY */}
                    <td className="px-6 py-4">

                      <span className="inline-flex px-2.5 py-1 rounded-full border border-slate-700 bg-slate-950 text-[9px] font-bold text-slate-400">
                        {video.category || 'General'}
                      </span>

                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">
                      <StatusBadge status={video.status} />
                    </td>

                    {/* PROGRESS */}
                    <td className="px-6 py-4 min-w-[130px]">

                      <div className="flex items-center justify-between mb-1.5">

                        <span className="text-[10px] text-slate-500">
                          Progress
                        </span>

                        <span className="text-[10px] font-bold text-white">
                          {video.progress || 0}%
                        </span>

                      </div>

                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">

                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                video.progress || 0
                              )
                            )}%`,
                          }}
                        />

                      </div>

                    </td>

                    {/* VIEWS */}
                    <td className="px-6 py-4">

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">

                        <Eye className="w-3.5 h-3.5" />

                        {video.viewsCount || 0}

                      </div>

                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right">

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() =>
                          handleDelete(
                            video.id,
                            video.title
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[10px] font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      >

                        {isDeleting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}

                        Delete

                      </button>

                    </td>

                  </tr>
                );

              })}

            </tbody>

          </table>

          {filteredVideos.length === 0 && (
            <div className="py-16 text-center">

              <Video className="w-8 h-8 text-slate-700 mx-auto" />

              <p className="mt-3 text-sm font-semibold text-slate-400">
                No videos found
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Try another search or processing filter.
              </p>

            </div>
          )}

        </div>

      </section>

    </div>
  );
};

/* =========================================================
   COMPONENTS
========================================================= */

const VideoStat: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  className: string;
}> = ({
  label,
  value,
  icon: Icon,
  className,
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </p>

        <p className="mt-2 text-3xl font-black text-white">
          {value}
        </p>

      </div>

      <Icon className={`w-5 h-5 ${className}`} />

    </div>

  </div>
);

const StatusBadge: React.FC<{
  status: string;
}> = ({ status }) => {

  const config: Record<
    string,
    {
      label: string;
      classes: string;
      icon: React.ElementType;
    }
  > = {
    COMPLETED: {
      label: 'Completed',
      classes:
        'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
      icon: CheckCircle2,
    },

    FAILED: {
      label: 'Failed',
      classes:
        'text-red-300 bg-red-500/10 border-red-500/20',
      icon: AlertTriangle,
    },

    QUEUED: {
      label: 'Queued',
      classes:
        'text-slate-300 bg-slate-500/10 border-slate-500/20',
      icon: Clock3,
    },

    PROCESSING_FFMPEG: {
      label: 'FFmpeg',
      classes:
        'text-blue-300 bg-blue-500/10 border-blue-500/20',
      icon: Clock3,
    },

    TRANSCRIBING_WHISPER: {
      label: 'Whisper',
      classes:
        'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
      icon: Clock3,
    },

    SUMMARIZING_BART: {
      label: 'BART',
      classes:
        'text-purple-300 bg-purple-500/10 border-purple-500/20',
      icon: Clock3,
    },

    DETECTING_KEY_MOMENTS: {
      label: 'Key Moments',
      classes:
        'text-amber-300 bg-amber-500/10 border-amber-500/20',
      icon: Clock3,
    },
  };

  const current = config[status] || {
    label: status.replaceAll('_', ' '),
    classes:
      'text-slate-300 bg-slate-500/10 border-slate-500/20',
    icon: Clock3,
  };

  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${current.classes}`}
    >
      <Icon className="w-3 h-3" />
      {current.label}
    </span>
  );
};
