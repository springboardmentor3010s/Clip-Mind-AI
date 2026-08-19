import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import { pageFade, staggerContainer, cardItem } from "../lib/motion";

function StatCard({ icon, value, label, color }) {
  return (
    <motion.div
      variants={cardItem}
      className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg mb-3`}>
        {icon}
      </div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </motion.div>
  );
}

/** Bar chart rendered with plain divs — no charting dependency required. */
function BarChart({ data, labelKey, valueKey }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="space-y-3">
      {data.map((row, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300 truncate max-w-[70%]">{row[labelKey]}</span>
            <span className="text-gray-500">{row[valueKey]}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
              style={{ width: `${(row[valueKey] / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Educator — classroom content analytics and student engagement metrics. */
function ClassroomAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/analytics/classroom");
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load classroom analytics.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-gray-400 animate-pulse p-8">Loading classroom analytics…</p>;
  }
  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-900 text-red-300 rounded-xl p-4 m-8">
        {error}
      </div>
    );
  }

  const maxEngagement = Math.max(...data.engagement_series.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <motion.div {...pageFade} className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight">Classroom Analytics</h1>
        <p className="text-gray-400 mt-2">
          See how students are engaging with your uploaded videos.
        </p>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8"
        >
          <StatCard icon="🎥" value={data.total_videos} label="Total Videos" color="bg-blue-600/20" />
          <StatCard icon="👁️" value={data.total_student_views} label="Total Student Views" color="bg-emerald-600/20" />
          <StatCard icon="👥" value={data.unique_students} label="Unique Students" color="bg-purple-600/20" />
          <StatCard icon="✅" value={data.completion_count} label="Completions" color="bg-amber-600/20" />
        </motion.div>

        {data.top_video && (
          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center text-2xl shrink-0">
              🏆
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Top Performing Video
              </p>
              <p className="font-bold truncate">{data.top_video.title}</p>
              <p className="text-sm text-gray-400">
                {data.top_video.views} views · {data.top_video.unique_students} students
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Engagement over time */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-6">Engagement — Last 14 Days</h2>
            <div className="flex items-end gap-1.5 h-40">
              {data.engagement_series.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full bg-blue-600 rounded-t hover:bg-blue-500 transition min-h-[2px]"
                    style={{ height: `${(day.count / maxEngagement) * 100}%` }}
                    title={`${day.date}: ${day.count} views`}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3 text-center">
              {data.engagement_series[0]?.date} → {data.engagement_series.at(-1)?.date}
            </p>
          </div>

          {/* Views by video */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-6">Views by Video</h2>
            {data.per_video.length ? (
              <BarChart data={data.per_video.slice(0, 8)} labelKey="title" valueKey="views" />
            ) : (
              <p className="text-gray-500 text-sm">No videos uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Student engagement table */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">Student Engagement</h2>
          {data.students.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center">
              No students have watched your videos yet. Share a video to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-slate-800">
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Videos Watched</th>
                    <th className="pb-3 font-semibold">Total Views</th>
                    <th className="pb-3 font-semibold">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.students.map((student) => (
                    <tr key={student.user_id}>
                      <td className="py-3">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </td>
                      <td className="py-3 text-gray-300">{student.videos_watched}</td>
                      <td className="py-3 text-gray-300">{student.total_views}</td>
                      <td className="py-3">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {student.completed}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per-video detail */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">Per-Video Engagement</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-slate-800">
                  <th className="pb-3 font-semibold">Video</th>
                  <th className="pb-3 font-semibold">Views</th>
                  <th className="pb-3 font-semibold">Students</th>
                  <th className="pb-3 font-semibold">Completed</th>
                  <th className="pb-3 font-semibold">Avg Watch</th>
                  <th className="pb-3 font-semibold">Shared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.per_video.map((video) => (
                  <tr key={video.video_id}>
                    <td className="py-3 max-w-xs truncate font-medium">{video.title}</td>
                    <td className="py-3 text-gray-300">{video.views}</td>
                    <td className="py-3 text-gray-300">{video.unique_students}</td>
                    <td className="py-3 text-gray-300">{video.completed_count}</td>
                    <td className="py-3 text-gray-300">{Math.round(video.avg_watch_seconds)}s</td>
                    <td className="py-3">
                      {video.is_shared ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.per_video.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No videos uploaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ClassroomAnalytics;
