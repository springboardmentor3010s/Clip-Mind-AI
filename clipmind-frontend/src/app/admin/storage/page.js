"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaDatabase,
  FaSyncAlt,
  FaFile,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHdd,
  FaServer,
} from "react-icons/fa";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/services/authService";
import { getStorageUtilization } from "@/services/adminService";

export default function AdminStoragePage() {
  const router = useRouter();

  const [storage, setStorage] = useState({
    total_files: 0,
    existing_files: 0,
    missing_files: 0,
    total_bytes: 0,
    total_mb: 0,
    total_gb: 0,
    missing_file_list: [],
});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load storage information
  // --------------------------------------------------

  const loadStorage = async () => {
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

      const response = await getStorageUtilization();

      setStorage({
        total_files: response?.storage?.total_files || 0,
        existing_files: response?.storage?.existing_files || 0,
        missing_files: response?.storage?.missing_files || 0,
        total_bytes: response?.storage?.total_bytes || 0,
        total_mb: response?.storage?.total_mb || 0,
        total_gb: response?.storage?.total_gb || 0,
        missing_file_list:
            response?.storage?.missing_file_list || [],
     });
    } catch (err) {
      console.error(
        "Failed to load storage utilization:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load storage utilization."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const formatNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      Number.isNaN(Number(value))
    ) {
      return "0";
    }

    return Number(value).toLocaleString();
  };

  const formatBytes = (bytes) => {
    if (
      bytes === null ||
      bytes === undefined ||
      Number.isNaN(Number(bytes)) ||
      Number(bytes) <= 0
    ) {
      return "0 B";
    }

    const units = [
      "B",
      "KB",
      "MB",
      "GB",
      "TB",
    ];

    let size = Number(bytes);
    let unitIndex = 0;

    while (
      size >= 1024 &&
      unitIndex < units.length - 1
    ) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
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

  const getExistingPercentage = () => {
    if (!storage.total_files) {
      return 0;
    }

    return Math.round(
      (storage.existing_files /
        storage.total_files) *
        100
    );
  };

  const getMissingPercentage = () => {
    if (!storage.total_files) {
      return 0;
    }

    return Math.round(
      (storage.missing_files /
        storage.total_files) *
        100
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
              <FaDatabase />
            </div>

            <div>

              <h1 className="text-3xl font-bold text-slate-900">
                Storage & Resources
              </h1>

              <p className="mt-1 text-slate-500">
                Monitor storage usage and platform
                resource utilization.
              </p>

            </div>

          </div>

          <button
            onClick={loadStorage}
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
            Loading storage information...
          </div>

        ) : (

          <>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Total Files */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <FaFile />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Total Files
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formatNumber(
                        storage.total_files
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* Existing Files */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <FaCheckCircle />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Existing Files
                    </p>

                    <p className="mt-1 text-2xl font-bold text-green-600">
                      {formatNumber(
                        storage.existing_files
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* Missing Files */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <FaExclamationTriangle />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Missing Files
                    </p>

                    <p className="mt-1 text-2xl font-bold text-red-600">
                      {formatNumber(
                        storage.missing_files
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* Storage Used */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <FaHdd />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Recorded Storage
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {Number(
                        storage.total_gb || 0
                      ).toFixed(2)}{" "}
                      GB
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                STORAGE OVERVIEW
            ================================================== */}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-200">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <FaServer />
                  </div>

                  <div>

                    <h2 className="text-xl font-semibold text-slate-900">
                      Storage Overview
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Current storage consumption across
                      uploaded platform files.
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Storage Details */}
                  <div className="rounded-xl border border-slate-200 p-5">

                    <h3 className="font-semibold text-slate-900">
                      Storage Details
                    </h3>

                    <div className="mt-5 space-y-4">

                      <div className="flex items-center justify-between">

                        <span className="text-sm text-slate-500">
                          Recorded Storage
                        </span>

                        <span className="font-semibold text-slate-900">
                          {Number(
                            storage.total_gb || 0
                          ).toFixed(2)}{" "}
                          GB
                        </span>

                      </div>

                      <div className="flex items-center justify-between">

                        <span className="text-sm text-slate-500">
                          Megabytes
                        </span>

                        <span className="font-semibold text-slate-900">
                          {Number(
                            storage.total_mb || 0
                          ).toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 2,
                            }
                          )}{" "}
                          MB
                        </span>

                      </div>

                      <div className="flex items-center justify-between">

                        <span className="text-sm text-slate-500">
                          Bytes
                        </span>

                        <span className="font-semibold text-slate-900">
                          {formatNumber(
                            storage.total_bytes
                          )}{" "}
                          B
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* File Health */}
                  <div className="rounded-xl border border-slate-200 p-5">

                    <h3 className="font-semibold text-slate-900">
                      File Health
                    </h3>

                    <div className="mt-5 space-y-5">

                      {/* Existing */}
                      <div>

                        <div className="flex justify-between mb-2">

                          <span className="text-sm text-slate-600">
                            Existing files
                          </span>

                          <span className="text-sm font-semibold text-green-600">
                            {getExistingPercentage()}%
                          </span>

                        </div>

                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">

                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{
                              width: `${getExistingPercentage()}%`,
                            }}
                          />

                        </div>

                      </div>

                      {/* Missing */}
                      <div>

                        <div className="flex justify-between mb-2">

                          <span className="text-sm text-slate-600">
                            Missing files
                          </span>

                          <span className="text-sm font-semibold text-red-600">
                            {getMissingPercentage()}%
                          </span>

                        </div>

                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">

                          <div
                            className="h-full bg-red-500 rounded-full transition-all"
                            style={{
                              width: `${getMissingPercentage()}%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* ==================================================
    MISSING FILES
================================================== */}

{storage.missing_file_list.length > 0 && (

  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

    <div className="px-6 py-5 border-b border-slate-200">

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
          <FaExclamationTriangle />
        </div>

        <div>

          <h2 className="text-xl font-semibold text-slate-900">
            Missing Files
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            These video records exist in the database,
            but their physical files could not be found.
          </p>

        </div>

      </div>

    </div>

    <div className="overflow-x-auto">

      <table className="w-full">

        <thead className="bg-slate-50 border-b border-slate-200">

          <tr>

            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
              Video
            </th>

            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
              Video ID
            </th>

            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
              Stored Path
            </th>

            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
              Created
            </th>

          </tr>

        </thead>

        <tbody className="divide-y divide-slate-100">

          {storage.missing_file_list.map(
            (file) => (

              <tr
                key={file.id}
                className="hover:bg-slate-50 transition"
              >

                {/* Filename */}
                <td className="px-5 py-4">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                      <FaExclamationTriangle />
                    </div>

                    <div className="min-w-0">

                      <p
                        className="font-medium text-slate-900 truncate max-w-xs"
                        title={
                          file.filename ||
                          "Unknown file"
                        }
                      >
                        {file.filename ||
                          "Unknown file"}
                      </p>

                    </div>

                  </div>

                </td>

                {/* ID */}
                <td className="px-5 py-4 text-sm text-slate-600">
                  #{file.id}
                </td>

                {/* Path */}
                <td className="px-5 py-4">

                  <p
                    className="text-sm text-slate-500 max-w-md truncate"
                    title={
                      file.filepath ||
                      "No file path recorded"
                    }
                  >
                    {file.filepath ||
                      "No file path recorded"}
                  </p>

                </td>

                {/* Created */}
                <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                  {formatDate(
                    file.created_at
                  )}
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>

  </div>

)}

            {/* ==================================================
                RESOURCE STATUS
            ================================================== */}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">

              <div className="flex items-start gap-4">

                <div className="w-11 h-11 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <FaDatabase />
                </div>

                <div>

                  <h2 className="text-xl font-semibold text-slate-900">
                    Resource Status
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Storage resources are being tracked
                    from the platform database and uploaded
                    media files.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">

                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                      <FaCheckCircle />
                      Storage Monitoring Active
                    </span>

                    {storage.missing_files > 0 ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                        <FaExclamationTriangle />
                        Missing Files Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        <FaCheckCircle />
                        All Files Available
                      </span>
                    )}

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