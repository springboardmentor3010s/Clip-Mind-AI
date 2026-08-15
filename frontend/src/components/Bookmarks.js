"use client";

import { useState, useEffect } from "react";
import { Bookmark, Trash2, Video } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function Bookmarks() {
  const { isDark } = useTheme();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  async function fetchBookmarks() {
    const token = localStorage.getItem("clipmind_token");
    try {
    const res = await fetch("http://localhost:8000/api/v1/bookmarks/my-bookmarks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks);
      }
    } catch (err) {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBookmarks();
  }, []);

  async function removeBookmark(videoId) {
    const token = localStorage.getItem("clipmind_token");
    await fetch(`http://localhost:8000/api/v1/bookmarks/${videoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchBookmarks();
  }

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary}`}>My Bookmarks</h2>
      <p className={`${textSecondary} mt-1 mb-6`}>Summaries and highlights you've saved for later.</p>

      {loading ? (
        <p className={`text-sm ${textSecondary}`}>Loading...</p>
      ) : bookmarks.length === 0 ? (
        <div className={`${cardBg} border rounded-xl p-10 text-center`}>
          <Bookmark className="text-gray-400 mx-auto mb-3" size={28} />
          <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>No bookmarks yet</p>
          <p className={`text-xs ${textSecondary} mt-1`}>
            Go to Summaries or Key Moments and click the bookmark icon to save content here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookmarks.map((b) => (
            <div key={b.video_id} className={`${cardBg} border rounded-xl p-4 shadow-sm flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center shrink-0">
                <Video size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${textPrimary}`}>{b.video_title}</p>
                {b.note && <p className={`text-xs ${textSecondary} truncate`}>{b.note}</p>}
              </div>
              <button
                onClick={() => removeBookmark(b.video_id)}
                className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}