import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { useVideo } from "../context/VideoContext";
import { useToast } from "../components/ui/Toast";
import { pageFade } from "../lib/motion";

function formatDuration(seconds) {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Browse Videos — the Learner's library of content shared with them.
 */
function Library() {
  const navigate = useNavigate();
  const { changeActiveVideo, addBookmark } = useVideo();
  const { toast, Toaster } = useToast();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // State is only set in async continuations and guarded by `cancelled`, so a
  // fast unmount never triggers a setState on an unmounted component.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/videos/library");
        if (!cancelled && res.data.success) setVideos(res.data.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load the library.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const open = (video) => {
    changeActiveVideo(video.id);
    navigate("/summary");
  };

  const bookmark = async (video, e) => {
    e.stopPropagation();
    try {
      await addBookmark(video.id);
      toast("Bookmarked.", "success");
    } catch (err) {
      toast(err.message || "Failed to bookmark.", "error");
    }
  };

  const filtered = videos.filter((v) =>
    (v.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster />
      <motion.div {...pageFade} className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight">Browse Videos</h1>
        <p className="text-gray-400 mt-2">
          Explore content shared with you — read AI summaries and jump straight to key moments.
        </p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by title…"
          className="mt-6 w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
        />

        {loading && <p className="text-gray-400 mt-10 animate-pulse">Loading library…</p>}

        {error && (
          <div className="mt-10 bg-red-950/40 border border-red-900 text-red-300 rounded-xl p-4">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="mt-16 text-center bg-slate-900 border border-slate-800 rounded-3xl p-12">
            <p className="text-5xl mb-4">🎬</p>
            <h3 className="text-xl font-bold text-gray-300">Nothing shared yet</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              When an educator or content creator shares a video, it will appear here.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filtered.map((video) => (
            <div
              key={video.id}
              onClick={() => open(video)}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-600 transition group"
            >
              <div className="aspect-video bg-slate-800 flex items-center justify-center relative">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl opacity-40">🎥</span>
                )}
                <span className="absolute bottom-2 right-2 bg-black/70 text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration_seconds)}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate group-hover:text-blue-400 transition">
                  {video.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">by {video.owner_name || "Unknown"}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    {video.key_moment_count} key moments
                  </span>
                  <button
                    onClick={(e) => bookmark(video, e)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    🔖 Save
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default Library;
