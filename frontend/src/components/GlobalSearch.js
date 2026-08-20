"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, Mic, MicOff } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function GlobalSearch({ onOpenVideo }) {
  const { isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recognitionRef = useRef(null);

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setListening(false);
      setTimeout(() => searchQuery(transcript), 200);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleVoiceSearch() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setListening(true);
      recognitionRef.current.start();
    }
  }

  async function searchQuery(q) {
    const term = (q ?? query).trim();
    if (term.length < 2) return;
    setLoading(true);
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/advanced/search?q=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch (err) {
      // ignore
    }
    setLoading(false);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary}`}>Search Across All Videos</h2>
      <p className={`${textSecondary} mt-1 mb-6`}>
        Find any spoken word or phrase across your entire video library — type it or say it.
      </p>

      <div className="flex items-center gap-2 mb-2 max-w-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchQuery()}
            placeholder={listening ? "Listening..." : "Search for a word or phrase..."}
            className={`w-full text-sm pl-10 pr-4 py-2.5 rounded-full border ${
              isDark ? "bg-[#181B23] border-white/10 text-gray-200" : "bg-white border-gray-200 text-gray-800"
            } ${listening ? "ring-2 ring-red-400" : ""}`}
          />
        </div>

        {voiceSupported && (
          <button
            onClick={toggleVoiceSearch}
            title={listening ? "Stop listening" : "Search by voice"}
            className={`p-2.5 rounded-full transition ${
              listening
                ? "bg-red-500 text-white animate-pulse"
                : isDark
                ? "bg-white/10 text-gray-300 hover:bg-white/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {listening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>
        )}

        <button
          onClick={() => searchQuery()}
          disabled={loading}
          className="bg-blue text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : "Search"}
        </button>
      </div>

      {listening && (
        <p className="text-xs text-red-500 font-medium mb-4 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          Listening — speak now
        </p>
      )}
      {!voiceSupported && (
        <p className={`text-xs ${textSecondary} mb-4`}>
          Voice search isn&apos;t supported in this browser — try Chrome or Edge.
        </p>
      )}

      {results && (
        <div className="flex flex-col gap-4 mt-4">
          {results.length === 0 ? (
            <p className={`text-sm ${textSecondary}`}>No matches found across your videos.</p>
          ) : (
            results.map((r) => (
              <div key={r.video_id} className={`${cardBg} border rounded-xl p-4 shadow-sm`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-sm font-semibold ${textPrimary}`}>{r.video_title}</h4>
                  <span className="text-xs font-semibold text-blue">
                    {r.match_count} match{r.match_count !== 1 ? "es" : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {r.matches.map((m, i) => (
                    <p key={i} className="text-xs">
                      <span className="text-blue font-semibold mr-2">{formatTime(m.start)}</span>
                      <span className={isDark ? "text-gray-300" : "text-gray-700"}>{m.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}