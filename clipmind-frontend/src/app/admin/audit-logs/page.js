"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaClipboardList,
  FaSyncAlt,
  FaSearch,
  FaFilter,
  FaUser,
  FaClock,
  FaHistory,
  FaChartBar,
} from "react-icons/fa";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/services/authService";
import { getAdminActivity } from "@/services/adminService";

export default function AdminAuditLogsPage() {
  const router = useRouter();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");

  // --------------------------------------------------
  // Load audit logs
  // --------------------------------------------------

  const loadAuditLogs = async () => {
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

      setActivities(
        Array.isArray(response)
          ? response
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load audit logs:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

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

  const formatActivityType = (type) => {
    if (!type) {
      return "Unknown";
    }

    return String(type)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getActivityBadgeClass = (type) => {
    const normalized = String(
      type || ""
    ).toUpperCase();

    if (
      normalized.includes("DELETE") ||
      normalized.includes("DEACTIVATE") ||
      normalized.includes("FAIL")
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      normalized.includes("CREATE") ||
      normalized.includes("UPLOAD") ||
      normalized.includes("REGISTER")
    ) {
      return "bg-green-100 text-green-700";
    }

    if (
      normalized.includes("UPDATE") ||
      normalized.includes("EDIT") ||
      normalized.includes("CHANGE")
    ) {
      return "bg-blue-100 text-blue-700";
    }

    if (
      normalized.includes("LOGIN") ||
      normalized.includes("LOGOUT")
    ) {
      return "bg-purple-100 text-purple-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  // --------------------------------------------------
  // Activity types
  // --------------------------------------------------

  const activityTypes = useMemo(() => {
    const types = activities
      .map(
        (activity) =>
          activity?.activity_type
      )
      .filter(Boolean);

    return [
      ...new Set(types),
    ].sort();
  }, [activities]);

  // --------------------------------------------------
  // Filtered logs
  // --------------------------------------------------

  const filteredActivities = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return activities.filter(
      (activity) => {
        const matchesType =
          selectedType === "ALL" ||
          activity?.activity_type ===
            selectedType;

        if (!matchesType) {
          return false;
        }

        if (!search) {
          return true;
        }

        return (
          String(
            activity?.description || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(
            activity?.activity_type || ""
          )
            .toLowerCase()
            .includes(search) ||
          String(
            activity?.user_id || ""
          )
            .toLowerCase()
            .includes(search)
        );
      }
    );
  }, [
    activities,
    searchTerm,
    selectedType,
  ]);

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const todayCount = useMemo(() => {
    const now = new Date();

    return activities.filter(
      (activity) => {
        if (!activity?.created_at) {
          return false;
        }

        const date = new Date(
          activity.created_at
        );

        return (
          date.getFullYear() ===
            now.getFullYear() &&
          date.getMonth() ===
            now.getMonth() &&
          date.getDate() ===
            now.getDate()
        );
      }
    ).length;
  }, [activities]);

  const uniqueUsers = useMemo(() => {
    return new Set(
      activities
        .map(
          (activity) =>
            activity?.user_id
        )
        .filter(
          (id) =>
            id !== null &&
            id !== undefined
        )
    ).size;
  }, [activities]);

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
              <FaClipboardList />
            </div>

            <div>

              <h1 className="text-3xl font-bold text-slate-900">
                Audit Logs & Reports
              </h1>

              <p className="mt-1 text-slate-500">
                Review platform events and maintain an
                audit trail of user activity.
              </p>

            </div>

          </div>

          <button
            onClick={loadAuditLogs}
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
            Loading audit logs...
          </div>

        ) : (

          <>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Total Events */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <FaHistory />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Total Events
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {activities.length.toLocaleString()}
                    </p>

                  </div>

                </div>

              </div>

              {/* Today's Events */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <FaClock />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Events Today
                    </p>

                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {todayCount.toLocaleString()}
                    </p>

                  </div>

                </div>

              </div>

              {/* Active Users */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <FaUser />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Users With Activity
                    </p>

                    <p className="mt-1 text-2xl font-bold text-green-600">
                      {uniqueUsers.toLocaleString()}
                    </p>

                  </div>

                </div>

              </div>

              {/* Activity Types */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <FaChartBar />
                  </div>

                  <div>

                    <p className="text-sm text-slate-500">
                      Activity Types
                    </p>

                    <p className="mt-1 text-2xl font-bold text-orange-600">
                      {activityTypes.length.toLocaleString()}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">

              <div className="flex flex-col lg:flex-row gap-4">

                {/* Search */}
                <div className="relative flex-1">

                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                    placeholder="Search descriptions, activity types, or user IDs..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                  />

                </div>

                {/* Activity Type */}
                <div className="flex items-center gap-2">

                  <FaFilter className="text-slate-400" />

                  <select
                    value={selectedType}
                    onChange={(event) =>
                      setSelectedType(
                        event.target.value
                      )
                    }
                    className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-200"
                  >

                    <option value="ALL">
                      All Activity Types
                    </option>

                    {activityTypes.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {formatActivityType(
                            type
                          )}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              <div className="mt-3 text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredActivities.length.toLocaleString()}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {activities.length.toLocaleString()}
                </span>{" "}
                audit events
              </div>

            </div>

            {/* ==================================================
                AUDIT LOG TABLE
            ================================================== */}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="px-6 py-5 border-b border-slate-200">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <FaClipboardList />
                  </div>

                  <div>

                    <h2 className="text-xl font-semibold text-slate-900">
                      Audit Trail
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Chronological record of platform
                      activity.
                    </p>

                  </div>

                </div>

              </div>

              {filteredActivities.length === 0 ? (

                <div className="p-12 text-center">

                  <FaClipboardList className="mx-auto text-3xl text-slate-300 mb-3" />

                  <h3 className="font-semibold text-slate-700">
                    No audit events found
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Try changing your search or
                    activity-type filter.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead className="bg-slate-50 border-b border-slate-200">

                      <tr>

                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                          Event
                        </th>

                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                          User
                        </th>

                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                          Description
                        </th>

                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">
                          Timestamp
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {filteredActivities.map(
                        (activity, index) => (

                          <tr
                            key={
                              activity?.id ||
                              index
                            }
                            className="hover:bg-slate-50 transition"
                          >

                            {/* Event */}
                            <td className="px-5 py-4">

                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getActivityBadgeClass(
                                  activity?.activity_type
                                )}`}
                              >
                                {formatActivityType(
                                  activity?.activity_type
                                )}
                              </span>

                              <p className="text-xs text-slate-400 mt-2">
                                Event #
                                {activity?.id ||
                                  "—"}
                              </p>

                            </td>

                            {/* User */}
                            <td className="px-5 py-4">

                              <div className="flex items-center gap-2">

                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                  <FaUser className="text-xs" />
                                </div>

                                <div>

                                  <p className="text-sm font-medium text-slate-700">
                                    User #
                                    {activity?.user_id ||
                                      "—"}
                                  </p>

                                  <p className="text-xs text-slate-400">
                                    User ID
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* Description */}
                            <td className="px-5 py-4">

                              <p className="text-sm text-slate-700 max-w-2xl">
                                {activity?.description ||
                                  "No description available"}
                              </p>

                            </td>

                            {/* Timestamp */}
                            <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">

                              {formatDate(
                                activity?.created_at
                              )}

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </>

        )}

      </div>

    </DashboardLayout>
  );
}