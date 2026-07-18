"use client";

import { useEffect, useRef, useState } from "react";
import api from "../../lib/api";
import { PlayIcon } from "./icons";

/**
 * Fetches the video file via axios (so the JWT auth header actually gets
 * attached — a plain <video src="..."> tag can't send one) and renders it
 * as a blob URL in a native <video controls> element.
 */
export default function VideoPlayer({ videoId, className = "" }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const urlRef = useRef(null);
  const lastPingedAtRef = useRef(0);
  const sentSessionStartRef = useRef(false);

  function pingView(watchedSeconds, sessionStart = false) {
    api.post(`/api/v1/videos/${videoId}/views`, {
      watched_seconds: watchedSeconds,
      session_start: sessionStart,
    }).catch(() => {});
  }

  function handlePlay(e) {
    if (!sentSessionStartRef.current) {
      sentSessionStartRef.current = true;
      pingView(e.currentTarget.currentTime, true);
    }
  }

  function handleTimeUpdate(e) {
    const now = e.currentTarget.currentTime;
    if (now - lastPingedAtRef.current >= 5) {
      lastPingedAtRef.current = now;
      pingView(now);
    }
  }

  function handlePauseOrEnd(e) {
    pingView(e.currentTarget.currentTime);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    api
      .get(`/api/v1/videos/${videoId}/stream`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const url = URL.createObjectURL(res.data);
        urlRef.current = url;
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [videoId]);

  if (error) {
    return (
      <div className={`flex aspect-video flex-col items-center justify-center rounded-xl bg-ink text-white/70 ${className}`}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <PlayIcon width={22} height={22} className="text-white/40 translate-x-0.5" />
        </span>
        <p className="mt-3 text-xs text-white/40">Couldn't load this video file.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex aspect-video flex-col items-center justify-center rounded-xl bg-ink text-white/70 ${className}`}>
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
        <p className="mt-3 font-mono text-xs text-white/40">Loading video...</p>
      </div>
    );
  }

  return (
    <video
      src={src}
      controls
      preload="metadata"
      onPlay={handlePlay}
      onTimeUpdate={handleTimeUpdate}
      onPause={handlePauseOrEnd}
      onEnded={handlePauseOrEnd}
      className={`aspect-video w-full rounded-xl bg-ink ${className}`}
    />
  );
}