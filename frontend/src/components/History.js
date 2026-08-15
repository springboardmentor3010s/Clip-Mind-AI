"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2, Clock, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

function groupByDate(events) {
  const groups = {};
  events.forEach((e) => {
    const dateKey = new Date(e.timestamp).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(e);
  });
  return groups;
}

function eventIcon(type) {
  if (type === "upload") return <Upload size={14} className="text-white" />;
  if (type === "delete") return <Trash2 size={14} className="text-white" />;
  return <Clock size={14} className="text-white" />;
}

function eventColor(type) {
  if (type === "upload") return "bg-blue";
  if (type === "delete") return "bg-red-500";
  return "bg-gray-400";
}

function eventLabel(e) {
  if (e.event_type === "upload") return `Uploaded "${e.video_title}"`;
  if (e.event_type === "delete") return `Deleted "${e.video_title}"`;
  return `${e.event_type} — ${e.video_title}`;
}

export default function History({ onOpenVideo }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  async function fetchHistory() {
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/videos/history/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEvents(await res.json());
    } catch (err) {
      // backend not reachable
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  async function handleDeleteEntry(eventId) {
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/videos/history/entry/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchHistory();
    } catch (err) {
      // ignore
    }
  }

  async function handleClearAll() {
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/videos/history/all/clear", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchHistory();
    } catch (err) {
      // ignore
    }
  }

  const grouped = groupByDate(events);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className={`text-2xl font-bold ${textPrimary}`}>Activity History</h2>
        {events.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs font-semibold text-red-500 hover:text-red-600 border border-red-300 rounded-full px-3 py-1.5 transition"
          >
            Clear All History
          </button>
        )}
      </div>
      <p className={`${textSecondary} mt-1 mb-6`}>A timeline of everything you&apos;ve done on ClipMind AI.</p>

      {loading ? (
        <p className={`text-sm ${textSecondary}`}>Loading...</p>
      ) : events.length === 0 ? (
        <div className={`${cardBg} border rounded-xl p-10 text-center`}>
          <Clock className="text-gray-400 mx-auto mb-3" size={32} />
          <p className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>No activity yet</p>
          <p className={`text-xs ${textSecondary} mt-1`}>Your uploads and actions will show up here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <h3 className={`text-sm font-semibold ${textSecondary} mb-3`}>{date}</h3>
              <div className="flex flex-col gap-2">
                {dayEvents.map((e) => (
                  <div
                    key={e.event_id}
                    onClick={() => e.video_id && onOpenVideo?.(e.video_id)}
                    className={`${cardBg} border rounded-lg px-4 py-3 shadow-sm flex items-center gap-3 group ${
                      e.video_id ? "cursor-pointer" : ""
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${eventColor(e.event_type)}`}>
                      {eventIcon(e.event_type)}
                    </div>
                    <span className={`text-sm ${isDark ? "text-gray-200" : "text-gray-800"} flex-1`}>{eventLabel(e)}</span>
                    <span className={`text-xs ${textSecondary}`}>
                      {new Date(e.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        handleDeleteEntry(e.event_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                      title="Remove this entry"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}