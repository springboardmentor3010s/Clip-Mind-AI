"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Sparkles, TrendingUp, Download, Send, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function VideoInsights({ selectedVideo }) {
  const { isDark } = useTheme();
  const [tab, setTab] = useState("chat");

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef(null);

  const [similar, setSimilar] = useState(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const [sentiment, setSentiment] = useState(null);
  const [loadingSentiment, setLoadingSentiment] = useState(false);

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
    setMessages([]);
    setSimilar(null);
    setSentiment(null);
  }, [selectedVideo]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function askQuestion() {
    if (!question.trim() || !selectedVideo) return;
    const q = question.trim();
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setAsking(true);

    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/advanced/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ video_id: selectedVideo.video_id, question: q }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", text: data.detail || "Could not answer that." }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", text: "Could not connect to server." }]);
    }
    setAsking(false);
  }

  async function loadSimilar() {
    if (!selectedVideo) return;
    setLoadingSimilar(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/advanced/similar/${selectedVideo.video_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSimilar(data.similar_videos);
      }
    } catch (err) {
      // ignore
    }
    setLoadingSimilar(false);
  }

  async function loadSentiment() {
    if (!selectedVideo) return;
    setLoadingSentiment(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/advanced/sentiment/${selectedVideo.video_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSentiment(data.timeline);
      }
    } catch (err) {
      // ignore
    }
    setLoadingSentiment(false);
  }

  function handleTabChange(t) {
    setTab(t);
    if (t === "similar" && !similar) loadSimilar();
    if (t === "sentiment" && !sentiment) loadSentiment();
  }

  async function downloadReport() {
    if (!selectedVideo) return;
    setDownloadingPdf(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/advanced/report/${selectedVideo.video_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedVideo.title.split(".")[0]}_report.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      // ignore
    }
    setDownloadingPdf(false);
  }

  if (!selectedVideo) return null;

  const tabs = [
    { key: "chat", label: "AI Chat", icon: MessageCircle },
    { key: "similar", label: "Similar Videos", icon: Sparkles },
    { key: "sentiment", label: "Sentiment", icon: TrendingUp },
  ];

  return (
    <div className={`${cardBg} border rounded-xl shadow-sm mt-6 overflow-hidden`}>
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-t-lg transition ${
                  active
                    ? "bg-blue text-white"
                    : isDark
                    ? "text-gray-400 hover:bg-white/5"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={downloadReport}
          disabled={downloadingPdf}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue hover:underline mb-2 disabled:opacity-50"
        >
          {downloadingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          Export PDF Report
        </button>
      </div>

      <div className="p-4">
        {tab === "chat" && (
          <div>
            <div className="max-h-64 overflow-y-auto flex flex-col gap-2 mb-3">
              {messages.length === 0 ? (
                <p className={`text-xs ${textSecondary} text-center py-6`}>
                  Ask anything about this video — e.g. "What is this video about?" or "What does it say about bias?"
                </p>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-blue text-white"
                          : isDark
                          ? "bg-white/5 text-gray-200"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {asking && (
                <div className="flex justify-start">
                  <div className={`rounded-xl px-3 py-2 text-sm ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                    <Loader2 size={14} className="animate-spin text-blue" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askQuestion()}
                placeholder="Ask a question about this video..."
                className={`flex-1 text-sm rounded-full border px-4 py-2 ${
                  isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              />
              <button
                onClick={askQuestion}
                disabled={asking || !question.trim()}
                className="bg-blue text-white rounded-full p-2.5 hover:opacity-90 transition disabled:opacity-50"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {tab === "similar" && (
          <div>
            {loadingSimilar ? (
              <p className={`text-xs ${textSecondary} text-center py-6`}>Finding similar videos...</p>
            ) : similar && similar.length > 0 ? (
              <div className="flex flex-col gap-2">
                {similar.map((v) => (
                  <div
                    key={v.video_id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                      isDark ? "bg-white/5" : "bg-gray-50"
                    }`}
                  >
                    <span className={`text-sm truncate ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                      {v.video_title}
                    </span>
                    <span className="text-xs font-semibold text-teal shrink-0 ml-3">{v.similarity}% match</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-xs ${textSecondary} text-center py-6`}>
                No similar videos found yet — upload and transcribe more videos to compare.
              </p>
            )}
          </div>
        )}

        {tab === "sentiment" && (
          <div>
            {loadingSentiment ? (
              <p className={`text-xs ${textSecondary} text-center py-6`}>Analyzing sentiment...</p>
            ) : sentiment && sentiment.length > 0 ? (
              <div>
                <div className="flex items-end gap-1 h-24 mb-3">
                  {sentiment.map((s, i) => {
                    const color = s.sentiment === "positive" ? "bg-teal" : s.sentiment === "negative" ? "bg-red-500" : "bg-gray-300";
                    const height = Math.abs(s.score) * 100;
                    return (
                      <div
                        key={i}
                        className={`flex-1 ${color} rounded-sm`}
                        style={{ height: `${Math.max(height, 8)}%` }}
                        title={`${s.sentiment} at ${Math.floor(s.time)}s`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-teal rounded-sm" /> Positive</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-gray-300 rounded-sm" /> Neutral</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-sm" /> Negative</span>
                </div>
              </div>
            ) : (
              <p className={`text-xs ${textSecondary} text-center py-6`}>No sentiment data available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}