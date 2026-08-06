"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { TrashIcon } from "./icons";

/**
 * Owner-only panel for sharing a video with specific people by email.
 * Lists current shares with a revoke button, and a form to add more.
 */
export default function ShareVideoPanel({ videoId, onClose }) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailsInput, setEmailsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState([]);

  useEffect(() => {
    api.get(`/api/v1/videos/${videoId}/share`).then((res) => setShares(res.data)).finally(() => setLoading(false));
  }, [videoId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const emails = emailsInput
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (emails.length === 0) return;

    setSubmitting(true);
    setError("");
    setNotFound([]);
    try {
      const res = await api.post(`/api/v1/videos/${videoId}/share`, { emails });
      setShares((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const merged = [...res.data.shared.filter((s) => !existingIds.has(s.id)), ...prev];
        return merged;
      });
      setNotFound(res.data.not_found);
      setEmailsInput("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to share video. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(shareId) {
    setShares((prev) => prev.filter((s) => s.id !== shareId));
    try {
      await api.delete(`/api/v1/videos/${videoId}/share/${shareId}`);
    } catch {
      api.get(`/api/v1/videos/${videoId}/share`).then((res) => setShares(res.data)).catch(() => {});
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-cloud p-6 shadow-lg dark:border-line-dark dark:bg-graphite">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink dark:text-paper">Share video</h2>
          <button onClick={onClose} className="text-sm text-ink/45 hover:text-ink dark:text-paper/45 dark:hover:text-paper">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Share with (email addresses)</label>
            <textarea
              value={emailsInput}
              onChange={(e) => setEmailsInput(e.target.value)}
              placeholder="jane@example.com, sam@example.com"
              rows={2}
              className="mt-1.5 w-full resize-none rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30"
            />
            <p className="mt-1 text-xs text-ink/40 dark:text-paper/40">Separate multiple emails with commas.</p>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {notFound.length > 0 && (
            <p className="text-xs text-marker">
              No account found for: {notFound.join(", ")}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !emailsInput.trim()}
            className="w-full rounded-lg bg-signal py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sharing..." : "Share"}
          </button>
        </form>

        <div className="mt-5 border-t border-line pt-4 dark:border-line-dark">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">
            Shared with {shares.length > 0 ? `(${shares.length})` : ""}
          </p>
          {loading ? (
            <p className="text-sm text-ink/40 dark:text-paper/40">Loading...</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-ink/40 dark:text-paper/40">Not shared with anyone yet.</p>
          ) : (
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {shares.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg bg-paper px-3 py-2 dark:bg-graphite-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink dark:text-paper">{s.full_name}</p>
                    <p className="truncate text-xs text-ink/45 dark:text-paper/45">{s.email}</p>
                  </div>
                  <button
                    onClick={() => handleRevoke(s.id)}
                    title="Remove access"
                    className="shrink-0 rounded-md p-1.5 text-ink/35 hover:bg-danger/10 hover:text-danger dark:text-paper/35"
                  >
                    <TrashIcon width={14} height={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}