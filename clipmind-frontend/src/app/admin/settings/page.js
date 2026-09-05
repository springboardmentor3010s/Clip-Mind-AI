"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaCog,
  FaTools,
  FaRobot,
  FaUpload,
  FaGlobe,
  FaSave,
  FaSyncAlt,
} from "react-icons/fa";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/services/authService";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/services/adminService";

export default function AdminSettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState({
    maintenance_mode: false,
    ai_processing_enabled: true,
    max_upload_size_mb: 500,
    allow_public_registration: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load settings
  // --------------------------------------------------

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

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

      const response = await getPlatformSettings();

      setSettings({
        maintenance_mode:
          response?.maintenance_mode ?? false,

        ai_processing_enabled:
          response?.ai_processing_enabled ?? true,

        max_upload_size_mb:
          response?.max_upload_size_mb ?? 500,

        allow_public_registration:
          response?.allow_public_registration ?? true,
      });
    } catch (err) {
      console.error("Failed to load platform settings:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load platform settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // --------------------------------------------------
  // Handle toggle changes
  // --------------------------------------------------

  const handleToggle = (field) => {
    setSettings((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  // --------------------------------------------------
  // Handle upload size
  // --------------------------------------------------

  const handleUploadSizeChange = (event) => {
    setSettings((previous) => ({
      ...previous,
      max_upload_size_mb: event.target.value,
    }));
  };

  // --------------------------------------------------
  // Save settings
  // --------------------------------------------------

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const uploadSize = Number(
        settings.max_upload_size_mb
      );

      if (!uploadSize || uploadSize <= 0) {
        setError(
          "Maximum upload size must be greater than 0 MB."
        );
        return;
      }

      const updatedSettings = {
        maintenance_mode: settings.maintenance_mode,
        ai_processing_enabled:
          settings.ai_processing_enabled,
        max_upload_size_mb: uploadSize,
        allow_public_registration:
          settings.allow_public_registration,
      };

      const response = await updatePlatformSettings(
        updatedSettings
      );

      setSettings({
        maintenance_mode:
          response?.maintenance_mode ??
          updatedSettings.maintenance_mode,

        ai_processing_enabled:
          response?.ai_processing_enabled ??
          updatedSettings.ai_processing_enabled,

        max_upload_size_mb:
          response?.max_upload_size_mb ??
          updatedSettings.max_upload_size_mb,

        allow_public_registration:
          response?.allow_public_registration ??
          updatedSettings.allow_public_registration,
      });

      setMessage(
        "Platform settings updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update platform settings:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to update platform settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
          Loading platform settings...
        </div>
      </DashboardLayout>
    );
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <FaCog />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Platform Settings
              </h1>

              <p className="mt-1 text-slate-500">
                Configure platform behavior and system-wide
                settings.
              </p>
            </div>

          </div>

          <button
            onClick={loadSettings}
            disabled={loading || saving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <FaSyncAlt />
            Refresh
          </button>

        </div>

        {/* Success message */}
        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-200">

            <h2 className="text-xl font-semibold text-slate-900">
              General Platform Configuration
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              These settings affect the behavior of the
              ClipMind AI platform.
            </p>

          </div>

          <div className="divide-y divide-slate-200">

            {/* ==================================================
                MAINTENANCE MODE
            ================================================== */}

            <div className="p-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div className="flex items-start gap-4">

                  <div className="w-11 h-11 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <FaTools />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Maintenance Mode
                    </h3>

                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                      Temporarily place the platform into
                      maintenance mode while system
                      maintenance or updates are being
                      performed.
                    </p>

                    <p className="text-xs mt-2 text-slate-400">
                      Current status:{" "}
                      <span
                        className={
                          settings.maintenance_mode
                            ? "font-semibold text-orange-600"
                            : "font-semibold text-green-600"
                        }
                      >
                        {settings.maintenance_mode
                          ? "Maintenance enabled"
                          : "Platform operational"}
                      </span>
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleToggle("maintenance_mode")
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                    settings.maintenance_mode
                      ? "bg-orange-500"
                      : "bg-slate-300"
                  }`}
                  aria-label="Toggle maintenance mode"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      settings.maintenance_mode
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>

              </div>

            </div>

            {/* ==================================================
                AI PROCESSING
            ================================================== */}

            <div className="p-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div className="flex items-start gap-4">

                  <div className="w-11 h-11 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <FaRobot />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      AI Processing
                    </h3>

                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                      Enable or disable AI-powered video
                      processing, including transcription,
                      summaries, and other generated content.
                    </p>

                    <p className="text-xs mt-2 text-slate-400">
                      Current status:{" "}
                      <span
                        className={
                          settings.ai_processing_enabled
                            ? "font-semibold text-green-600"
                            : "font-semibold text-red-600"
                        }
                      >
                        {settings.ai_processing_enabled
                          ? "AI processing enabled"
                          : "AI processing disabled"}
                      </span>
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleToggle(
                      "ai_processing_enabled"
                    )
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                    settings.ai_processing_enabled
                      ? "bg-green-500"
                      : "bg-slate-300"
                  }`}
                  aria-label="Toggle AI processing"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      settings.ai_processing_enabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>

              </div>

            </div>

            {/* ==================================================
                MAX UPLOAD SIZE
            ================================================== */}

            <div className="p-6">

              <div className="flex items-start gap-4">

                <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <FaUpload />
                </div>

                <div className="flex-1">

                  <h3 className="font-semibold text-slate-900">
                    Maximum Upload Size
                  </h3>

                  <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                    Set the maximum size allowed for uploaded
                    video files.
                  </p>

                  <div className="mt-5 flex items-center gap-3 max-w-md">

                    <input
                      type="number"
                      min="1"
                      value={
                        settings.max_upload_size_mb
                      }
                      onChange={
                        handleUploadSizeChange
                      }
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />

                    <span className="text-sm font-medium text-slate-500">
                      MB
                    </span>

                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Current limit:{" "}
                    {settings.max_upload_size_mb} MB
                  </p>

                </div>

              </div>

            </div>

            {/* ==================================================
                PUBLIC REGISTRATION
            ================================================== */}

            <div className="p-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div className="flex items-start gap-4">

                  <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <FaGlobe />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Public Registration
                    </h3>

                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                      Allow new users to register accounts
                      through the public registration page.
                    </p>

                    <p className="text-xs mt-2 text-slate-400">
                      Current status:{" "}
                      <span
                        className={
                          settings.allow_public_registration
                            ? "font-semibold text-green-600"
                            : "font-semibold text-red-600"
                        }
                      >
                        {settings.allow_public_registration
                          ? "Registration open"
                          : "Registration disabled"}
                      </span>
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleToggle(
                      "allow_public_registration"
                    )
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                    settings.allow_public_registration
                      ? "bg-green-500"
                      : "bg-slate-300"
                  }`}
                  aria-label="Toggle public registration"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      settings.allow_public_registration
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>

              </div>

            </div>

          </div>

          {/* Save footer */}
          <div className="px-6 py-5 bg-slate-50 border-t border-slate-200 flex justify-end">

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
            >
              <FaSave />

              {saving
                ? "Saving..."
                : "Save Settings"}
            </button>

          </div>

        </div>

        {/* Information card */}
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">

          <div className="flex items-start gap-3">

            <FaCog className="text-purple-600 mt-1" />

            <div>
              <h3 className="font-semibold text-purple-900">
                Administrator Controls
              </h3>

              <p className="text-sm text-purple-700 mt-1">
                Changes made here affect the platform
                globally. Use maintenance mode carefully
                because it is intended for temporary
                administrative operations.
              </p>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}