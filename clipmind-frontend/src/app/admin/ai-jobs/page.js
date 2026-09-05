"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaTasks,
  FaSyncAlt,
  FaCheckCircle,

  FaSpinner,
  FaExclamationCircle,
  FaVideo,
  FaClock,
  FaUser,
} from "react-icons/fa";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/services/authService";
import { getProcessingJobs } from "@/services/adminService";

export default function AdminAIJobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState({
    processing: [],
    completed: [],
    failed: [],
  });

  const [counts, setCounts] = useState({
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load processing jobs
  // --------------------------------------------------

  const loadJobs = async () => {
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

      const response = await getProcessingJobs();

      setJobs({
        processing: response?.processing || [],
        completed: response?.completed || [],
        failed: response?.failed || [],
      });

      setCounts({
        processing: response?.counts?.processing || 0,
        completed: response?.counts?.completed || 0,
        failed: response?.counts?.failed || 0,
        total: response?.counts?.total || 0,
        });
    } catch (err) {
      console.error(
        "Failed to load AI processing jobs:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load AI processing jobs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
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

  const formatDuration = (seconds) => {
    if (
      seconds === null ||
      seconds === undefined ||
      Number.isNaN(Number(seconds))
    ) {
      return "—";
    }

    const totalSeconds = Math.round(Number(seconds));

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${remainingSeconds}s`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  };

  const getVideoName = (job) => {
    return (
      job?.filename ||
      job?.video_filename ||
      job?.video?.filename ||
      `Video #${job?.id || job?.video_id || "—"}`
    );
  };

  const getVideoId = (job) => {
    return (
      job?.video_id ||
      job?.video?.id ||
      job?.id ||
      "—"
    );
  };

  const getOwnerName = (job) => {
    return (
      job?.owner?.username ||
      job?.owner_username ||
      job?.uploaded_by ||
      "—"
    );
  };

  // --------------------------------------------------
  // Job table
  // --------------------------------------------------

  const JobTable = ({
    data,
    status,
  }) => {
    if (!data || data.length === 0) {
      return (
        <div className="p-10 text-center">

          {status === "processing" && (
            <>
              <FaSpinner className="mx-auto text-3xl text-blue-400 mb-3" />

              <h3 className="font-semibold text-slate-700">
                No videos are currently processing
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                All submitted videos have finished
                processing.
              </p>
            </>
          )}

          {status === "completed" && (
            <>
              <FaCheckCircle className="mx-auto text-3xl text-green-400 mb-3" />

              <h3 className="font-semibold text-slate-700">
                No completed jobs found
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Completed processing jobs will appear here.
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <FaExclamationCircle className="mx-auto text-3xl text-red-400 mb-3" />

              <h3 className="font-semibold text-slate-700">
                No failed jobs
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Failed AI processing jobs will appear here.
              </p>
            </>
          )}

        </div>
      );
    }

    return (
      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-50 border-b border-slate-200">

            <tr>

              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                Video
              </th>

              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                Uploaded By
              </th>

              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                Status
              </th>

              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                Duration
              </th>

              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                Created
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-slate-100">

            {data.map((job, index) => (

              <tr
                key={
                  job?.id ||
                  job?.video_id ||
                  index
                }
                className="hover:bg-slate-50 transition"
              >

                {/* Video */}
                <td className="px-5 py-4">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <FaVideo />
                    </div>

                    <div className="min-w-0">

                      <p
                        className="font-medium text-slate-900 truncate max-w-xs"
                        title={getVideoName(job)}
                      >
                        {getVideoName(job)}
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Video #{getVideoId(job)}
                      </p>

                    </div>

                  </div>

                </td>

                {/* Owner */}
                <td className="px-5 py-4">

                  <div className="flex items-center gap-2 text-sm text-slate-600">

                    <FaUser className="text-slate-400" />

                    {getOwnerName(job)}

                  </div>

                </td>

                {/* Status */}
                <td className="px-5 py-4">

                  {status === "processing" && (
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      <FaSpinner />
                      Processing
                    </span>
                  )}

                  {status === "completed" && (
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <FaCheckCircle />
                      Completed
                    </span>
                  )}

                  {status === "failed" && (
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                      <FaExclamationCircle />
                      Failed
                    </span>
                  )}

                </td>

                {/* Duration */}
                <td className="px-5 py-4">

                  <div className="flex items-center gap-2 text-sm text-slate-600">

                    <FaClock className="text-slate-400" />

                    {formatDuration(job?.duration)}

                  </div>

                </td>

                {/* Created */}
                <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">

                  {formatDate(
                    job?.created_at ||
                      job?.createdAt
                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>
    );
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <DashboardLayout>

      <div className="space-y-6">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <FaTasks />
            </div>

            <div>

              <h1 className="text-3xl font-bold text-slate-900">
                AI Processing Jobs
              </h1>

              <p className="mt-1 text-slate-500">
                Monitor AI-powered video processing across
                the ClipMind AI platform.
              </p>

            </div>

          </div>

          <button
            onClick={loadJobs}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <FaSyncAlt />
            Refresh
          </button>

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
            Loading AI processing jobs...
          </div>

        ) : (

          <>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Total */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <FaTasks />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Total Jobs
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formatNumber(counts.total)}
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
                      {formatNumber(
                        counts.processing
                      )}
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
                      {formatNumber(
                        counts.completed
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* Failed */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <FaExclamationCircle />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Failed
                    </p>

                    <p className="mt-1 text-2xl font-bold text-red-600">
                      {formatNumber(
                        counts.failed
                      )}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                CURRENTLY PROCESSING
            ================================================== */}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-200">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <FaSpinner />
                  </div>

                  <div>

                    <h2 className="text-xl font-semibold text-slate-900">
                      Currently Processing
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Videos currently being processed by
                      the AI pipeline.
                    </p>

                  </div>

                </div>

              </div>

              <JobTable
                data={jobs.processing}
                status="processing"
              />

            </div>

            {/* ==================================================
                COMPLETED
            ================================================== */}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-200">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <FaCheckCircle />
                  </div>

                  <div>

                    <h2 className="text-xl font-semibold text-slate-900">
                      Completed Jobs
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Videos that completed AI processing
                      successfully.
                    </p>

                  </div>

                </div>

              </div>

              <JobTable
                data={jobs.completed}
                status="completed"
              />

            </div>

            {/* ==================================================
                FAILED
            ================================================== */}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-200">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <FaExclamationCircle />
                  </div>

                  <div>

                    <h2 className="text-xl font-semibold text-slate-900">
                      Failed Jobs
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Videos whose AI processing failed.
                    </p>

                  </div>

                </div>

              </div>

              <JobTable
                data={jobs.failed}
                status="failed"
              />

            </div>

          </>

        )}

      </div>

    </DashboardLayout>
  );
}