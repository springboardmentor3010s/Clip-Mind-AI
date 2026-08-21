import { useEffect, useRef, useState } from "react";
import { FiPause, FiPlay } from "react-icons/fi";
import { fmt } from "../utils/mockEngine";

export interface MediaPlayerHandle {
  seek: (seconds: number) => void;
}

/**
 * Timeline player used for "Jump to timestamp".
 * Uses the real media element when a blob URL is available, otherwise a
 * simulated timeline so timestamp navigation still works after a reload.
 */
export function MediaPlayer({
  src,
  durationSeconds,
  title,
  currentTime,
  onSeek,
  markers = [],
}: {
  src: string | null;
  durationSeconds: number;
  title: string;
  currentTime: number;
  onSeek: (seconds: number) => void;
  markers?: { seconds: number; label: string }[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (src && videoRef.current) {
      try { videoRef.current.currentTime = currentTime; } catch { /* ignore */ }
    }
  }, [currentTime, src]);

  useEffect(() => {
    if (src || !playing) return;
    const t = setInterval(() => {
      onSeek(Math.min(durationSeconds, currentTime + 1));
    }, 1000);
    return () => clearInterval(t);
  }, [playing, src, currentTime, durationSeconds, onSeek]);

  const pct = durationSeconds ? Math.min(100, (currentTime / durationSeconds) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="relative aspect-video bg-black">
        {src ? (
          <video
            ref={videoRef}
            src={src}
            controls
            className="h-full w-full object-contain"
            onTimeUpdate={(e) => onSeek(Math.floor((e.target as HTMLVideoElement).currentTime))}
          />
        ) : (
          <div className="absolute inset-0 grid-lines flex flex-col items-center justify-center text-center px-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Media preview unavailable</div>
            <div className="mt-2 font-display text-lg text-foreground">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Timeline navigation is simulated — the source file is not retained after reload.
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          {!src && (
            <button
              onClick={() => setPlaying((v) => !v)}
              className="h-9 w-9 rounded-lg bg-gradient-primary text-white flex items-center justify-center"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <FiPause /> : <FiPlay className="ml-0.5" />}
            </button>
          )}
          <div className="font-mono-num text-xs text-muted-foreground">
            {fmt(currentTime)} / {fmt(durationSeconds)}
          </div>
        </div>

        <div
          className="relative h-2 rounded-full bg-muted cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            onSeek(Math.round(((e.clientX - rect.left) / rect.width) * durationSeconds));
          }}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-primary" style={{ width: `${pct}%` }} />
          {markers.map((m) => (
            <span
              key={m.seconds + m.label}
              title={m.label}
              className="absolute -top-1 h-4 w-0.5 rounded bg-primary/70"
              style={{ left: `${durationSeconds ? (m.seconds / durationSeconds) * 100 : 0}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
