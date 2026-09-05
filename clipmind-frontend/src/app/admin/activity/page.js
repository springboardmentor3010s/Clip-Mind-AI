"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaClipboardList,
  FaSyncAlt,
  FaUser,
  FaClock,
  FaInfoCircle,
} from "react-icons/fa";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/services/authService";
import { getAdminActivity } from "@/services/adminService";

export default function AdminActivityPage() {
  const router = useRouter();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Load platform activity
  // --------------------------------------------------

  const loadActivity = async () => {
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

      const response = await getAdminActivity();

      setActivities(response || []);
    } catch (err) {
      console.error("Failed to load platform activity:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load platform activity. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getActivityUser = (activity) => {
    if (activity.username) return activity.username;
    if (activity.user?.username) return activity.user.username;
    if (activity.user?.email) return activity.user.email;
    if (activity.user_id) return `User #${activity.user_id}`;

    return "System";
  };

  const getActivityType = (activity) => {
    return (
      activity.activity_type ||
      activity.action_type ||
      activity.type ||
      "ACTIVITY"
    );
  };

  const getActivityDescription = (activity) => {
    return (
      activity.description ||
      activity.details ||
      activity.message ||
      "Platform activity recorded."
    );
  };

  const getActivityDate = (activity) => {
    return (
      activity.created_at ||
      activity.timestamp ||
      activity.occurred_at ||
      activity.date
    );
  };

  const formatActivityType = (type) => {
    return String(type)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleString();
  };

  const getTypeBadge = (type) => {
    const normalized = String(type).toUpperCase();

    let classes = "bg-slate-100 text-slate-700";

    if (
      normalized.includes("LOGIN") ||
      normalized.includes("REGISTER")
    ) {
      classes = "bg-blue-100 text-blue-700";
    } else if (
      normalized.includes("UPLOAD") ||
      normalized.includes("VIDEO")
    ) {
      classes = "bg-purple-100 text-purple-700";
    } else if (
      normalized.includes("DELETE") ||
      normalized.includes("DEACTIVATE")
    ) {
      classes = "bg-red-100 text-red-700";
    } else if (
      normalized.includes("CREATE") ||
      normalized.includes("PROMOTE") ||
      normalized.includes("ACTIVATE")
    ) {
      classes = "bg-green-100 text-green-700";
    } else if (
      normalized.includes("UPDATE") ||
      normalized.includes("SETTING")
    ) {
      classes = "bg-orange-100 text-orange-700";
    }

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${classes}`}
      >
        {formatActivityType(type)}
      </span>
    );
  };

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
                <FaClipboardList />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Platform Activity
                </h1>

                <p className="mt-1 text-slate-500">
                  Monitor activity performed across the ClipMind AI
                  platform.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadActivity}
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

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <FaClipboardList />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Total Activities
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {activities.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <FaUser />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Users With Activity
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {
                    new Set(
                      activities.map(
                        (activity) =>
                          activity.user_id ||
                          activity.user?.id ||
                          activity.username ||
                          activity.user?.username
                      )
                    ).size
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                <FaClock />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Latest Activity
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {activities.length > 0
                    ? formatDate(getActivityDate(activities[0]))
                    : "No activity"}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Activity List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              All Platform Activity
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Review actions performed by users across ClipMind AI.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading platform activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="p-10 text-center">
              <FaInfoCircle className="mx-auto text-3xl text-slate-300 mb-3" />

              <p className="text-slate-500">
                No platform activity has been recorded yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {activities.map((activity, index) => {
                const type = getActivityType(activity);

                return (
                  <div
                    key={activity.id || index}
                    className="px-6 py-5 hover:bg-slate-50 transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                      {/* Activity information */}
                      <div className="flex items-start gap-4">

                        <div className="w-10 h-10 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center text-purple-600">
                          <FaClipboardList />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {getTypeBadge(type)}

                            <span className="text-sm font-semibold text-slate-800">
                              {getActivityUser(activity)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-600">
                            {getActivityDescription(activity)}
                          </p>
                        </div>

                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-sm text-slate-400 lg:ml-4">
                        <FaClock />

                        <span>
                          {formatDate(getActivityDate(activity))}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}