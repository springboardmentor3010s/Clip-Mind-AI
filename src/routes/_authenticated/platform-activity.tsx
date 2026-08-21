import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FiActivity,
  FiClock,
  FiFileText,
  FiUpload,
  FiUser,
  FiTrash2,
  FiBarChart2,
} from "react-icons/fi";

type ActivityItem = {
  id: string;
  action: string;
  videoId: string | null;
  details: string | null;
  createdAt: string;
};

const API_URL = import.meta.env.VITE_API_URL || "/api";

function getActionLabel(action: string) {
  switch (action) {
    case "register":
      return "Account registered";
    case "login":
      return "Logged in";
    case "video_upload":
      return "Video uploaded";
    case "video_delete":
      return "Video deleted";
    case "transcript_generated":
      return "Transcript generated";
    case "transcript_updated":
      return "Transcript updated";
    case "summary_generated":
      return "Summary generated";
    case "moments_generated":
      return "Key moments generated";
    case "analytics_generated":
      return "Analytics generated";
    case "profile_updated":
      return "Profile updated";
    default:
      return action.replaceAll("_", " ");
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case "video_upload":
      return FiUpload;

    case "video_delete":
      return FiTrash2;

    case "transcript_generated":
    case "transcript_updated":
    case "summary_generated":
      return FiFileText;

    case "analytics_generated":
    case "moments_generated":
      return FiBarChart2;

    case "profile_updated":
    case "register":
    case "login":
      return FiUser;

    default:
      return FiActivity;
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export const Route = createFileRoute(
  "/_authenticated/platform-activity"
)({
  component: PlatformActivityPage,
});

function PlatformActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("clipmind_token");

        if (!token) {
          throw new Error("Authentication required.");
        }

        const response = await fetch(`${API_URL}/activity`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Your session has expired. Please log in again."
              : "Unable to load platform activity."
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setActivities(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load platform activity."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadActivity();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-7">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center">
            <FiActivity className="text-white text-xl" />
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Administrator
            </div>

            <h1 className="mt-1 font-display text-3xl font-semibold">
              Platform Activity
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Monitor activity across all ClipMind users and platform
              operations.
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="animate-pulse text-muted-foreground">
            Loading platform activity...
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-border bg-card p-8">
          <p className="font-medium text-destructive">{error}</p>

          <p className="mt-2 text-sm text-muted-foreground">
            Make sure the backend is running and your administrator session
            is valid.
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && activities.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <FiActivity className="mx-auto mb-4 text-4xl text-muted-foreground" />

          <h2 className="font-display text-xl font-semibold">
            No platform activity yet
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            User registrations, uploads, processing and AI actions will
            appear here.
          </p>
        </div>
      )}

      {/* Activity list */}
      {!loading && !error && activities.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Recent platform activity
              </h2>

              <p className="text-xs text-muted-foreground mt-1">
                {activities.length} activity records
              </p>
            </div>

            <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
              <FiActivity className="text-primary" />
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {activities.map((activity) => {
              const Icon = getActionIcon(activity.action);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-5 hover:bg-muted/30 transition-colors"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="text-lg text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium capitalize">
                      {getActionLabel(activity.action)}
                    </p>

                    {activity.details && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.details}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <FiClock />
                      <span>{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}