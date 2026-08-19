import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { useVideo } from "../context/VideoContext";
import { useToast } from "../components/ui/Toast";
import { pageFade } from "../lib/motion";

const TABS = [
  { key: "learning", label: "Learning History" },
  { key: "activity", label: "Account Activity" },
];

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * History — learning history (videos watched) plus the account activity log
 * (Module 1 "Activity history", Learner "Save learning history").
 */
function History() {
  const navigate = useNavigate();
  const { changeActiveVideo } = useVideo();
  const { toast, Toaster } = useToast();

  const [tab, setTab] = useState("learning");
  const [history, setHistory] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Both tabs are fetched together; state only set in async continuations.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [historyRes, activityRes] = await Promise.all([
          api.get("/videos/history"),
          api.get("/auth/activity"),
        ]);
        if (cancelled) return;
        if (historyRes.data.success) setHistory(historyRes.data.data);
        if (activityRes.data.success) setActivity(activityRes.data.data.results);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const clearHistory = async () => {
    if (!window.confirm("Clear your entire learning history?")) return;
    try {
      await api.delete("/videos/history");
      setHistory([]);
      toast("Learning history cleared.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to clear history.", "error");
    }
  };

  const open = (item) => {
    changeActiveVideo(item.video.id);
    navigate("/summary");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster />
      <motion.div {...pageFade} className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">History</h1>
            <p className="text-gray-400 mt-2">What you have watched and done on ClipMind AI.</p>
          </div>
          {tab === "learning" && history.length > 0 && (
            <button
              onClick={clearHistory}
              className="bg-red-950/40 hover:bg-red-900/60 text-red-400 px-4 py-2.5 rounded-xl font-semibold transition"
            >
              Clear history
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-6 border-b border-slate-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 font-semibold text-sm transition border-b-2 ${
                tab === t.key
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-400 mt-10 animate-pulse">Loading…</p>}
        {error && (
          <div className="mt-10 bg-red-950/40 border border-red-900 text-red-300 rounded-xl p-4">
            {error}
          </div>
        )}

        {!loading && tab === "learning" && (
          <div className="space-y-3 mt-8">
            {history.length === 0 && (
              <div className="text-center bg-slate-900 border border-slate-800 rounded-3xl p-12">
                <p className="text-5xl mb-4">🕘</p>
                <h3 className="text-xl font-bold text-gray-300">No learning history yet</h3>
                <p className="text-gray-500 mt-2">Videos you watch will be tracked here.</p>
              </div>
            )}
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => open(item)}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-blue-600 transition group"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate group-hover:text-blue-400 transition">
                    {item.video.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Watched {item.view_count}× · last {timeAgo(item.last_viewed_at)}
                  </p>
                </div>
                {item.completed && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-semibold shrink-0">
                    Completed
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "activity" && (
          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/60">
            {activity.length === 0 && (
              <p className="p-8 text-center text-gray-500">No activity recorded yet.</p>
            )}
            {activity.map((entry) => (
              <div key={entry.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{entry.action_display}</p>
                  {entry.description && (
                    <p className="text-xs text-gray-500 truncate">{entry.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {timeAgo(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default History;
