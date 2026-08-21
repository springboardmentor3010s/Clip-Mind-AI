import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiBookmark,
  FiCheck,
  FiCornerDownRight,
  FiDownload,
  FiLayers,
} from "react-icons/fi";
import { useWorkspace } from "../../context/WorkspaceContext";
import { EmptyState } from "../../components/EmptyState";
import { VideoSelect } from "../../components/VideoSelect";
import { MediaPlayer } from "../../components/MediaPlayer";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export const Route = createFileRoute("/_authenticated/moments")({
  head: () => ({
    meta: [
      { title: "Key Moments — ClipMind AI" },
      {
        name: "description",
        content:
          "Ranked key moments with working jump-to-timestamp navigation for your processed recording.",
      },
      {
        property: "og:title",
        content: "Key Moments — ClipMind AI",
      },
      {
        property: "og:description",
        content:
          "Jump straight to the salient segments of a recording.",
      },
    ],
  }),
  component: MomentsPage,
});

function MomentsPage() {
  const { active, mediaUrl } = useWorkspace();
  const { toast } = useToast();
  const { user } = useAuth();

  const [currentTime, setCurrentTime] = useState(0);
  const [activeMoment, setActiveMoment] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!active || !user) {
      setBookmarkedIds([]);
      return;
    }

    try {
      const key = `clipmind_bookmarked_moments:${user.id}`;
      const raw = localStorage.getItem(key);
      const ids: string[] = raw ? JSON.parse(raw) : [];

      setBookmarkedIds(ids);
    } catch {
      setBookmarkedIds([]);
    }
  }, [active?.id, user?.id]);

  if (!active || active.moments.length === 0) {
    return (
      <EmptyState
        icon={<FiLayers />}
        title="No key moments extracted yet"
        description="Process a recording to extract ranked key moments with timestamp navigation."
      />
    );
  }

  const exportHighlightReport = () => {
    const report = [
      `ClipMind AI — Highlight Report`,
      `Recording: ${active.title}`,
      `Total Key Moments: ${active.moments.length}`,
      ``,
      ...active.moments.map(
        (m, i) =>
          `${i + 1}. ${m.title}
Timestamp: ${m.time}
Tag: ${m.tag}
Confidence: ${m.confidence.toFixed(2)}
Description: ${m.description}
`,
      ),
    ].join("\n");

    const blob = new Blob([report], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title}-highlight-report.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const jumpTo = (
    seconds: number,
    id: string,
    label: string,
  ) => {
    setCurrentTime(seconds);
    setActiveMoment(id);

    toast(`Jumped to ${label}`, "success");

    document
      .getElementById("moment-player")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const toggleBookmark = (momentId: string) => {
    if (!user) return;

    try {
      const key = `clipmind_bookmarked_moments:${user.id}`;
      const isBookmarked = bookmarkedIds.includes(momentId);

      const nextIds = isBookmarked
        ? bookmarkedIds.filter((id) => id !== momentId)
        : [...bookmarkedIds, momentId];

      setBookmarkedIds(nextIds);
      localStorage.setItem(
        key,
        JSON.stringify(nextIds),
      );

      toast(
        isBookmarked
          ? "Highlight removed from bookmarks"
          : "Highlight bookmarked",
        "success",
      );
    } catch {
      toast("Unable to update bookmark", "error");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">
            Key Moments
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {active.moments.length} moments · {active.title}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <VideoSelect />

          <button
            onClick={exportHighlightReport}
            className="h-10 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm hover:bg-muted"
          >
            <FiDownload />
            Export Highlight Report
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div
          id="moment-player"
          className="lg:sticky lg:top-4 lg:self-start"
        >
          <MediaPlayer
            src={mediaUrl}
            title={active.title}
            durationSeconds={active.durationSeconds}
            currentTime={currentTime}
            onSeek={setCurrentTime}
            markers={active.moments.map((m) => ({
              seconds: m.seconds,
              label: m.title,
            }))}
          />
        </div>

        <ol className="space-y-3">
          {active.moments.map((m, i) => {
            const bookmarked =
              bookmarkedIds.includes(m.id);

            return (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.04,
                }}
              >
                <div
                  className={`w-full rounded-2xl border p-4 transition-colors ${
                    activeMoment === m.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <button
                    onClick={() =>
                      jumpTo(
                        m.seconds,
                        m.id,
                        m.time,
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-primary">
                        {m.time}
                      </span>

                      <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {m.tag}
                      </span>

                      <span className="ml-auto font-mono-num text-[11px] text-muted-foreground">
                        confidence{" "}
                        {m.confidence.toFixed(2)}
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold">
                      {m.title}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {m.description}
                    </p>

                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary">
                      <FiCornerDownRight />
                      Jump to timestamp
                    </span>
                  </button>

                  <div className="mt-3 border-t border-border/60 pt-3">
                    <button
                      onClick={() =>
                        toggleBookmark(m.id)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                        bookmarked
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {bookmarked ? (
                        <FiCheck />
                      ) : (
                        <FiBookmark />
                      )}

                      {bookmarked
                        ? "Bookmarked"
                        : "Bookmark Highlight"}
                    </button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}