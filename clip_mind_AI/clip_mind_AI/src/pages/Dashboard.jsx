import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useVideo } from "../context/VideoContext";
import { pageFade, staggerContainer, cardItem } from "../lib/motion";
import { canUpload, dashboardSubtitle, ROLE_LABELS } from "../lib/roles";
import api from "../lib/api";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { videos, changeActiveVideo, deleteVideo } = useVideo();

  const [stats, setStats] = useState({
    total_videos: 0,
    total_summaries: 0,
    total_words: 0,
    videos_watched: 0,
    bookmarks_count: 0,
    completed_watched: 0,
  });

  const displayName = user?.full_name || user?.first_name || "there";
  const isUploader = canUpload(user?.role);
  const isLearner = user?.role === "learner";

  // The video list the API returns includes content shared WITH the user, not
  // just their own uploads. An uploader's dashboard must show only what they
  // own — otherwise "Your Videos" contradicts the stat cards, which count
  // owned videos only. Learners have no uploads, so they see the shared set.
  const ownedVideos = videos.filter((v) => v.is_owner);
  const displayVideos = isUploader ? ownedVideos : videos;

  // Load real metrics from analytics API
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get("/analytics/");
        if (res.data.success) setStats(res.data.data);
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      }
    };
    loadStats();
  }, [videos]);

  const handleOpenVideo = (video) => {
    changeActiveVideo(video.id);
    if (video.status === "completed") {
      navigate("/transcript");
    } else {
      navigate("/processing");
    }
  };

  const handleDeleteVideo = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        await deleteVideo(id);
      } catch (err) {
        alert(err.message || "Failed to delete video.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <motion.div {...pageFade} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Welcome Back, {displayName} 👋
            </h1>
            <p className="text-gray-400 mt-2">{dashboardSubtitle(user?.role)}</p>
            <span className="inline-block mt-3 bg-blue-600/15 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full">
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
          {/* Learners consume content — they get a browse CTA, not an upload one. */}
          <Link to={isUploader ? "/upload" : "/library"}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 px-6 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/20 transition duration-300"
            >
              {isUploader ? "📤 Upload Video" : "🎬 Browse Videos"}
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10"
        >
          {/* Learners see consumption metrics; uploaders see production metrics. */}
          {isLearner ? (
            <>
              <motion.div variants={cardItem} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transition hover:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Videos Watched</h3>
                <p className="text-4xl font-black mt-3 text-blue-400">{stats.videos_watched || 0}</p>
              </motion.div>
              <motion.div variants={cardItem} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transition hover:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Bookmarks Saved</h3>
                <p className="text-4xl font-black mt-3 text-purple-400">{stats.bookmarks_count || 0}</p>
              </motion.div>
              <motion.div variants={cardItem} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transition hover:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Completed</h3>
                <p className="text-4xl font-black mt-3 text-emerald-400">{stats.completed_watched || 0}</p>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div variants={cardItem} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transition hover:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Processed Videos</h3>
                <p className="text-4xl font-black mt-3 text-blue-400">{stats.total_videos}</p>
              </motion.div>
              <motion.div variants={cardItem} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transition hover:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">AI Summaries</h3>
                <p className="text-4xl font-black mt-3 text-purple-400">{stats.total_summaries}</p>
              </motion.div>
              <motion.div variants={cardItem} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl transition hover:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Words Transcribed</h3>
                <p className="text-4xl font-black mt-3 text-emerald-400">
                  {(stats.total_words || 0).toLocaleString()}
                </p>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Video List Table */}
        <div className="mt-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>🎥</span> {isUploader ? "Your Videos" : "Available Videos"}
          </h2>

          {displayVideos.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-5xl mb-4">📂</p>
              <h3 className="text-xl font-bold text-gray-300">
                {isUploader ? "No videos processed yet" : "No content available yet"}
              </h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                {isUploader
                  ? "Upload a video file or paste a YouTube link to generate AI transcripts and summaries."
                  : "Browse the library to explore videos shared with you by educators and creators."}
              </p>
              <Link to={isUploader ? "/upload" : "/library"}>
                <button className="mt-6 bg-slate-800 hover:bg-slate-700 px-6 py-2.5 rounded-xl font-semibold transition">
                  {isUploader ? "Get Started" : "Browse Videos"}
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-gray-400 text-sm">
                    <th className="pb-4 font-semibold">Title</th>
                    <th className="pb-4 font-semibold">Source</th>
                    <th className="pb-4 font-semibold">Status</th>
                    <th className="pb-4 font-semibold">Created At</th>
                    <th className="pb-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {displayVideos.map((vid) => (
                    <tr
                      key={vid.id}
                      onClick={() => handleOpenVideo(vid)}
                      className="group cursor-pointer hover:bg-slate-800/30 transition duration-200"
                    >
                      <td className="py-4 pr-4">
                        <div className="font-semibold text-gray-200 group-hover:text-blue-400 transition truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                          {vid.title || "YouTube Video"}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-400 capitalize">
                        {vid.video_file ? "File Upload" : "YouTube Link"}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                            ${vid.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : ""}
                            ${vid.status === "processing" ? "bg-blue-500/10 text-blue-400" : ""}
                            ${vid.status === "pending" ? "bg-amber-500/10 text-amber-400" : ""}
                            ${vid.status === "failed" ? "bg-red-500/10 text-red-400" : ""}
                          `}
                        >
                          {vid.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-400">
                        {new Date(vid.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenVideo(vid); }}
                            className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg transition font-medium"
                          >
                            Open
                          </button>
                          {vid.is_owner && (
                            <button
                              onClick={(e) => handleDeleteVideo(vid.id, e)}
                              className="bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs px-3 py-1.5 rounded-lg transition font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;