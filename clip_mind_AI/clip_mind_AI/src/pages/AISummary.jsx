import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVideo } from "../context/VideoContext";
import { useToast } from "../components/ui/Toast";

function AISummary() {
  const { toast, Toaster } = useToast();
  const {
    activeVideo, display, translating,
    shareVideo, unshareVideo, addBookmark,
  } = useVideo();
  const [activeTab, setActiveTab] = useState("detailed");
  const [sharing, setSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  if (!activeVideo) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <p className="text-5xl mb-4">🤖</p>
          <h2 className="text-2xl font-bold">No Video Selected</h2>
          <p className="text-gray-400 mt-2">
            Please select a video from the sidebar dropdown or upload a new one to view its AI summary.
          </p>
        </div>
      </div>
    );
  }

  if (activeVideo.status !== "completed") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <p className="text-5xl mb-4">⏳</p>
          <h2 className="text-2xl font-bold">Summary Pending</h2>
          <p className="text-gray-400 mt-2">
            This video is currently in the status <strong>{activeVideo.status}</strong>. Please wait for processing to complete.
          </p>
        </div>
      </div>
    );
  }

  const summaryObj = display.summary;
  const sections = summaryObj?.content || {};
  const provider = summaryObj?.ai_provider || "AI Provider";

  const shortSummary = sections.short_summary || "No short summary available.";
  const detailedSummary = sections.detailed_summary || "No detailed summary available.";
  const bulletSummary = sections.bullet_summary || [];
  const chapterSummary = sections.chapter_summary || [];
  const importantTopics = sections.important_topics || [];
  const actionItems = sections.action_items || [];
  const glossary = sections.glossary || [];
  const keyQuestions = sections.key_questions || [];

  // Metrics
  const wordCount = detailedSummary.split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 200) || 1;

  // Build text representation for copying/downloading
  const getFullTextDocument = () => {
    let doc = "";
    doc += `Title: ${activeVideo.title}\n`;
    doc += `AI Provider: ${provider}\n\n`;
    doc += `--- SHORT SUMMARY ---\n${shortSummary}\n\n`;
    doc += `--- DETAILED SUMMARY ---\n${detailedSummary}\n\n`;
    doc += `--- BULLET SUMMARY ---\n` + bulletSummary.map((b) => `- ${b}`).join("\n") + `\n\n`;
    doc += `--- CHAPTERS ---\n` + chapterSummary.map((c) => `* ${c.chapter}: ${c.summary}`).join("\n") + `\n\n`;
    doc += `--- IMPORTANT TOPICS ---\n` + importantTopics.map((t) => `- ${t}`).join("\n") + `\n\n`;
    doc += `--- ACTION ITEMS ---\n` + actionItems.map((a) => `- ${a}`).join("\n") + `\n\n`;
    doc += `--- GLOSSARY ---\n` + glossary.map((g) => `* ${g.term}: ${g.definition}`).join("\n") + `\n\n`;
    doc += `--- Q&A ---\n` + keyQuestions.map((q) => `Q: ${q.question}\nA: ${q.answer}`).join("\n\n") + `\n`;
    return doc;
  };

  const handleDownload = () => {
    const text = getFullTextDocument();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeVideo.title || "summary"}_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast("AI Summary download started!", "success");
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(getFullTextDocument());
      toast("AI Summary copied to clipboard!", "success");
    }
  };

  // ── Sharing ─────────────────────────────────────────────────────────
  const share = activeVideo.share;
  const shareUrl = share ? `${window.location.origin}/shared/${share.token}` : "";

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareVideo(activeVideo.id, { isPublic: true });
      setShareOpen(true);
      toast("Share link created.", "success");
    } catch (err) {
      toast(err.response?.data?.message || err.message || "Sharing failed.", "error");
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async () => {
    setSharing(true);
    try {
      await unshareVideo(activeVideo.id);
      setShareOpen(false);
      toast("Share revoked.", "success");
    } catch (err) {
      toast(err.response?.data?.message || err.message || "Failed to revoke.", "error");
    } finally {
      setSharing(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    toast("Share link copied.", "success");
  };

  const handleBookmark = async () => {
    try {
      await addBookmark(activeVideo.id);
      toast("Summary bookmarked.", "success");
    } catch (err) {
      toast(err.response?.data?.message || err.message || "Failed to bookmark.", "error");
    }
  };

  const tabs = [
    { id: "detailed", label: "📝 Detailed Summary" },
    { id: "short", label: "⚡ Short Summary" },
    { id: "bullets", label: "📋 Bullet Summary" },
    { id: "chapters", label: "📖 Chapters" },
    { id: "topics", label: "🎯 Topics" },
    { id: "actions", label: "🛠️ Action Items" },
    { id: "glossary", label: "📚 Glossary" },
    { id: "qa", label: "❓ Q&A" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster />
      <div className="max-w-6xl mx-auto py-10 px-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">AI Summary</h1>
            <p className="text-gray-400 mt-2">Smart multi-layer content summary generated by {provider}.</p>
            {translating && <p className="text-blue-400 text-sm mt-1 animate-pulse">Translating…</p>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-xl font-semibold transition"
            >
              📋 Copy All
            </button>
            <button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl font-semibold transition shadow-lg shadow-blue-500/10"
            >
              ⬇️ Download
            </button>
            <button
              onClick={handleBookmark}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-xl font-semibold transition"
            >
              🔖 Bookmark
            </button>
            {activeVideo.is_owner && (
              share ? (
                <button
                  onClick={() => setShareOpen((v) => !v)}
                  className="bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl font-semibold transition"
                >
                  ✅ Shared
                </button>
              ) : (
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-5 py-2.5 rounded-xl font-semibold transition"
                >
                  {sharing ? "Sharing…" : "🔗 Share"}
                </button>
              )
            )}
          </div>
        </div>

        {/* Share panel */}
        {shareOpen && share && (
          <div className="mt-4 bg-slate-900 border border-emerald-800/60 rounded-2xl p-5">
            <p className="text-sm font-semibold text-emerald-400 mb-2">
              Anyone with this link can view the summary, transcript and key moments.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono outline-none"
              />
              <button
                onClick={copyShareLink}
                className="bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-lg font-semibold text-sm transition"
              >
                Copy
              </button>
              <button
                onClick={handleUnshare}
                disabled={sharing}
                className="bg-red-950/40 hover:bg-red-900/60 text-red-400 px-5 py-2.5 rounded-lg font-semibold text-sm transition"
              >
                Revoke
              </button>
            </div>
          </div>
        )}

        {/* Info Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg text-center">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Words</h3>
            <p className="text-2xl mt-2 font-black text-blue-400">{wordCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg text-center">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Reading Time</h3>
            <p className="text-2xl mt-2 font-black text-purple-400">{readTime} min</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg text-center">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">AI Model</h3>
            <p className="text-xl mt-2 font-black text-emerald-400 truncate px-2">{provider}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg text-center">
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Format</h3>
            <p className="text-2xl mt-2 font-black text-amber-400">Structured JSON</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/80">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-xl text-sm font-semibold transition whitespace-nowrap border
                ${activeTab === tab.id
                  ? "bg-blue-600/10 border-blue-500 text-blue-400"
                  : "bg-transparent border-transparent text-gray-400 hover:text-white"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl min-h-[300px]">
         <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
          {activeTab === "detailed" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3">Detailed Summary</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line text-base md:text-lg">{detailedSummary}</p>
            </div>
          )}

          {activeTab === "short" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3">Concise Summary</h2>
              <p className="text-gray-300 leading-relaxed text-base md:text-lg italic bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50">{shortSummary}</p>
            </div>
          )}

          {activeTab === "bullets" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3">Key Takeaways</h2>
              {bulletSummary.length === 0 ? (
                <p className="text-gray-500">No takeaway points available.</p>
              ) : (
                <ul className="list-disc pl-5 space-y-3 text-gray-300 text-base md:text-lg">
                  {bulletSummary.map((bullet, idx) => (
                    <li key={idx} className="hover:text-white transition">{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "chapters" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3">Chapter Breakdown</h2>
              {chapterSummary.length === 0 ? (
                <p className="text-gray-500">No chapters breakdown available.</p>
              ) : (
                <div className="space-y-5">
                  {chapterSummary.map((chap, idx) => (
                    <div key={idx} className="bg-slate-950/40 p-5 border border-slate-800/60 rounded-2xl">
                      <h4 className="font-bold text-blue-400 text-base md:text-lg">{chap.chapter}</h4>
                      <p className="text-gray-400 mt-2 leading-relaxed text-sm md:text-base">{chap.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "topics" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3">Covered Topics</h2>
              {importantTopics.length === 0 ? (
                <p className="text-gray-500">No key topics detected.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {importantTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-800 border border-slate-700/60 hover:border-slate-650 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 transition cursor-default"
                    >
                      # {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3">Action Items</h2>
              {actionItems.length === 0 ? (
                <p className="text-gray-500">No action items detected.</p>
              ) : (
                <ul className="space-y-4 text-gray-300 text-base md:text-lg">
                  {actionItems.map((item, idx) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <span className="text-blue-500 text-xl font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "glossary" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3">Key Terms</h2>
              {glossary.length === 0 ? (
                <p className="text-gray-500">No glossary terms extracted.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {glossary.map((g, idx) => (
                    <div key={idx} className="bg-slate-950/40 p-5 border border-slate-800/60 rounded-2xl">
                      <h4 className="font-bold text-blue-400">{g.term}</h4>
                      <p className="text-gray-400 mt-1.5 text-sm leading-relaxed">{g.definition}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "qa" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b border-slate-800 pb-3">Study Questions</h2>
              {keyQuestions.length === 0 ? (
                <p className="text-gray-500">No study questions generated.</p>
              ) : (
                <div className="space-y-4">
                  {keyQuestions.map((q, idx) => (
                    <div key={idx} className="bg-slate-950/40 p-5 border border-slate-800/60 rounded-2xl">
                      <p className="font-semibold text-gray-100"><span className="text-blue-400">Q{idx + 1}.</span> {q.question}</p>
                      <p className="text-gray-400 mt-2 text-sm leading-relaxed"><span className="text-emerald-400 font-semibold">A.</span> {q.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </motion.div>
         </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

export default AISummary;

