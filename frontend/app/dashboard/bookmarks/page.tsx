"use client";

import { useEffect, useState } from "react";
import {
  getMyBookmarks,
  deleteBookmark,
  Bookmark,
} from "@/services/bookmark";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    try {
      const data = await getMyBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const removeBookmark = async (bookmarkId: number) => {
    try {
      await deleteBookmark(bookmarkId);

      setBookmarks((previous) =>
        previous.filter(
          (bookmark) => bookmark.id !== bookmarkId
        )
      );
    } catch (error) {
      console.error(
        "Error deleting bookmark:",
        error
      );

      alert("❌ Failed to remove bookmark.");
    }
  };

  const getBookmarkIcon = (type: string) => {
    switch (type) {
      case "summary":
        return "🤖";

      case "highlight":
        return "⭐";

      default:
        return "🔖";
    }
  };

  const getBookmarkTitle = (type: string) => {
    switch (type) {
      case "summary":
        return "Summary";

      case "highlight":
        return "Highlight";

      default:
        return "Bookmark";
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        color: "white",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "bold",
          marginBottom: "25px",
        }}
      >
        🔖 My Bookmarks
      </h1>

      {loading ? (
        <div
          style={{
            background: "#1E293B",
            padding: "25px",
            borderRadius: "15px",
          }}
        >
          <p>Loading bookmarks...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div
          style={{
            background: "#1E293B",
            padding: "35px",
            borderRadius: "15px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "50px",
              marginBottom: "15px",
            }}
          >
            🔖
          </div>

          <h2
            style={{
              fontSize: "22px",
              marginBottom: "10px",
            }}
          >
            No bookmarks yet
          </h2>

          <p
            style={{
              color: "#94A3B8",
            }}
          >
            Bookmark summaries and highlights while
            learning to find them here later.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              style={{
                background: "#1E293B",
                borderRadius: "15px",
                padding: "22px",
                border: "1px solid #334155",
              }}
            >
              {/* Bookmark Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "15px",
                }}
              >
                <div>
                  <h2
                    style={{
                      color: "#38BDF8",
                      fontSize: "20px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {getBookmarkIcon(
                      bookmark.bookmark_type
                    )}{" "}
                    {getBookmarkTitle(
                      bookmark.bookmark_type
                    )}
                  </h2>

                  {bookmark.timestamp && (
                    <p
                      style={{
                        color: "#F59E0B",
                        fontWeight: "600",
                        marginBottom: "10px",
                      }}
                    >
                      ⏱ {bookmark.timestamp}
                    </p>
                  )}
                </div>

                <button
                  onClick={() =>
                    removeBookmark(bookmark.id)
                  }
                  style={{
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#EF4444",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  🗑 Remove
                </button>
              </div>

              {/* Bookmark Content */}
              <div
                style={{
                  marginTop: "12px",
                  padding: "16px",
                  background: "#0F172A",
                  borderRadius: "10px",
                  color: "#E2E8F0",
                  lineHeight: "1.7",
                  whiteSpace: "pre-wrap",
                }}
              >
                {bookmark.content}
              </div>

              {/* Created Date */}
              <p
                style={{
                  marginTop: "12px",
                  color: "#64748B",
                  fontSize: "13px",
                }}
              >
                Saved on{" "}
                {new Date(
                  bookmark.created_at
                ).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}