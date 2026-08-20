"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function NotificationBell() {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("clipmind_token");
    fetch("http://localhost:8000/api/v1/videos/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function eventLabel(n) {
    const map = {
      view: "watched",
      upload: "uploaded",
      transcript_generated: "generated a transcript on",
      summary_generated: "generated a summary on",
    };
    return map[n.event_type] || n.event_type.replace(/_/g, " ");
  }

  function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-300 hover:bg-white/10 transition"
      >
        <Bell size={17} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div
          className={`absolute left-0 top-full mt-2 w-72 rounded-xl shadow-2xl overflow-hidden border z-30 ${
            isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200"
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-200/10">
            <p className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className={`text-xs px-4 py-6 text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              Nothing new right now.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.event_id} className="px-4 py-2.5 border-b border-gray-200/5 last:border-0">
                  <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    <span className="font-semibold">{n.actor}</span> {eventLabel(n)}{" "}
                    <span className="font-medium">{n.video_title}</span>
                  </p>
                  <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    {timeAgo(n.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}