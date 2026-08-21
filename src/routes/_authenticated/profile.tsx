import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Input } from "../../components/TextInput";
import { Button } from "../../components/PrimaryButton";
import { FiUser, FiMail, FiAward, FiEdit3 } from "react-icons/fi";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { videos } = useWorkspace();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  /*
   * ---------------------------------------------------------
   * REAL PROFILE STATISTICS
   *
   * These are calculated from the authenticated user's videos
   * loaded by WorkspaceContext.
   *
   * Nothing is hardcoded.
   * ---------------------------------------------------------
   */

  const stats = useMemo(() => {
    const videosProcessed = videos.filter(
      (video) => video.status === "Processed"
    ).length;

    let totalSecondsSaved = 0;
    let aiActions = 0;

    for (const video of videos) {
      const hasTranscript =
        Array.isArray(video.transcript) && video.transcript.length > 0;

      const hasSummary = Boolean(video.summary);

      const hasMoments =
        Array.isArray(video.moments) && video.moments.length > 0;

      const hasAnalytics = Boolean(video.analytics);

      /*
       * Backend definition:
       * transcript + summary + moments + analytics
       * each count as one AI action.
       */
      aiActions +=
        Number(hasTranscript) +
        Number(hasSummary) +
        Number(hasMoments) +
        Number(hasAnalytics);

      /*
       * Watch time saved:
       * video duration - estimated summary reading time.
       *
       * Summary reading speed = 200 words/minute.
       */
      if (hasSummary && video.summary) {
        const wordCount = Number(video.summary.wordCount || 0);

        const readSeconds = (wordCount / 200) * 60;

        const durationSeconds = parseDuration(video.duration);

        const saved = Math.max(
          0,
          durationSeconds - readSeconds
        );

        totalSecondsSaved += saved;
      }
    }

    return {
      videosProcessed,
      watchTimeSavedLabel: formatDuration(totalSecondsSaved),
      aiActions,
    };
  }, [videos]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Profile header */}
      <div className="flex flex-wrap items-center gap-6 rounded-3xl glass-strong p-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-primary text-3xl font-display text-white shadow-glow">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl">
            {user?.name || "User"}
          </h1>

          <p className="text-muted-foreground">
            {user?.email}
          </p>

          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <FiAward />
            {user?.role}
          </div>
        </div>

        <Button
          variant="outline"
          icon={<FiEdit3 />}
        >
          Edit profile
        </Button>
      </div>

      {/* REAL STATISTICS */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <div className="text-sm text-muted-foreground">
            Videos processed
          </div>

          <div className="mt-1 font-display text-3xl">
            {stats.videosProcessed}
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <div className="text-sm text-muted-foreground">
            Watch time saved
          </div>

          <div className="mt-1 font-display text-3xl">
            {stats.watchTimeSavedLabel}
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card p-6">
          <div className="text-sm text-muted-foreground">
            AI actions
          </div>

          <div className="mt-1 font-display text-3xl">
            {stats.aiActions.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="space-y-4 rounded-3xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-xl">
          Account details
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Full name"
            defaultValue={user?.name}
            icon={<FiUser />}
          />

          <Input
            label="Email"
            defaultValue={user?.email}
            icon={<FiMail />}
          />
        </div>

        <div className="flex justify-end">
          <Button>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

/*
 * Convert common duration formats into seconds.
 *
 * Supports:
 * 01:04
 * 1:04
 * 01:02:30
 * 64
 * 64.5
 */
function parseDuration(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const text = value.trim();

  if (!text) {
    return 0;
  }

  /*
   * Plain numeric duration.
   */
  if (/^\d+(\.\d+)?$/.test(text)) {
    return Number(text);
  }

  /*
   * HH:MM:SS or MM:SS
   */
  const parts = text.split(":").map(Number);

  if (parts.some((part) => !Number.isFinite(part))) {
    return 0;
  }

  if (parts.length === 3) {
    return (
      parts[0] * 3600 +
      parts[1] * 60 +
      parts[2]
    );
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

/*
 * Convert seconds to the same style used by the backend:
 * 18h 42m
 * 1h 04m
 * 42m
 * 0m
 */
function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(
    0,
    Math.round(totalSeconds)
  );

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  return `${hours}h ${minutes}m`;
}