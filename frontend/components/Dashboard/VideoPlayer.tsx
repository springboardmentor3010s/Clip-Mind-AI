"use client";

interface VideoPlayerProps {
  filename: string;
  videoName?: string;
}

export default function VideoPlayer({
  filename,
  videoName,
}: VideoPlayerProps) {
  const videoUrl = `http://127.0.0.1:8000/videos/stream/${filename}`;

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        🎥 Video
      </h2>

      <video
        controls
        preload="metadata"
        className="w-full max-h-[500px] rounded-xl bg-black"
      >
        <source
          src={videoUrl}
          type="video/mp4"
        />

        Your browser does not support the video player.
      </video>

      {videoName && (
        <p className="mt-3 text-gray-600 font-medium">
          {videoName}
        </p>
      )}
    </div>
  );
}