import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useVideo } from "../context/VideoContext";

/**
 * Stages are tracked by the backend `progress` percentage rather than exact
 * step strings, because the pipeline branches (YouTube captions vs. audio
 * download vs. file upload) yet always advances through the same progress
 * checkpoints: 25/35/45 -> transcript, 70 -> summary, 90 -> key moments.
 */
const STAGES = [
  { label: "Ingesting Source (captions / download / audio)", min: 10, done: 40 },
  { label: "Transcribing Speech to Text", min: 40, done: 70 },
  { label: "Generating AI Summary", min: 70, done: 90 },
  { label: "Extracting Key Moments", min: 90, done: 100 },
];

function Processing() {
  const navigate = useNavigate();
  const { activeVideo } = useVideo();

  if (!activeVideo) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-8 text-center shadow-2xl">
          <p className="text-5xl mb-4">📂</p>
          <h2 className="text-2xl font-bold">No Active Video</h2>
          <p className="text-gray-400 mt-2">
            You don't have any video currently in the processing pipeline.
          </p>
          <button
            onClick={() => navigate("/upload")}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition"
          >
            Go to Upload Page
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = activeVideo.status === "completed";
  const isFailed = activeVideo.status === "failed";
  const currentStep = activeVideo.current_step || "Pending";
  const overallProgress = activeVideo.progress || 0;

  // Derive each stage's state from the overall progress percentage.
  const getStageStatus = (stage) => {
    if (isCompleted) return "completed";
    if (isFailed) return overallProgress >= stage.done ? "completed" : "failed-pending";
    if (overallProgress >= stage.done) return "completed";
    if (overallProgress >= stage.min) return "active";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-8 md:p-10 shadow-2xl"
      >

        <h1 className="text-4xl font-extrabold text-center tracking-tight">AI Processing Pipeline</h1>
        
        {isCompleted && (
          <p className="text-emerald-400 text-center font-medium mt-3 flex items-center justify-center gap-2">
            <span>✅</span> Processing complete! Your results are ready.
          </p>
        )}
        {isFailed && (
          <p className="text-red-400 text-center font-medium mt-3 flex items-center justify-center gap-2">
            <span>⚠️</span> Pipeline failed. Please see details below.
          </p>
        )}
        {!isCompleted && !isFailed && (
          <p className="text-gray-400 text-center mt-3">
            <span className="animate-pulse">Analyzing: {activeVideo.title}</span>
            <span className="block text-blue-400 font-semibold mt-1">{currentStep}…</span>
          </p>
        )}

        {/* Global Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-sm font-semibold text-gray-400 mb-2">
            <span>Overall Progress</span>
            <span className="text-blue-400 font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r
                ${isFailed ? "from-red-600 to-red-500" : "from-blue-600 to-indigo-500"}
              `}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="mt-10 space-y-6">
          {STAGES.map((stage) => {
            const status = getStageStatus(stage);

            return (
              <div
                key={stage.label}
                className={`flex items-center justify-between p-4 rounded-xl border transition
                  ${status === "active" ? "bg-slate-800/40 border-blue-500/50" : "bg-slate-800/10 border-slate-800"}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">
                    {status === "completed" && "🟢"}
                    {status === "active" && "🔵"}
                    {status === "pending" && "⚪"}
                    {status === "failed-pending" && "🔴"}
                  </div>
                  <span
                    className={`font-medium
                      ${status === "active" ? "text-white font-bold" : "text-gray-400"}
                      ${status === "completed" ? "text-gray-300" : ""}
                    `}
                  >
                    {stage.label}
                  </span>
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider">
                  {status === "completed" && <span className="text-emerald-400">Completed</span>}
                  {status === "active" && <span className="text-blue-400 animate-pulse">Running</span>}
                  {status === "pending" && <span className="text-gray-600">Pending</span>}
                  {status === "failed-pending" && <span className="text-red-400">Halted</span>}
                </span>
              </div>
            );
          })}
        </div>

        {/* Failed Error Message */}
        {isFailed && (
          <div className="mt-8 bg-red-950/20 border border-red-900/50 rounded-xl p-4 text-sm text-red-400">
            <h4 className="font-bold mb-1">Error Description:</h4>
            <p className="font-mono break-all">{activeVideo.error_message || "Unknown error occurred."}</p>
          </div>
        )}

        {/* Redirect / Action Buttons */}
        <div className="mt-10 text-center">
          {isCompleted ? (
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => navigate("/transcript")}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-200"
              >
                📄 View Transcript
              </button>
              <button
                onClick={() => navigate("/summary")}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-200"
              >
                🤖 View AI Summary
              </button>
              <button
                onClick={() => navigate("/key-moments")}
                className="bg-yellow-600 hover:bg-yellow-700 text-slate-950 px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-200"
              >
                ⭐ Key Moments
              </button>
            </div>
          ) : isFailed ? (
            <button
              onClick={() => navigate("/upload")}
              className="bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-semibold transition"
            >
              🔄 Try Another Video
            </button>
          ) : (
            <p className="text-blue-400 font-semibold animate-pulse flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-t-transparent border-blue-400 rounded-full animate-spin"></span>
              AI processing in progress... Please do not navigate away.
            </p>
          )}
        </div>

      </motion.div>
    </div>
  );
}

export default Processing;

