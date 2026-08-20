"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../../lib/api";
import { GraduationCapIcon, UsersIcon } from "../../../../components/ui/icons";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function LearnerClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/v1/classrooms/mine").then((res) => setClassrooms(res.data)).finally(() => setLoading(false));
  }, []);

  async function handleJoin(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setJoining(true);
    setError("");
    try {
      const res = await api.post("/api/v1/classrooms/join", { invite_code: code.trim() });
      setClassrooms((prev) => {
        const withoutExisting = prev.filter((c) => c.id !== res.data.id);
        return [res.data, ...withoutExisting];
      });
      setCode("");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid invite code. Check with your educator and try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">My Classrooms</h1>
      <p className="mb-6 text-sm text-ink/50 dark:text-paper/50">
        Join a classroom with the invite code your educator shared. Videos shared with the class show up in{" "}
        <Link href="/dashboard/shared" className="text-signal hover:underline">
          Shared with Me
        </Link>
        .
      </p>

      <form
        onSubmit={handleJoin}
        className="mb-6 flex items-start gap-3 rounded-xl border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite"
      >
        <div className="flex-1">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code, e.g. 7K2QXRT"
            className="w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 font-mono text-sm tracking-wider text-ink placeholder:font-sans placeholder:tracking-normal placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30"
          />
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={joining || !code.trim()}
          className="shrink-0 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {joining ? "Joining..." : "Join"}
        </button>
      </form>

      {loading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>
      ) : classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-14 text-center dark:border-line-dark dark:bg-graphite">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
            <GraduationCapIcon width={22} height={22} />
          </span>
          <p className="mt-3 text-sm font-medium text-ink dark:text-paper">You haven't joined any classrooms</p>
          <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
            Ask your educator for their classroom's invite code and enter it above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
                <GraduationCapIcon width={16} height={16} />
              </span>
              <p className="mt-3 truncate text-sm font-medium text-ink dark:text-paper">{c.name}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink/45 dark:text-paper/45">
                {c.educator_name && <>Taught by {c.educator_name} · </>}Joined {formatDate(c.created_at)}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-ink/45 dark:text-paper/45">
                <UsersIcon width={13} height={13} />
                {c.student_count} {c.student_count === 1 ? "classmate" : "classmates"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}