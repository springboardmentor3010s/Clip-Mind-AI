"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getActivityHistory } from "@/services/activityService";

export default function ActivityHistoryPage() {
  const router = useRouter();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivityHistory() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const data = await getActivityHistory();
        setActivities(data);
      } catch (error) {
        console.error("Failed to load activity history:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");

          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    loadActivityHistory();
  }, [router]);

  const getActivityIcon = (type) => {
    switch (type) {
      case "REGISTER":
        return "👤";

      case "LOGIN":
        return "🔑";

      case "LOGOUT":
        return "🚪";

      case "PROFILE_UPDATED":
        return "✏️";

      case "VIDEO_UPLOADED":
        return "🎥";

      case "VIDEO_DELETED":
        return "🗑️";

      case "TRANSCRIPT_GENERATED":
        return "📄";

      case "SUMMARY_GENERATED":
        return "🤖";

      case "KEY_MOMENTS_DETECTED":
        return "⭐";

      case "BOOKMARK_ADDED":
        return "🔖";

      case "SUMMARY_DOWNLOADED":
        return "⬇️";

      default:
        return "📌";
    }
  };

  const formatActivityType = (type) => {
    return type
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh] text-xl font-semibold">
          Loading activity history...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Activity History
          </h1>

          <p className="mt-3 text-slate-500">
            View your complete account and platform activity on ClipMind AI.
          </p>
        </div>

        {/* Activity History Card */}
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                All Activities
              </h2>

              <p className="mt-2 text-slate-500">
                A complete record of your actions on ClipMind AI.
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-violet-100 text-violet-700 font-semibold">
              {activities.length} Activities
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-14 text-slate-500">
              <div className="text-5xl mb-4">📌</div>

              <h3 className="text-xl font-semibold text-slate-700">
                No Activity Found
              </h3>

              <p className="mt-2">
                Your actions on ClipMind AI will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-100 p-5 hover:bg-violet-50 transition-all duration-300"
                >
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {getActivityIcon(activity.activity_type)}{" "}
                      {formatActivityType(activity.activity_type)}
                    </h3>

                    <p className="mt-2 text-slate-500">
                      {activity.description}
                    </p>
                  </div>

                  <div className="text-sm text-slate-400 whitespace-nowrap">
                    {new Date(activity.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}