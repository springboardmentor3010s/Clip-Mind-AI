"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getBookmarks,
  deleteBookmark,
} from "@/services/videoService";

export default function BookmarksPage() {
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBookmarks();

      setBookmarks(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        "Failed to load bookmarks."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = async (bookmarkId) => {
    try {
      setDeletingId(bookmarkId);
      setError("");

      await deleteBookmark(bookmarkId);

      // Remove only the bookmark that was deleted
      setBookmarks((currentBookmarks) =>
        currentBookmarks.filter(
          (bookmark) => bookmark.id !== bookmarkId
        )
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        "Failed to remove bookmark."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenVideo = (videoId) => {
    if (!videoId) {
      setError("Unable to open the associated video.");
      return;
    }

    router.push(`/videos/${videoId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Bookmarks
        </h1>

        <p className="mt-2 text-slate-500">
          View and manage your saved summaries and highlights.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-500">
            Loading your bookmarks...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && bookmarks.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <h2 className="text-xl font-semibold text-slate-800">
            No bookmarks yet
          </h2>

          <p className="mt-3 text-slate-500">
            Save summaries or highlights from videos to access them here later.
          </p>

          <Link
            href="/videos"
            className="inline-block mt-6 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-700"
          >
            Browse Videos
          </Link>

        </div>
      )}

      {/* Bookmark List */}
      {!loading && bookmarks.length > 0 && (
        <div className="grid gap-5">

          {bookmarks.map((bookmark) => (

            <div
              key={bookmark.id}
              onClick={() => handleOpenVideo(bookmark.video_id)}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md"
            >

              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">

                {/* Bookmark Content */}
                <div className="flex-1">

                  {/* Type Badge */}
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      bookmark.content_type === "SUMMARY"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {bookmark.content_type}
                  </span>

                  {/* Summary Title */}
                  {bookmark.content_type === "SUMMARY" && (
                    <h2 className="mt-4 text-xl font-semibold text-slate-800 transition hover:text-violet-600">
                      {bookmark.summary_type?.toUpperCase() === "SHORT"
                        ? "Short Summary"
                        : "Detailed Summary"}
                    </h2>
                  )}

                  {/* Highlight Title */}
                  {bookmark.content_type === "HIGHLIGHT" && (
                    <h2 className="mt-4 text-xl font-semibold text-slate-800 transition hover:text-amber-600">
                      AI-Generated Highlights
                    </h2>
                  )}

                  {/* Video */}
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    Video:
                    <span className="ml-2 text-slate-800">
                      {bookmark.video_filename}
                    </span>
                  </p>

                  {/* Summary Content */}
                  {bookmark.content_type === "SUMMARY" &&
                    bookmark.content_text && (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4">

                        <p className="text-sm font-semibold text-slate-700">
                          Summary:
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {bookmark.content_text}
                        </p>

                      </div>
                    )}

                  {/* Highlight Content */}
                  {bookmark.content_type === "HIGHLIGHT" && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">

                      <p className="text-sm font-semibold text-slate-700">
                        Highlights:
                      </p>

                      {bookmark.highlight_items &&
                      bookmark.highlight_items.length > 0 ? (

                        <ul className="mt-3 space-y-2">

                          {bookmark.highlight_items.map(
                            (highlight, index) => (
                              <li
                                key={`${bookmark.id}-${index}`}
                                className="text-sm leading-6 text-slate-600"
                              >
                                • {highlight}
                              </li>
                            )
                          )}

                        </ul>

                      ) : (

                        <p className="mt-2 text-sm text-slate-500">
                          No highlight details available.
                        </p>

                      )}

                    </div>
                  )}

                  {/* Click Hint */}
                  <p className="mt-4 text-sm font-medium text-violet-600">
                    Click to open video →
                  </p>

                  {/* Saved Date */}
                  <p className="mt-2 text-sm text-slate-400">
                    Saved on{" "}
                    {new Date(
                      bookmark.created_at
                    ).toLocaleString()}
                  </p>

                </div>

                {/* Action Buttons */}
                <div
                  className="flex flex-col gap-3 sm:flex-row md:flex-col"
                  onClick={(event) => event.stopPropagation()}
                >

                  {/* Open Video */}
                  <button
                    onClick={() =>
                      handleOpenVideo(bookmark.video_id)
                    }
                    disabled={!bookmark.video_id}
                    className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Open Video
                  </button>

                  {/* Remove Bookmark */}
                  <button
                    onClick={() =>
                      handleRemoveBookmark(bookmark.id)
                    }
                    disabled={deletingId === bookmark.id}
                    className="rounded-xl border border-red-300 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === bookmark.id
                      ? "Removing..."
                      : "Remove Bookmark"}
                  </button>

                </div>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}