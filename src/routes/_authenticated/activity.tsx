import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from "react";
import { FiActivity, FiClock, FiFileText, FiUpload, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

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
    case "transcript_generated":
    case "transcript_updated":
    case "summary_generated":
      return FiFileText;
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

export const Route = createFileRoute("/_authenticated/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const { user } = useAuth();

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
              : "Unable to load activity history."
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
              : "Unable to load activity history."
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
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center">
            <FiActivity className="text-white text-xl" />
          </div>

          <div>
            <h1 className="font-display text-3xl font-semibold">
              Activity History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your recent activity on ClipMind.
            </p>
          </div>
        </div>
      </div>

      {user && (
        <div className="glass rounded-2xl p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Signed in as
          </p>
          <p className="font-medium mt-1">
            {user.name || user.email}
          </p>
        </div>
      )}

      {loading && (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="animate-pulse text-muted-foreground">
            Loading activity history...
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="glass rounded-3xl p-8">
          <p className="font-medium text-destructive">
            {error}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Make sure the backend is running and your session is valid.
          </p>
        </div>
      )}

      {!loading && !error && activities.length === 0 && (
        <div className="glass rounded-3xl p-10 text-center">
          <FiActivity className="mx-auto text-4xl text-muted-foreground mb-4" />

          <h2 className="font-display text-xl font-semibold">
            No activity yet
          </h2>

          <p className="text-sm text-muted-foreground mt-2">
            Your ClipMind actions will appear here.
          </p>
        </div>
      )}

      {!loading && !error && activities.length > 0 && (
        <div className="glass rounded-3xl overflow-hidden">
          <div className="divide-y divide-border/60">
            {activities.map((activity) => {
              const Icon = getActionIcon(activity.action);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-5 hover:bg-muted/30 transition-colors"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="text-lg" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium capitalize">
                      {getActionLabel(activity.action)}
                    </p>

                    {activity.details && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {activity.details}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
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