"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../../lib/api";
import {
  GraduationCapIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  UsersIcon,
  BarChartIcon,
  ClockIcon,
} from "../../../../../components/ui/icons";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(totalSeconds) {
  const s = Math.round(totalSeconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export default function ClassroomRosterPage() {
  const { id } = useParams();
  const router = useRouter();

  const [classroom, setClassroom] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("roster");

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/classrooms/mine").then((res) => res.data.find((c) => c.id === id)),
      api.get(`/api/v1/classrooms/${id}/roster`).then((res) => res.data),
    ])
      .then(([c, r]) => {
        setClassroom(c || null);
        setRoster(r);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab !== "analytics" || analytics) return;
    setAnalyticsLoading(true);
    setAnalyticsError("");
    api
      .get(`/api/v1/classrooms/${id}/analytics`)
      .then((res) => setAnalytics(res.data))
      .catch((err) => setAnalyticsError(err.response?.data?.detail || "Failed to load analytics."))
      .finally(() => setAnalyticsLoading(false));
  }, [tab, id, analytics]);

  async function handleRemove(studentId) {
    if (!confirm("Remove this student from the classroom?")) return;
    setRoster((prev) => prev.filter((m) => m.student_id !== studentId));
    setClassroom((prev) => (prev ? { ...prev, student_count: Math.max(0, prev.student_count - 1) } : prev));
    try {
      await api.delete(`/api/v1/classrooms/${id}/members/${studentId}`);
    } catch {
      api.get(`/api/v1/classrooms/${id}/roster`).then((res) => setRoster(res.data)).catch(() => {});
    }
  }

  function handleCopy() {
    if (!classroom) return;
    navigator.clipboard.writeText(classroom.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>;
  }

  if (!classroom) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-14 text-center dark:border-line-dark dark:bg-graphite">
        <p className="text-sm font-medium text-ink dark:text-paper">Classroom not found</p>
        <button onClick={() => router.push("/dashboard/educator/classrooms")} className="mt-3 text-sm text-signal">
          Back to Classrooms
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/dashboard/educator/classrooms")}
        className="mb-4 text-sm text-ink/50 hover:text-ink dark:text-paper/50 dark:hover:text-paper"
      >
        &larr; Classrooms
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
            <GraduationCapIcon width={20} height={20} />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">{classroom.name}</h1>
            <p className="mt-0.5 text-sm text-ink/50 dark:text-paper/50">
              {classroom.student_count} {classroom.student_count === 1 ? "student" : "students"} enrolled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-line bg-cloud px-4 py-2.5 dark:border-line-dark dark:bg-graphite">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Invite code</p>
            <p className="font-mono text-sm tracking-wider text-ink dark:text-paper">{classroom.invite_code}</p>
          </div>
          <button
            onClick={handleCopy}
            className="ml-2 flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-signal hover:bg-signal/10"
          >
            {copied ? (
              <>
                <CheckIcon width={13} height={13} /> Copied
              </>
            ) : (
              <>
                <CopyIcon width={13} height={13} /> Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-1 rounded-lg bg-paper p-1 dark:bg-graphite-2" style={{ width: "fit-content" }}>
        <button
          onClick={() => setTab("roster")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "roster" ? "bg-cloud text-ink shadow-sm dark:bg-graphite dark:text-paper" : "text-ink/50 dark:text-paper/50"
          }`}
        >
          Roster
        </button>
        <button
          onClick={() => setTab("analytics")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "analytics" ? "bg-cloud text-ink shadow-sm dark:bg-graphite dark:text-paper" : "text-ink/50 dark:text-paper/50"
          }`}
        >
          Analytics
        </button>
      </div>

      {tab === "roster" ? (
        roster.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-14 text-center dark:border-line-dark dark:bg-graphite">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
              <UsersIcon width={22} height={22} />
            </span>
            <p className="mt-3 text-sm font-medium text-ink dark:text-paper">No students yet</p>
            <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
              Share the invite code above — students enter it from "My Classrooms" to enroll.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line dark:border-line-dark">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-cloud text-left text-xs font-medium uppercase tracking-wide text-ink/45 dark:border-line-dark dark:bg-graphite dark:text-paper/45">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {roster.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0 dark:border-line-dark">
                    <td className="px-4 py-3 font-medium text-ink dark:text-paper">{m.full_name}</td>
                    <td className="px-4 py-3 text-ink/60 dark:text-paper/60">{m.email}</td>
                    <td className="px-4 py-3 text-ink/45 dark:text-paper/45">{formatDate(m.joined_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove(m.student_id)}
                        title="Remove from classroom"
                        className="rounded-md p-1.5 text-ink/35 hover:bg-danger/10 hover:text-danger dark:text-paper/35"
                      >
                        <TrashIcon width={14} height={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : analyticsLoading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading analytics...</p>
      ) : analyticsError ? (
        <p className="text-sm text-danger">{analyticsError}</p>
      ) : !analytics || analytics.video_count === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-14 text-center dark:border-line-dark dark:bg-graphite">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
            <BarChartIcon width={22} height={22} />
          </span>
          <p className="mt-3 text-sm font-medium text-ink dark:text-paper">No engagement data yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
            Share a video with this classroom to start seeing watch activity here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Videos shared</p>
              <p className="mt-1 text-2xl font-semibold text-ink dark:text-paper">{analytics.video_count}</p>
            </div>
            <div className="rounded-xl border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Avg. completion</p>
              <p className="mt-1 text-2xl font-semibold text-ink dark:text-paper">{analytics.avg_completion_pct}%</p>
            </div>
            <div className="rounded-xl border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Students enrolled</p>
              <p className="mt-1 text-2xl font-semibold text-ink dark:text-paper">{analytics.student_count}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">By video</p>
            <div className="overflow-hidden rounded-xl border border-line dark:border-line-dark">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-cloud text-left text-xs font-medium uppercase tracking-wide text-ink/45 dark:border-line-dark dark:bg-graphite dark:text-paper/45">
                    <th className="px-4 py-3">Video</th>
                    <th className="px-4 py-3">Watched by</th>
                    <th className="px-4 py-3">Avg. completion</th>
                    <th className="px-4 py-3">Avg. watch time</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.videos.map((v) => (
                    <tr key={v.video_id} className="border-b border-line last:border-0 dark:border-line-dark">
                      <td className="px-4 py-3 font-medium text-ink dark:text-paper">{v.title}</td>
                      <td className="px-4 py-3 text-ink/60 dark:text-paper/60">
                        {v.students_watched}/{v.student_count} ({v.watch_rate_pct}%)
                      </td>
                      <td className="px-4 py-3 text-ink/60 dark:text-paper/60">{v.avg_completion_pct}%</td>
                      <td className="px-4 py-3 text-ink/60 dark:text-paper/60">
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon width={12} height={12} />
                          {formatDuration(v.avg_watch_time_seconds)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">By student</p>
            <div className="overflow-hidden rounded-xl border border-line dark:border-line-dark">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-cloud text-left text-xs font-medium uppercase tracking-wide text-ink/45 dark:border-line-dark dark:bg-graphite dark:text-paper/45">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Videos watched</th>
                    <th className="px-4 py-3">Avg. completion</th>
                    <th className="px-4 py-3">Total watch time</th>
                    <th className="px-4 py-3">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.students.map((s) => (
                    <tr key={s.student_id} className="border-b border-line last:border-0 dark:border-line-dark">
                      <td className="px-4 py-3 font-medium text-ink dark:text-paper">{s.full_name}</td>
                      <td className="px-4 py-3 text-ink/60 dark:text-paper/60">
                        {s.videos_watched}/{s.videos_assigned}
                      </td>
                      <td className="px-4 py-3 text-ink/60 dark:text-paper/60">{s.avg_completion_pct}%</td>
                      <td className="px-4 py-3 text-ink/60 dark:text-paper/60">
                        {formatDuration(s.total_watch_time_seconds)}
                      </td>
                      <td className="px-4 py-3 text-ink/45 dark:text-paper/45">
                        {s.last_active_at ? formatDate(s.last_active_at) : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}