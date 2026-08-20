"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../../lib/api";
import { GraduationCapIcon, PlusIcon, CopyIcon, CheckIcon, TrashIcon } from "../../../../components/ui/icons";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function EducatorClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    api.get("/api/v1/classrooms/mine").then((res) => setClassrooms(res.data)).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await api.post("/api/v1/classrooms", { name: name.trim() });
      setClassrooms((prev) => [res.data, ...prev]);
      setName("");
      setShowCreate(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create classroom. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(classroomId) {
    if (!confirm("Delete this classroom? Enrolled students will lose access to anything shared only with it.")) return;
    setClassrooms((prev) => prev.filter((c) => c.id !== classroomId));
    try {
      await api.delete(`/api/v1/classrooms/${classroomId}`);
    } catch {
      api.get("/api/v1/classrooms/mine").then((res) => setClassrooms(res.data)).catch(() => {});
    }
  }

  function handleCopy(classroomId, code) {
    navigator.clipboard.writeText(code);
    setCopiedId(classroomId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Classrooms</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">
            Create a classroom, share the invite code, and share videos with everyone enrolled.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-signal px-4 py-2 text-sm font-medium text-white"
        >
          <PlusIcon width={15} height={15} /> New Classroom
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex items-start gap-3 rounded-xl border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite"
        >
          <div className="flex-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Intro to Biology — Fall 2026"
              className="w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30"
            />
            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="shrink-0 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>
      ) : classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-14 text-center dark:border-line-dark dark:bg-graphite">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
            <GraduationCapIcon width={22} height={22} />
          </span>
          <p className="mt-3 text-sm font-medium text-ink dark:text-paper">No classrooms yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
            Create a classroom to get an invite code your students can use to enroll.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-line bg-cloud p-5 transition-colors hover:border-signal dark:border-line-dark dark:bg-graphite"
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
                  <GraduationCapIcon width={16} height={16} />
                </span>
                <button
                  onClick={() => handleDelete(c.id)}
                  title="Delete classroom"
                  className="shrink-0 rounded-md p-1.5 text-ink/35 hover:bg-danger/10 hover:text-danger dark:text-paper/35"
                >
                  <TrashIcon width={14} height={14} />
                </button>
              </div>

              <Link href={`/dashboard/educator/classrooms/${c.id}`} className="block">
                <p className="truncate text-sm font-medium text-ink hover:text-signal dark:text-paper">{c.name}</p>
                <p className="mt-1 text-xs text-ink/45 dark:text-paper/45">
                  {c.student_count} {c.student_count === 1 ? "student" : "students"} · Created {formatDate(c.created_at)}
                </p>
              </Link>

              <div className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2 dark:bg-graphite-2">
                <span className="font-mono text-sm tracking-wider text-ink dark:text-paper">{c.invite_code}</span>
                <button
                  onClick={() => handleCopy(c.id, c.invite_code)}
                  className="flex shrink-0 items-center gap-1 text-xs font-medium text-signal"
                >
                  {copiedId === c.id ? (
                    <>
                      <CheckIcon width={13} height={13} /> Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon width={13} height={13} /> Copy code
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}