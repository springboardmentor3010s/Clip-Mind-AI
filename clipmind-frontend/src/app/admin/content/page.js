"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaVideo,
  FaSyncAlt,
  FaTrash,
  FaUser,
  FaClock,
  FaDatabase,
  FaCheckCircle,
  FaSpinner,
  FaExclamationCircle,
} from "react-icons/fa";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/services/authService";
import {
  getAdminVideos,
  deleteAdminVideo,
} from "@/services/adminService";

export default function AdminContentPage() {
  const router = useRouter();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // Load all platform videos
  // --------------------------------------------------

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const meResponse = await getCurrentUser(token);

      if (meResponse?.user?.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }

      const response = await getAdminVideos();

      setVideos(response || []);
    } catch (err) {
      console.error("Failed to load admin videos:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load uploaded content. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // --------------------------------------------------
  // Delete video
  // --------------------------------------------------

  const handleDelete = async (video) => {
    const videoName =
      video.filename ||
      video.title ||
      `Video #${video.id}`;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${videoName}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await deleteAdminVideo(video.id);

      setSuccess(`"${videoName}" was deleted successfully.`);

      await loadVideos();
    } catch (err) {
      console.error("Failed to delete video:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to delete this video. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getOwnerName = (video) => {
    if (video.owner?.username) {
      return video.owner.username;
    }

    if (video.owner?.full_name) {
      return video.owner.full_name;
    }

    if (video.owner?.email) {
      return video.owner.email;
    }

    if (video.owner_id) {
      return `User #${video.owner_id}`;
    }

    return "Unknown user";
  };

  const getVideoStatus = (video) => {
    return String(video.status || "UNKNOWN").toUpperCase();
  };

  const getStatusBadge = (status) => {
    const normalized = String(status).toUpperCase();

    if (normalized === "COMPLETED" || normalized === "COMPLETE") {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
          <FaCheckCircle />
          Completed
        </span>
      );
    }

    if (
      normalized === "PROCESSING" ||
      normalized === "IN_PROGRESS"
    ) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
          <FaSpinner />
          Processing
        </span>
      );
    }

    if (normalized === "FAILED") {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
          <FaExclamationCircle />
          Failed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
        {status || "Unknown"}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === null || bytes === undefined) {
      return "—";
    }

    const size = Number(bytes);

    if (Number.isNaN(size)) {
      return "—";
    }

    if (size === 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const index = Math.floor(Math.log(size) / Math.log(1024));

    return `${(size / Math.pow(1024, index)).toFixed(
      index === 0 ? 0 : 2
    )} ${units[index] || "TB"}`;
  };

  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) {
      return "—";
    }

    const totalSeconds = Math.round(Number(seconds));

    if (Number.isNaN(totalSeconds)) {
      return "—";
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleString();
  };

  const getCreatedDate = (video) => {
    return (
      video.created_at ||
      video.uploaded_at ||
      video.createdAt
    );
  };

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const completedVideos = videos.filter((video) => {
    const status = getVideoStatus(video);

    return status === "COMPLETED" || status === "COMPLETE";
  }).length;

  const processingVideos = videos.filter((video) => {
    const status = getVideoStatus(video);

    return (
      status === "PROCESSING" ||
      status === "IN_PROGRESS"
    );
  }).length;

  const failedVideos = videos.filter((video) => {
    return getVideoStatus(video) === "FAILED";
  }).length;

  const totalStorage = videos.reduce((total, video) => {
    const size = Number(video.file_size);

    return total + (Number.isNaN(size) ? 0 : size);
  }, 0);

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                <FaVideo />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Manage Content
                </h1>

                <p className="mt-1 text-slate-500">
                  Monitor and manage all uploaded videos across
                  ClipMind AI.
                </p>
              </div>

            </div>
          </div>

          <button
            onClick={loadVideos}
            disabled={loading || actionLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <FaSyncAlt />
            Refresh
          </button>

        </div>

        {/* Success */}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Total */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <FaVideo />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total Videos
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {videos.length}
                </p>
              </div>

            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                <FaCheckCircle />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Completed
                </p>

                <p className="mt-1 text-2xl font-bold text-green-600">
                  {completedVideos}
                </p>
              </div>

            </div>
          </div>

          {/* Processing */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <FaSpinner />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Processing
                </p>

                <p className="mt-1 text-2xl font-bold text-blue-600">
                  {processingVideos}
                </p>
              </div>

            </div>
          </div>

          {/* Storage */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <FaDatabase />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Content Storage
                </p>

                <p className="mt-1 text-2xl font-bold text-orange-600">
                  {formatFileSize(totalStorage)}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Content table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              Uploaded Videos
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              View and manage all videos uploaded to the platform.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading uploaded content...
            </div>
          ) : videos.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No uploaded videos found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 border-b border-slate-200">

                  <tr>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Video
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Uploaded By
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Status
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Size
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Duration
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Uploaded
                    </th>

                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {videos.map((video, index) => (

                    <tr
                      key={video.id || index}
                      className="hover:bg-slate-50 transition"
                    >

                      {/* Video */}
                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                            <FaVideo />
                          </div>

                          <div className="min-w-0">

                            <p
                              className="font-semibold text-slate-900 truncate max-w-xs"
                              title={
                                video.filename ||
                                video.title ||
                                "Untitled video"
                              }
                            >
                              {video.filename ||
                                video.title ||
                                "Untitled video"}
                            </p>

                            <p className="text-xs text-slate-400">
                              Video #{video.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Owner */}
                      <td className="px-6 py-4">

                        <div className="flex items-center gap-2">

                          <FaUser className="text-slate-400" />

                          <span className="text-sm text-slate-700">
                            {getOwnerName(video)}
                          </span>

                        </div>

                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(
                          getVideoStatus(video)
                        )}
                      </td>

                      {/* Size */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatFileSize(video.file_size)}
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4">

                        <div className="flex items-center gap-2 text-sm text-slate-600">

                          <FaClock className="text-slate-400" />

                          {formatDuration(video.duration)}

                        </div>

                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(getCreatedDate(video))}
                      </td>

                      {/* Delete */}
                      <td className="px-6 py-4">

                        <div className="flex justify-end">

                          <button
                            onClick={() => handleDelete(video)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium disabled:opacity-50"
                            title="Delete video"
                          >
                            <FaTrash />
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* Additional information */}
        {!loading && videos.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <FaExclamationCircle />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">
                  Content Management
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Administrators can review platform-wide video
                  content and remove videos when necessary.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

