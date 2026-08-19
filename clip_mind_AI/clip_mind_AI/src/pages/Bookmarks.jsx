import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { useVideo } from "../context/VideoContext";
import { useToast } from "../components/ui/Toast";
import { pageFade } from "../lib/motion";

function formatTimestamp(seconds) {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Saved summaries and highlights (Learner — "Bookmark summaries and highlights"). */
function Bookmarks() {
  const navigate = useNavigate();
  const { changeActiveVideo } = useVideo();
  const { toast, Toaster } = useToast();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State is only set in async continuations, guarded against unmount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/videos/bookmarks");
        if (!cancelled && res.data.success) setBookmarks(res.data.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load bookmarks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const remove = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/videos/bookmarks/${id}`);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      toast("Bookmark removed.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to remove bookmark.", "error");
    }
  };

  const open = (bookmark) => {
    changeActiveVideo(bookmark.video.id);
    navigate(bookmark.timestamp_seconds != null ? "/key-moments" : "/summary");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster />
      <motion.div {...pageFade} className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight">Bookmarks</h1>
        <p className="text-gray-400 mt-2">Summaries and highlights you have saved.</p>

        {loading && <p className="text-gray-400 mt-10 animate-pulse">Loading bookmarks…</p>}

        {error && (
          <div className="mt-10 bg-red-950/40 border border-red-900 text-red-300 rounded-xl p-4">
            {error}
          </div>
        )}

        {!loading && !error && bookmarks.length === 0 && (
          <div className="mt-16 text-center bg-slate-900 border border-slate-800 rounded-3xl p-12">
            <p className="text-5xl mb-4">🔖</p>
            <h3 className="text-xl font-bold text-gray-300">No bookmarks yet</h3>
            <p className="text-gray-500 mt-2">
              Save a video from Browse Videos or a highlight from Key Moments.
            </p>
          </div>
        )}

        <div className="space-y-3 mt-8">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              onClick={() => open(bookmark)}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-blue-600 transition group"
            >
              <div className="w-24 h-16 bg-slate-800 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                {bookmark.video.thumbnail_url ? (
                  <img
                    src={bookmark.video.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl opacity-40">🎥</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate group-hover:text-blue-400 transition">
                  {bookmark.video.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  by {bookmark.video.owner_name || "Unknown"}
                  {bookmark.timestamp_seconds != null && (
                    <span className="ml-2 text-blue-400 font-semibold">
                      @ {formatTimestamp(bookmark.timestamp_seconds)}
                    </span>
                  )}
                </p>
                {bookmark.note && (
                  <p className="text-sm text-gray-400 mt-1 truncate">{bookmark.note}</p>
                )}
              </div>

              <button
                onClick={(e) => remove(bookmark.id, e)}
                className="bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs px-3 py-2 rounded-lg font-semibold transition shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default Bookmarks;
