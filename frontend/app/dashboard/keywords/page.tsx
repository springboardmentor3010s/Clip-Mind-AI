"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getKeywords,
  getVideo,
} from "@/services/video";
import VideoPlayer from "@/components/Dashboard/VideoPlayer";

export default function KeywordsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [keywords, setKeywords] =
    useState<string[]>([]);

  const [videoName, setVideoName] =
    useState("");

  const [videoFilename, setVideoFilename] =
    useState("");

  useEffect(() => {
    const id = searchParams.get("videoId");

    if (!id) {
      setVideoName("No video selected.");
      return;
    }

    const numericId = Number(id);

    if (isNaN(numericId)) {
      setVideoName("Invalid video ID.");
      return;
    }

    const loadKeywords = async () => {
      try {
        console.log(
          "Loading keywords for video:",
          numericId
        );

        // Get video details
        const video = await getVideo(numericId);

        setVideoName(
          video.original_filename ||
            `Video ${numericId}`
        );

        setVideoFilename(
          video.filename || ""
        );

        // Get keywords
        const data =
          await getKeywords(numericId);

        console.log(
          "Keywords API:",
          data
        );

        setKeywords(
          data.keywords || []
        );

      } catch (error) {
        console.error(
          "Failed to load keywords:",
          error
        );
      }
    };

    loadKeywords();
  }, [searchParams]);
  const goToKeyMoments = () => {
  const id = searchParams.get("videoId");

  if (!id) return;

  router.push(
    `/dashboard/key-moments?videoId=${id}`
  );
};

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        🏷 Keywords
      </h1>

      {/* Video Player */}
      {videoFilename && (
        <VideoPlayer
          filename={videoFilename}
          videoName={videoName}
        />
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">

        <h2 className="font-semibold text-lg mb-6 text-black">
          {videoName}
        </h2>

        <div className="flex flex-wrap gap-3">

          {keywords.length > 0 ? (
            keywords.map(
              (keyword, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium"
                >
                  {keyword}
                </span>
              )
            )
          ) : (
            <p className="text-gray-500">
              No keywords available.
            </p>
          )}
<div className="mt-8 flex justify-end">

  <button
    onClick={goToKeyMoments}
    className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg shadow transition"
  >
    ⭐ View Key Moments →
  </button>

</div>
        </div>

      </div>

    </div>
  );
}