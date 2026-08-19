import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import { useVideo } from "../context/VideoContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { pageFade } from "../lib/motion";
import { canEditTranscript } from "../lib/roles";

const KINDS = [
  { key: "study_notes", label: "Study Notes", icon: "📝" },
  { key: "quiz", label: "Quiz", icon: "❓" },
  { key: "flashcards", label: "Flashcards", icon: "🗂️" },
  { key: "lesson_plan", label: "Lesson Plan", icon: "📋" },
];

/** Render a material's JSON payload according to its kind. */
function MaterialBody({ material }) {
  const c = material.content || {};

  if (material.kind === "quiz") {
    return (
      <ol className="space-y-3 list-decimal list-inside">
        {(c.questions || []).map((q, i) => (
          <li key={i} className="text-sm">
            <span className="text-gray-200">{q.question}</span>
            <p className="text-emerald-400 mt-1 ml-5">Answer: {q.answer}</p>
          </li>
        ))}
        {!c.questions?.length && <p className="text-gray-500 text-sm">No questions generated.</p>}
      </ol>
    );
  }

  if (material.kind === "flashcards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(c.cards || []).map((card, i) => (
          <div key={i} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <p className="font-bold text-blue-400">{card.front}</p>
            <p className="text-sm text-gray-300 mt-1">{card.back}</p>
          </div>
        ))}
        {!c.cards?.length && <p className="text-gray-500 text-sm">No flashcards generated.</p>}
      </div>
    );
  }

  if (material.kind === "lesson_plan") {
    return (
      <div className="space-y-4 text-sm">
        {c.overview && <p className="text-gray-300">{c.overview}</p>}
        {!!c.objectives?.length && (
          <div>
            <h4 className="font-semibold text-gray-200 mb-1">Learning objectives</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              {c.objectives.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </div>
        )}
        {!!c.chapters?.length && (
          <div>
            <h4 className="font-semibold text-gray-200 mb-1">Chapters</h4>
            <ul className="space-y-1 text-gray-400">
              {c.chapters.map((ch, i) => (
                <li key={i}>
                  <span className="text-blue-400 font-medium">{ch.chapter}</span> — {ch.summary}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!!c.activities?.length && (
          <div>
            <h4 className="font-semibold text-gray-200 mb-1">Activities</h4>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              {c.activities.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // study_notes
  return (
    <div className="space-y-4 text-sm">
      {c.overview && <p className="text-gray-300 italic">{c.overview}</p>}
      {c.notes && <p className="text-gray-400 whitespace-pre-wrap">{c.notes}</p>}
      {!!c.key_points?.length && (
        <div>
          <h4 className="font-semibold text-gray-200 mb-1">Key points</h4>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            {c.key_points.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}
      {!!c.glossary?.length && (
        <div>
          <h4 className="font-semibold text-gray-200 mb-1">Glossary</h4>
          <ul className="text-gray-400 space-y-1">
            {c.glossary.map((g, i) => (
              <li key={i}>
                <span className="text-blue-400 font-medium">{g.term}</span>: {g.definition}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Learning materials.
 *
 * Educators/creators author them from a video's transcript; everyone else —
 * Learners in particular — gets a read-only view of the materials attached to
 * videos shared with them.
 */
function LearningMaterials() {
  const { videos } = useVideo();
  const { user } = useAuth();
  const { toast, Toaster } = useToast();
  const canAuthor = canEditTranscript(user?.role);

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [videoId, setVideoId] = useState("");
  const [kind, setKind] = useState("study_notes");
  const [expanded, setExpanded] = useState(null);

  const completedOwned = videos.filter((v) => v.status === "completed" && v.is_owner);

  // State is only set in async continuations, guarded against unmount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/videos/materials");
        if (!cancelled && res.data.success) setMaterials(res.data.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load materials.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!videoId) {
      toast("Select a video first.", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/videos/materials", { video_id: videoId, kind });
      if (res.data.success) {
        setMaterials((prev) => [res.data.data, ...prev]);
        toast("Learning material created.", "success");
      }
    } catch (err) {
      toast(err.response?.data?.message || "Failed to create material.", "error");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this learning material?")) return;
    try {
      await api.delete(`/videos/materials/${id}`);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      toast("Deleted.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to delete.", "error");
    }
  };

  const download = (material) => {
    const blob = new Blob([JSON.stringify(material.content, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${material.title.replace(/[^\w\s-]/g, "")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster />
      <motion.div {...pageFade} className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight">Learning Materials</h1>
        <p className="text-gray-400 mt-2">
          {canAuthor
            ? "Turn your lecture transcripts into study notes, quizzes, flashcards and lesson plans."
            : "Study notes, quizzes, flashcards and lesson plans your educators have prepared for you."}
        </p>

        {/* Create — authors only */}
        {canAuthor && (
        <form
          onSubmit={create}
          className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6"
        >
          <h2 className="font-bold text-lg mb-4">Generate from a video</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
            >
              <option value="">— Select a video —</option>
              {completedOwned.map((v) => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>

            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
            >
              {KINDS.map((k) => (
                <option key={k.key} value={k.key}>{k.icon} {k.label}</option>
              ))}
            </select>

            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-6 py-3 rounded-xl font-semibold transition"
            >
              {creating ? "Generating…" : "Generate"}
            </button>
          </div>
          {completedOwned.length === 0 && (
            <p className="text-amber-400 text-sm mt-3">
              Upload and process a lecture video first — materials are built from its transcript.
            </p>
          )}
        </form>
        )}

        {/* List */}
        {loading && <p className="text-gray-400 mt-10 animate-pulse">Loading materials…</p>}
        {error && (
          <div className="mt-6 bg-red-950/40 border border-red-900 text-red-300 rounded-xl p-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mt-8">
          {!loading && materials.length === 0 && (
            <div className="text-center bg-slate-900 border border-slate-800 rounded-3xl p-12">
              <p className="text-5xl mb-4">📚</p>
              <h3 className="text-xl font-bold text-gray-300">No materials yet</h3>
              <p className="text-gray-500 mt-2">
                {canAuthor
                  ? "Generate your first study resource above."
                  : "Your educators haven't published any study materials yet. They'll appear here once a video is shared with you."}
              </p>
            </div>
          )}

          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="p-5 flex items-center justify-between gap-4">
                <button
                  onClick={() => setExpanded(expanded === material.id ? null : material.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <h3 className="font-bold truncate">{material.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {material.kind_display} · from {material.video_title}
                  </p>
                </button>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => download(material)}
                    className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg font-semibold transition"
                  >
                    ⬇️ Export
                  </button>
                  {/* Only the author may delete — the API enforces this too. */}
                  {material.created_by_name === (user?.full_name || user?.first_name) && (
                    <button
                      onClick={() => remove(material.id)}
                      className="bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs px-3 py-2 rounded-lg font-semibold transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {expanded === material.id && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-800">
                  <MaterialBody material={material} />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LearningMaterials;
