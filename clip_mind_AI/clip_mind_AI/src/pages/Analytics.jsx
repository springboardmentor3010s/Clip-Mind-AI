import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { pageFade } from "../lib/motion";
import api from "../lib/api";

function Analytics() {
  const [data, setData] = useState({
    total_videos: 0,
    completed_count: 0,
    failed_count: 0,
    processing_count: 0,
    total_summaries: 0,
    total_words: 0,
    history: []
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await api.get("/analytics/");
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setError(
          err.response?.data?.message || "Failed to load analytics. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></span>
      </div>
    );
  }

  // Calculate chart parameters
  const maxCount = data.history.length > 0 ? Math.max(...data.history.map(h => h.count)) : 0;
  const chartHeight = 240;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto py-10 px-6">

        <motion.div {...pageFade}>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Analytics Workspace
          </h1>
          <p className="text-gray-400 mt-2">
            Real-time metrics, processing summaries, and activity charts.
          </p>
        </motion.div>

        {error && (
          <div className="mt-6 bg-red-950/40 border border-red-800 text-red-400 rounded-xl p-4">
            ⚠️ {error}
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Videos</h3>
            <p className="text-4xl font-black mt-3 text-blue-400">{data.total_videos}</p>
            <div className="flex gap-2.5 text-xs text-gray-500 mt-3 font-semibold">
              <span className="text-emerald-400">● {data.completed_count} done</span>
              <span className="text-blue-400">● {data.processing_count} active</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">AI Summaries</h3>
            <p className="text-4xl font-black mt-3 text-purple-400">{data.total_summaries}</p>
            <span className="block text-xs text-gray-500 mt-3 font-medium">1:1 matching with video records</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Completed</h3>
            <p className="text-4xl font-black mt-3 text-amber-400">{data.completed_count}</p>
            <span className="block text-xs text-gray-500 mt-3 font-medium">
              {data.failed_count > 0 ? `${data.failed_count} failed` : "Successfully processed videos"}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Speech-to-Text Words</h3>
            <p className="text-4xl font-black mt-3 text-emerald-400 truncate">{data.total_words.toLocaleString()}</p>
            <span className="block text-xs text-gray-500 mt-3 font-medium">Whisper-transcribed database volume</span>
          </div>

        </div>

        {/* Processing Activity Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 mt-10 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>📈</span> Processing Activity History
          </h2>

          {data.history.length === 0 ? (
            <div className="h-80 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-gray-500">
              No processing history available to plot.
            </div>
          ) : (
            <div className="relative pt-6">
              {/* Custom SVG Bar Chart */}
              <div className="flex items-end justify-between gap-4 h-[240px] border-b border-slate-800 pb-2 overflow-x-auto select-none scrollbar-none">
                {data.history.map((hist, idx) => {
                  const percentage = maxCount > 0 ? (hist.count / maxCount) * 100 : 0;
                  const barHeight = (percentage * chartHeight) / 100;

                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 min-w-[48px] group">
                      <div className="relative w-full flex justify-center">
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-slate-950 border border-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-xl font-bold">
                          {hist.count} video{hist.count > 1 ? "s" : ""}
                        </div>

                        {/* Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(8, barHeight)}px` }}
                          transition={{ duration: 0.6, delay: idx * 0.03, ease: "easeOut" }}
                          className="w-8 sm:w-10 rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 shadow-lg shadow-blue-500/10"
                        />
                      </div>

                      {/* X Axis Label */}
                      <span className="text-[10px] text-gray-500 mt-3 font-semibold">
                        {new Date(hist.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Analytics;