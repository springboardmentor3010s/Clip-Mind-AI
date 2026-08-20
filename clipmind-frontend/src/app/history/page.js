"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getActivityHistory } from "@/services/authService";

export default function ActivityHistoryPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadActivityHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getActivityHistory();
        setActivities(data);
      } catch (err) {
        console.error("Failed to load activity history:", err);
        setError("Unable to load your activity history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadActivityHistory();
  }, []);

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case "REGISTER":
        return "👤";

      case "LOGIN":
        return "🔑";

      case "LOGOUT":
        return "🚪";

      case "PROFILE_UPDATED":
        return "⚙️";

      case "VIDEO_UPLOADED":
        return "🎥";

      case "VIDEO_DELETED":
        return "🗑️";

      case "TRANSCRIPT_GENERATED":
        return "📝";

      case "TRANSCRIPT_VIEWED":
        return "📄";

      case "TRANSCRIPT_SEGMENTS_VIEWED":
        return "⏱️";

      case "TRANSCRIPT_DOWNLOADED":
        return "⬇️";

      case "SUMMARY_GENERATED":
        return "🤖";

      case "SUMMARY_VIEWED":
        return "📘";

      case "SUMMARY_DOWNLOADED":
        return "⬇️";

      case "KEY_MOMENTS_DETECTED":
        return "✨";

      case "KEY_MOMENTS_VIEWED":
        return "🎯";

      case "HIGHLIGHT_REPORT_VIEWED":
        return "🌟";

      case "KEYWORDS_GENERATED":
        return "🏷️";

      case "KEYWORDS_VIEWED":
        return "🔍";

      case "BOOKMARK_ADDED":
        return "🔖";

      default:
        return "📌";
    }
  };

  const formatActivityName = (activityType) => {
    if (!activityType) return "Activity";

    return activityType
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString();
  };

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <h1 className="text-4xl font-bold text-slate-900">
          Learning History
        </h1>

        <p className="mt-3 text-slate-500">
          Track your learning activity and interactions on ClipMind AI.
        </p>

        {/* Loading */}
        {loading && (
          <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
            <p className="text-slate-500">
              Loading your learning history...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-red-600 font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Recent Learning Activity
                </h2>

                <p className="mt-2 text-slate-500">
                  Your recent actions are saved automatically.
                </p>
              </div>

              <div className="text-3xl">📚</div>
            </div>

            {/* Empty State */}
            {activities.length === 0 && (
              <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-100 p-10 text-center">
                <div className="text-5xl">📖</div>

                <h3 className="mt-4 text-xl font-bold text-slate-800">
                  No Learning Activity Yet
                </h3>

                <p className="mt-2 text-slate-500">
                  Start exploring videos, transcripts, and AI summaries.
                  Your learning activity will appear here.
                </p>
              </div>
            )}

            {/* Activity List */}
            {activities.length > 0 && (
              <div className="mt-6 space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-2xl bg-slate-50 border border-slate-100 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-2xl">
                        {getActivityIcon(activity.activity_type)}
                      </div>

                      {/* Activity Details */}
                      <div className="flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="font-semibold text-slate-800">
                            {formatActivityName(activity.activity_type)}
                          </h3>

                          <span className="text-sm text-slate-400">
                            {formatDate(activity.created_at)}
                          </span>
                        </div>

                        <p className="mt-2 text-slate-500">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}