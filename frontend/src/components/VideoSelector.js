"use client";

import { useState, useEffect } from "react";
import { Play, ChevronDown, Download } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function VideoSelector({ onSelect, selectedVideo }) {
  const [videos, setVideos] = useState([]);
  const [open, setOpen] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    async function fetchVideos() {
      const token = localStorage.getItem("clipmind_token");
      try {
        const res = await fetch("http://localhost:8000/api/v1/videos/my-videos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setVideos(data);
          if (data.length > 0 && !selectedVideo) onSelect(data[0]);
        }
      } catch (err) {
        // ignore
      }
    }
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (videos.length === 0) return null;

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 w-full px-4 py-2.5 rounded-lg border text-sm font-medium ${
          isDark ? "bg-[#181B23] border-white/10 text-gray-200" : "bg-white border-gray-200 text-gray-800"
        }`}
      >
        <span className="truncate">{selectedVideo ? selectedVideo.title : "Select a video"}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className={`absolute z-10 mt-1 w-full rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
            isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200"
          }`}
        >
          {videos.map((v) => (
            <button
              key={v.video_id}
              onClick={() => {
                onSelect(v);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm truncate ${
                isDark ? "text-gray-200 hover:bg-white/5" : "text-gray-800 hover:bg-gray-50"
              }`}
            >
              {v.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}