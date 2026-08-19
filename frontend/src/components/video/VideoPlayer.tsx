import React, { useRef, useEffect, useState } from 'react';
import { KeyMoment } from '@/types/key_moment';

interface VideoPlayerProps {
  url: string;
  onTimeUpdate?: (currentTime: number) => void;
  seekToTime?: number | null;
  onPlay?: () => void;
  keyMoments?: KeyMoment[];
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  onTimeUpdate,
  seekToTime,
  onPlay,
  keyMoments = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (seekToTime !== undefined && seekToTime !== null && videoRef.current) {
      videoRef.current.currentTime = seekToTime;
      videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
    }
  }, [seekToTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current && onTimeUpdate) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleMarkerClick = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
    }
  };

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-md-outline-variant flex flex-col">
      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full h-auto rounded-t-2xl"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={onPlay}
      />
      {duration > 0 && keyMoments.length > 0 && (
        <div className="w-full h-2.5 bg-md-surface-container-highest relative shrink-0">
          {keyMoments.map((moment) => {
            const leftPct = (moment.start_time / duration) * 100;
            const widthPct = Math.max(((moment.end_time - moment.start_time) / duration) * 100, 0.5);
            return (
              <button
                key={moment.id}
                type="button"
                onClick={() => handleMarkerClick(moment.start_time)}
                title={moment.title}
                className="absolute top-0 h-full bg-md-primary/50 hover:bg-md-primary transition-colors border-r border-md-surface cursor-pointer group"
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              >
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-md-inverse-surface text-md-inverse-on-surface text-label-small py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                  {moment.title}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
