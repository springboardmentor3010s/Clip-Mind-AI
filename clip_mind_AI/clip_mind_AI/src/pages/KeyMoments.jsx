import { useRef } from "react";
import { motion } from "framer-motion";
import { useVideo } from "../context/VideoContext";
import { useToast } from "../components/ui/Toast";
import { seekAndPlay } from "../lib/player";

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function EmptyState({ icon, title, message }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center shadow-xl">
        <p className="text-5xl mb-4">{icon}</p>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-gray-400 mt-2">{message}</p>
      </div>
    </div>
  );
}

function KeyMoments() {
  const { toast, Toaster } = useToast();
  const { activeVideo, display, translating } = useVideo();
  const videoRef = useRef(null);

  if (!activeVideo) {
    return <EmptyState icon="⭐" title="No Video Selected" message="Select a completed video from the sidebar dropdown or upload a new one to view key moments." />;
  }
  if (activeVideo.status !== "completed") {
    return <EmptyState icon="⏳" title="Key Moments Pending" message={`This video is currently "${activeVideo.status}". Please wait for processing to complete.`} />;
  }

  const moments = display.key_moments || [];
  const src = activeVideo.video_file_url || activeVideo.video_file || null;

  const handleJump = (seconds) => {
    if (videoRef.current) {
      seekAndPlay(videoRef.current, seconds);
      videoRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    toast(`Playing from ${formatSeconds(seconds)}`, "success");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster />
      <div className="max-w-7xl mx-auto py-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="border-b border-slate-800 pb-6"
        >
          <h1 className="text-4xl font-extrabold tracking-tight">Key Moments</h1>
          <p className="text-gray-400 mt-2">AI-detected highlights and critical timestamps — click any moment to jump and play.</p>
          {translating && <p className="text-blue-400 text-sm mt-2 animate-pulse">Translating…</p>}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Player */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl sticky top-8">
              {src ? (
                <video ref={videoRef} src={src} controls playsInline preload="metadata" className="w-full aspect-video bg-black" />
              ) : activeVideo.youtube_id ? (
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.youtube_id}`}
                  title="Video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full aspect-video bg-black"
                />
              ) : (
                <div className="w-full aspect-video bg-black flex items-center justify-center text-gray-400">No media available.</div>
              )}
              <div className="p-4 text-center text-sm text-gray-500 font-semibold uppercase tracking-wider">
                Interactive Player {activeVideo.duration_seconds ? `· ${formatSeconds(activeVideo.duration_seconds)}` : ""}
              </div>
            </div>
          </div>

          {/* Moments list */}
          <div className="lg:col-span-7 space-y-5">
            {moments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-gray-400">
                No key moments detected for this video.
              </div>
            ) : (
              moments.map((moment, idx) => (
                <motion.div
                  key={moment.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.06 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handleJump(moment.timestamp_seconds)}
                  className="group bg-slate-900 border border-slate-800/80 hover:border-blue-500/40 rounded-2xl overflow-hidden flex flex-col sm:flex-row cursor-pointer transition"
                >
                  {/* Thumbnail */}
                  <div className="relative sm:w-56 shrink-0 bg-slate-950 aspect-video sm:aspect-auto">
                    {moment.thumbnail_url ? (
                      <img src={moment.thumbnail_url} alt={moment.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition">
                      <span className="text-3xl">▶️</span>
                    </span>
                    <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs font-mono text-blue-300">
                      {formatSeconds(moment.timestamp_seconds)}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="p-5 flex-1 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                      <span className="text-yellow-500 text-sm">⭐</span> {moment.title}
                    </h3>
                    {moment.description && (
                      <p className="text-gray-400 text-sm leading-relaxed mt-1.5 line-clamp-3">{moment.description}</p>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleJump(moment.timestamp_seconds); }}
                      className="self-start mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
                    >
                      ▶ Jump to {formatSeconds(moment.timestamp_seconds)}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeyMoments;
