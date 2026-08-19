import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { useVideo } from "../context/VideoContext";
import { pageFade } from "../lib/motion";

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Highlight every occurrence of `query` inside `text`. */
function Highlighted({ text, query }) {
  if (!query) return text;
  // Escape regex metacharacters so a query like "C++" cannot break the pattern.
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safe})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/**
 * Search Across All Videos — finds any spoken word or phrase in every video
 * the user can see, and links each hit to its timestamp.
 */
function Search() {
  const navigate = useNavigate();
  const { changeActiveVideo } = useVideo();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError("Please enter at least 2 characters.");
      return;
    }
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await api.get(`/videos/search?q=${encodeURIComponent(q)}`);
      if (res.data.success) setResults(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const jumpTo = (videoId) => {
    changeActiveVideo(videoId);
    navigate("/transcript");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <motion.div {...pageFade} className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight">Search Across All Videos</h1>
        <p className="text-gray-400 mt-2">
          Search the <span className="text-gray-200 font-semibold">spoken words</span> inside your
          videos. ClipMind searches every AI-generated transcript, then takes you to the exact
          second the phrase was said.
        </p>

        <form onSubmit={runSearch} className="flex gap-3 mt-8">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a word or phrase…"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-5 py-3.5 outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-8 py-3.5 rounded-xl font-semibold transition"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {error && (
          <div className="mt-6 bg-red-950/40 border border-red-900 text-red-300 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Explain what is actually searchable before the first search runs. */}
        {!results && !loading && !error && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-2xl mb-2">🎙️</p>
              <h3 className="font-semibold">What is searched</h3>
              <p className="text-sm text-gray-400 mt-1">
                Every word spoken in your videos, taken from the Whisper transcript — not just
                titles or filenames.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-2xl mb-2">📚</p>
              <h3 className="font-semibold">Which videos</h3>
              <p className="text-sm text-gray-400 mt-1">
                Videos you uploaded, plus every video shared with you. Anything you cannot open is
                never searched.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-2xl mb-2">⏱️</p>
              <h3 className="font-semibold">What you get</h3>
              <p className="text-sm text-gray-400 mt-1">
                Every matching line with its timestamp. Click a result to jump straight to that
                moment in the player.
              </p>
            </div>
          </div>
        )}

        {results && (
          <div className="mt-8">
            <p className="text-gray-400 text-sm">
              <span className="text-white font-bold">{results.total_matches}</span> matches in{" "}
              <span className="text-white font-bold">{results.video_count}</span> videos
            </p>

            {results.video_count === 0 && (
              <div className="mt-8 text-center bg-slate-900 border border-slate-800 rounded-3xl p-12">
                <p className="text-5xl mb-4">🔍</p>
                <h3 className="text-xl font-bold text-gray-300">No results</h3>
                <p className="text-gray-500 mt-2">
                  Nothing matched “{results.query}”. Try a different word.
                </p>
              </div>
            )}

            <div className="space-y-4 mt-6">
              {results.results.map((video) => (
                <div
                  key={video.video_id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg truncate">{video.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        by {video.owner_name}
                        {!video.is_owner && (
                          <span className="ml-2 text-blue-400">shared with you</span>
                        )}
                      </p>
                    </div>
                    <span className="bg-blue-600/15 text-blue-400 text-xs px-3 py-1.5 rounded-full font-semibold shrink-0">
                      {video.match_count} match{video.match_count === 1 ? "" : "es"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {video.matches.map((match, i) => (
                      <button
                        key={i}
                        onClick={() => jumpTo(video.video_id)}
                        className="w-full text-left flex gap-3 items-start bg-slate-950/60 hover:bg-slate-800/60 rounded-xl p-3 transition group"
                      >
                        <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded shrink-0">
                          {formatSeconds(match.start)}
                        </span>
                        <span className="text-sm text-gray-300 group-hover:text-white transition">
                          <Highlighted text={match.text} query={results.query} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Search;
