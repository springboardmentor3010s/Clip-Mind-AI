"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaChartBar,
  FaUsers,
  FaVideo,
  FaDatabase,
  FaClock,
  FaUserShield,
  FaGraduationCap,
  FaUserTie,
  FaUserFriends,
  FaCheckCircle,
  FaSpinner,
  FaExclamationCircle,
  FaSyncAlt,
} from "react-icons/fa";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/services/authService";
import { getSystemAnalytics } from "@/services/adminService";

export default function AdminAnalyticsPage() {
  const router = useRouter();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load system analytics
  // --------------------------------------------------

  const loadAnalytics = async () => {
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

      const response = await getSystemAnalytics();

      setAnalytics(response);
    } catch (err) {
      console.error("Failed to load system analytics:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load system analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const formatNumber = (value) => {
    if (value === null || value === undefined) {
      return "0";
    }

    return Number(value).toLocaleString();
  };

  const formatStorage = (value) => {
    if (value === null || value === undefined) {
      return "0";
    }

    return Number(value).toFixed(2);
  };

  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) {
      return "0m";
    }

    const totalSeconds = Math.round(Number(seconds));

    if (Number.isNaN(totalSeconds)) {
      return "0m";
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  const getPercentage = (value, total) => {
    if (!total || !value) {
      return 0;
    }

    return Math.min((Number(value) / Number(total)) * 100, 100);
  };

  // --------------------------------------------------
  // Safe analytics sections
  // --------------------------------------------------

  const users = analytics?.users || {};
  const videos = analytics?.videos || {};
  const storage = analytics?.storage || {};
  const processing = analytics?.processing || {};

  const totalUsers = Number(users.total || 0);
  const totalVideos = Number(videos.total || 0);

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
                <FaChartBar />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  System Analytics
                </h1>

                <p className="mt-1 text-slate-500">
                  Monitor users, videos, storage, and processing
                  across the ClipMind AI platform.
                </p>
              </div>

            </div>
          </div>

          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <FaSyncAlt />
            Refresh
          </button>

        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
            Loading system analytics...
          </div>
        ) : (
          <>
            {/* ==================================================
                PLATFORM OVERVIEW
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Users */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <FaUsers />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Total Users
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formatNumber(users.total)}
                    </p>
                  </div>

                </div>
              </div>

              {/* Videos */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <FaVideo />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Total Videos
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {formatNumber(videos.total)}
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
                      Storage Used
                    </p>

                    <p className="mt-1 text-2xl font-bold text-orange-600">
                      {formatStorage(storage.total_gb)} GB
                    </p>
                  </div>

                </div>
              </div>

              {/* Duration */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <FaClock />
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Video Duration
                    </p>

                    <p className="mt-1 text-2xl font-bold text-green-600">
                      {formatDuration(
                        processing.total_video_duration_seconds
                      )}
                    </p>
                  </div>

                </div>
              </div>

            </div>

            {/* ==================================================
                USER ANALYTICS
            ================================================== */}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-200">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <FaUsers />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      User Analytics
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Distribution and account status of platform
                      users.
                    </p>
                  </div>

                </div>

              </div>

              <div className="p-6">

                {/* User status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                  <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                    <div className="flex items-center gap-3">
                      <FaCheckCircle className="text-green-600" />

                      <div>
                        <p className="text-sm text-slate-500">
                          Active Users
                        </p>

                        <p className="text-2xl font-bold text-green-600">
                          {formatNumber(users.active)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-red-50 border border-red-100 p-4">
                    <div className="flex items-center gap-3">
                      <FaExclamationCircle className="text-red-600" />

                      <div>
                        <p className="text-sm text-slate-500">
                          Inactive Users
                        </p>

                        <p className="text-2xl font-bold text-red-600">
                          {formatNumber(users.inactive)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-purple-50 border border-purple-100 p-4">
                    <div className="flex items-center gap-3">
                      <FaUserShield className="text-purple-600" />

                      <div>
                        <p className="text-sm text-slate-500">
                          Administrators
                        </p>

                        <p className="text-2xl font-bold text-purple-600">
                          {formatNumber(users.admins)}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* User role distribution */}
                <div className="space-y-5">

                  {/* Learners */}
                  <div>
                    <div className="flex justify-between items-center mb-2">

                      <div className="flex items-center gap-2">
                        <FaGraduationCap className="text-green-600" />

                        <span className="text-sm font-medium text-slate-700">
                          Learners
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-slate-900">
                        {formatNumber(users.learners)}
                      </span>

                    </div>

                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${getPercentage(
                            users.learners,
                            totalUsers
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Educators */}
                  <div>
                    <div className="flex justify-between items-center mb-2">

                      <div className="flex items-center gap-2">
                        <FaUserTie className="text-blue-600" />

                        <span className="text-sm font-medium text-slate-700">
                          Educators
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-slate-900">
                        {formatNumber(users.educators)}
                      </span>

                    </div>

                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${getPercentage(
                            users.educators,
                            totalUsers
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Content Creators */}
                  <div>
                    <div className="flex justify-between items-center mb-2">

                      <div className="flex items-center gap-2">
                        <FaUserFriends className="text-orange-600" />

                        <span className="text-sm font-medium text-slate-700">
                          Content Creators
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-slate-900">
                        {formatNumber(users.content_creators)}
                      </span>

                    </div>

                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{
                          width: `${getPercentage(
                            users.content_creators,
                            totalUsers
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                VIDEO ANALYTICS
            ================================================== */}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-200">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <FaVideo />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Video Analytics
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Processing status of uploaded videos.
                    </p>
                  </div>

                </div>

              </div>

              <div className="p-6">

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                  {/* Total */}
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-5">

                    <p className="text-sm text-slate-500">
                      Total Videos
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {formatNumber(videos.total)}
                    </p>

                  </div>

                  {/* Completed */}
                  <div className="rounded-lg bg-green-50 border border-green-100 p-5">

                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-600" />

                      <p className="text-sm text-slate-500">
                        Completed
                      </p>
                    </div>

                    <p className="mt-2 text-3xl font-bold text-green-600">
                      {formatNumber(videos.completed)}
                    </p>

                  </div>

                  {/* Processing */}
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-5">

                    <div className="flex items-center gap-2">
                      <FaSpinner className="text-blue-600" />

                      <p className="text-sm text-slate-500">
                        Processing
                      </p>
                    </div>

                    <p className="mt-2 text-3xl font-bold text-blue-600">
                      {formatNumber(videos.processing)}
                    </p>

                  </div>

                  {/* Failed */}
                  <div className="rounded-lg bg-red-50 border border-red-100 p-5">

                    <div className="flex items-center gap-2">
                      <FaExclamationCircle className="text-red-600" />

                      <p className="text-sm text-slate-500">
                        Failed
                      </p>
                    </div>

                    <p className="mt-2 text-3xl font-bold text-red-600">
                      {formatNumber(videos.failed)}
                    </p>

                  </div>

                </div>

                {/* Completion percentage */}
                <div className="mt-8">

                  <div className="flex justify-between items-center mb-2">

                    <span className="text-sm font-medium text-slate-700">
                      Video Processing Completion
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {getPercentage(
                        videos.completed,
                        totalVideos
                      ).toFixed(1)}
                      %
                    </span>

                  </div>

                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${getPercentage(
                          videos.completed,
                          totalVideos
                        )}%`,
                      }}
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                STORAGE & PROCESSING
            ================================================== */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Storage */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">

                <div className="flex items-center gap-3 mb-6">

                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <FaDatabase />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Storage Analytics
                    </h2>

                    <p className="text-sm text-slate-500">
                      Platform storage consumption.
                    </p>
                  </div>

                </div>

                <div className="space-y-5">

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      Total Bytes
                    </span>

                    <span className="font-semibold text-slate-900">
                      {formatNumber(storage.total_bytes)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      Total MB
                    </span>

                    <span className="font-semibold text-slate-900">
                      {formatStorage(storage.total_mb)} MB
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      Total GB
                    </span>

                    <span className="font-semibold text-orange-600 text-lg">
                      {formatStorage(storage.total_gb)} GB
                    </span>
                  </div>

                </div>

              </div>

              {/* Processing */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">

                <div className="flex items-center gap-3 mb-6">

                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <FaClock />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Processing Analytics
                    </h2>

                    <p className="text-sm text-slate-500">
                      Total video processing workload.
                    </p>
                  </div>

                </div>

                <div className="space-y-5">

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      Duration (Seconds)
                    </span>

                    <span className="font-semibold text-slate-900">
                      {formatNumber(
                        processing.total_video_duration_seconds
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      Duration (Minutes)
                    </span>

                    <span className="font-semibold text-slate-900">
                      {formatNumber(
                        processing.total_video_duration_minutes
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      Human-readable Duration
                    </span>

                    <span className="font-semibold text-green-600 text-lg">
                      {formatDuration(
                        processing.total_video_duration_seconds
                      )}
                    </span>
                  </div>

                </div>

              </div>

            </div>

          </>
        )}

      </div>
    </DashboardLayout>
  );
}