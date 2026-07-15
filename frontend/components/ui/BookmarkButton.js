"use client";

import { useState } from "react";
import api from "../../lib/api";
import { BookmarkIcon } from "./icons";

/**
 * Toggle-style bookmark button. `bookmarks` is the current video's bookmark
 * list (from GET /api/v1/bookmarks?video_id=...); `target` describes what
 * this particular button bookmarks: { type: "video" | "summary" | "highlight", variant?, start? }.
 */
export default function BookmarkButton({ videoId, target, bookmarks, onChange, label, className = "" }) {
  const [busy, setBusy] = useState(false);

  const existing = bookmarks.find((b) => {
    if (b.type !== target.type) return false;
    if (target.type === "summary") return b.variant === target.variant;
    if (target.type === "highlight") return b.start === target.start;
    return true;
  });

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (existing) {
        await api.delete(`/api/v1/bookmarks/${existing.id}`);
        onChange(bookmarks.filter((b) => b.id !== existing.id));
      } else {
        const res = await api.post("/api/v1/bookmarks", { video_id: videoId, ...target });
        onChange([res.data, ...bookmarks]);
      }
    } catch {
      // Silently ignore — e.g. a duplicate race or a 400 (missing summary/highlight yet).
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={existing ? "Remove bookmark" : "Bookmark"}
      className={`flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 ${
        existing ? "text-signal" : "text-ink/50 hover:text-ink dark:text-paper/50 dark:hover:text-paper"
      } ${className}`}
    >
      <BookmarkIcon width={14} height={14} fill={existing ? "currentColor" : "none"} />
      {label !== undefined ? label : existing ? "Bookmarked" : "Bookmark"}
    </button>
  );
}