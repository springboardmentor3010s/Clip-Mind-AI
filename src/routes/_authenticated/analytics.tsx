import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FiBarChart2,
  FiUsers,
} from "react-icons/fi";
import { useWorkspace } from "../../context/WorkspaceContext";
import { EmptyState } from "../../components/EmptyState";
import { fmt } from "../../utils/mockEngine";
import { useAuth } from "../../context/AuthContext";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — ClipMind AI" },
      {
        name: "description",
        content:
          "Speaker distribution, keyword frequency and engagement curves computed from your processed recordings.",
      },
      {
        property: "og:title",
        content: "Analytics — ClipMind AI",
      },
      {
        property: "og:description",
        content:
          "Per-recording analytics with dynamic scope and segment filters.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { videos, activeId } = useWorkspace();
  const { user } = useAuth();

  const [scope, setScope] = useState<string>("active");
  const [half, setHalf] = useState<
    "all" | "first" | "second"
  >("all");

  const processed = videos.filter((v) => v.analytics);

  const record = useMemo(() => {
    if (scope === "all") return null;

    const id =
      scope === "active" ? activeId : scope;

    return (
      processed.find((v) => v.id === id) ??
      processed[0] ??
      null
    );
  }, [scope, activeId, processed]);

  const aggregate = useMemo(() => {
    if (scope !== "all") return null;

    const keywords: Record<string, number> = {};

    processed.forEach((v) =>
      v.analytics?.keywords.forEach((k) => {
        keywords[k.term] =
          (keywords[k.term] ?? 0) + k.count;
      }),
    );

    return {
      keywords: Object.entries(keywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([term, count]) => ({
          term,
          count,
        })),

      metrics: [
        {
          label: "Recordings",
          value: String(processed.length),
        },
        {
          label: "Total duration",
          value: fmt(
            processed.reduce(
              (n, v) => n + v.durationSeconds,
              0,
            ),
          ),
        },
        {
          label: "Key moments",
          value: String(
            processed.reduce(
              (n, v) => n + v.moments.length,
              0,
            ),
          ),
        },
        {
          label: "Segments",
          value: String(
            processed.reduce(
              (n, v) => n + v.transcript.length,
              0,
            ),
          ),
        },
      ],
    };
  }, [scope, processed]);

  if (processed.length === 0) {
    return (
      <EmptyState
        icon={<FiBarChart2 />}
        title="No analytics available"
        description="Analytics are computed during processing. Upload a recording to generate them."
      />
    );
  }

  const a = record?.analytics ?? null;

  const timeline = a
    ? a.sentimentTimeline.filter((p) => {
        if (!record || half === "all") {
          return true;
        }

        const mid =
          record.durationSeconds / 2;

        return half === "first"
          ? p.seconds <= mid
          : p.seconds > mid;
      })
    : [];

  const metrics =
    aggregate?.metrics ?? a?.metrics ?? [];

  const keywords =
    aggregate?.keywords ?? a?.keywords ?? [];

  const usageStats = useMemo(() => {
    const totalDuration = processed.reduce(
      (n, v) => n + v.durationSeconds,
      0,
    );

    const totalSegments = processed.reduce(
      (n, v) => n + v.transcript.length,
      0,
    );

    const totalMoments = processed.reduce(
      (n, v) => n + v.moments.length,
      0,
    );

    return [
      {
        label: "Uploaded recordings",
        value: String(processed.length),
      },
      {
        label: "Processed duration",
        value: fmt(totalDuration),
      },
      {
        label: "Transcript segments",
        value: String(totalSegments),
      },
      {
        label: "Key moments extracted",
        value: String(totalMoments),
      },
    ];
  }, [processed]);

  const contentInsights = useMemo(() => {
    const topicSet = new Set<string>();

    processed.forEach((v) => {
      v.summary?.topics.forEach((topic) =>
        topicSet.add(topic),
      );
    });

    return {
      topics: Array.from(topicSet).slice(0, 8),
      topKeywords: keywords.slice(0, 5),
      moments: record?.moments.length ?? 0,
      words: record?.summary?.wordCount ?? 0,
    };
  }, [processed, keywords, record]);

  /*
   * Educator engagement metrics.
   *
   * These are calculated from the real engagement timeline
   * already generated for the selected recording.
   *
   * They represent engagement signals for the session/content,
   * not named individual students.
   */
  const engagementInsights = useMemo(() => {
    const points =
      record?.analytics?.sentimentTimeline ?? [];

    if (points.length === 0) {
      return {
        average: 0,
        peak: 0,
        coverage: 0,
        trend: "No engagement data",
      };
    }

    const values = points.map((p) =>
      Number(p.value) || 0,
    );

    const average =
      values.reduce((a, b) => a + b, 0) /
      values.length;

    const peak = Math.max(...values);

    const coverage =
      record && record.durationSeconds > 0
        ? Math.min(
            100,
            Math.round(
              (points[points.length - 1].seconds /
                record.durationSeconds) *
                100,
            ),
          )
        : 0;

    let trend = "Stable";

    if (values.length >= 2) {
      const first = values[0];
      const last =
        values[values.length - 1];

      if (last > first + 0.08) {
        trend = "Increasing";
      } else if (last < first - 0.08) {
        trend = "Decreasing";
      }
    }

    return {
      average: Math.round(
        average * 100,
      ),
      peak: Math.round(peak * 100),
      coverage,
      trend,
    };
  }, [record]);

  const path = timeline.length
    ? timeline
        .map(
          (p, i) =>
            `${(i /
              Math.max(
                1,
                timeline.length - 1,
              )) *
              100},${60 - p.value * 55}`,
        )
        .join(" ")
    : "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">
            Analytics
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {scope === "all"
              ? "Aggregated across all processed recordings"
              : record?.title}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={scope}
            onChange={(e) =>
              setScope(e.target.value)
            }
            className="h-10 max-w-64 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-focus"
          >
            <option value="active">
              Active recording
            </option>

            <option value="all">
              All recordings
            </option>

            {processed.map((v) => (
              <option
                key={v.id}
                value={v.id}
              >
                {v.title}
              </option>
            ))}
          </select>

          <select
            value={half}
            onChange={(e) =>
              setHalf(
                e.target.value as typeof half,
              )
            }
            disabled={scope === "all"}
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-focus disabled:opacity-50"
          >
            <option value="all">
              Full timeline
            </option>

            <option value="first">
              First half
            </option>

            <option value="second">
              Second half
            </option>
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {m.label}
            </div>

            <div className="mt-1.5 font-display text-xl">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Educator Engagement Insights */}
      {user?.role === "Educator" &&
        scope !== "all" &&
        record && (
          <section className="rounded-2xl border border-primary/30 bg-card p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <FiUsers />
              </div>

              <div>
                <h2 className="font-display text-lg">
                  Engagement Insights
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Session engagement signals derived
                  from the processed recording.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Average engagement",
                  value: `${engagementInsights.average}%`,
                },
                {
                  label: "Peak engagement",
                  value: `${engagementInsights.peak}%`,
                },
                {
                  label: "Timeline coverage",
                  value: `${engagementInsights.coverage}%`,
                },
                {
                  label: "Engagement trend",
                  value: engagementInsights.trend,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-muted/30 p-4"
                >
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </div>

                  <div className="mt-1.5 font-display text-xl">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Engagement + Speaker */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">
            Engagement curve
          </h2>

          {scope === "all" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Select a single recording to view its
              timeline curve.
            </p>
          ) : (
            <svg
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              className="mt-4 h-40 w-full"
            >
              <polyline
                points={path}
                fill="none"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">
            Speaker distribution
          </h2>

          <div className="mt-4 space-y-3">
            {(a?.speakerShare ?? []).map(
              (s) => (
                <div key={s.speaker}>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{s.speaker}</span>

                    <span className="font-mono-num">
                      {s.pct}%
                    </span>
                  </div>

                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-primary"
                      style={{
                        width: `${s.pct}%`,
                      }}
                    />
                  </div>
                </div>
              ),
            )}

            {scope === "all" && (
              <p className="text-sm text-muted-foreground">
                Select a single recording to view
                speaker split.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Keywords */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg">
          Keyword frequency
        </h2>

        <div className="mt-4 space-y-2">
          {keywords.map((k) => (
            <div
              key={k.term}
              className="flex items-center gap-3"
            >
              <span className="w-40 truncate text-sm text-muted-foreground">
                {k.term}
              </span>

              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-primary"
                  style={{
                    width: `${
                      (k.count /
                        (keywords[0]?.count ||
                          1)) *
                      100
                    }%`,
                  }}
                />
              </div>

              <span className="font-mono-num w-8 text-right text-xs text-muted-foreground">
                {k.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Summary + Content Insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">
            Summary Reports
          </h2>

          {record?.summary ? (
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Short summary
                </div>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {record.summary.shortSummary}
                </p>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Detailed summary
                </div>

                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {record.summary.detailedSummary}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Select a single recording to view its
              summary report.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">
            Content Insights
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Topics
              </div>

              <div className="mt-1 font-display text-xl">
                {contentInsights.topics.length}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Key moments
              </div>

              <div className="mt-1 font-display text-xl">
                {contentInsights.moments}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Transcribed words
              </div>

              <div className="mt-1 font-display text-xl">
                {contentInsights.words}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Top keywords
              </div>

              <div className="mt-1 text-sm text-muted-foreground">
                {contentInsights.topKeywords
                  .slice(0, 3)
                  .map((k) => k.term)
                  .join(", ") || "—"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {contentInsights.topics.map(
              (topic) => (
                <span
                  key={topic}
                  className="rounded-lg border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {topic}
                </span>
              ),
            )}
          </div>
        </section>
      </div>

      {/* Usage Statistics */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg">
          Usage Statistics
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {usageStats.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-muted/30 p-4"
            >
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {item.label}
              </div>

              <div className="mt-1.5 font-display text-xl">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}