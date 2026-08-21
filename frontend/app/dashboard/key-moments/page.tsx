"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getKeyMoments, getReport } from "@/services/video";
import { createBookmark } from "@/services/bookmark";

interface KeyMoment {
  start: number;
  end: number;
  text: string;
  score: number;
}

export default function KeyMomentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [videoName, setVideoName] = useState("");
  const [keyMoments, setKeyMoments] = useState<KeyMoment[]>([]);
  const [videoId, setVideoId] = useState<number | null>(null);

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

    setVideoId(numericId);

    const loadKeyMoments = async () => {
      try {
        console.log(
          "Loading key moments for video:",
          numericId
        );

        const data = await getKeyMoments(numericId);

        console.log(
          "Key Moments API:",
          data
        );

        setKeyMoments(
          data.key_moments || []
        );

        // Get video name from report endpoint
        const report = await getReport(
          numericId
        );

        setVideoName(
          report.video_name ||
            `Video ${numericId}`
        );

      } catch (error) {
        console.error(
          "Failed to load key moments:",
          error
        );

        setVideoName(
          "Failed to load video."
        );
      }
    };

    loadKeyMoments();
  }, [searchParams]);

  const bookmarkHighlight = async (
    moment: KeyMoment
  ) => {
    if (!videoId) return;

    try {
      await createBookmark({
        video_id: videoId,
        bookmark_type: "highlight",
        content: moment.text,
        timestamp: `${moment.start.toFixed(
          1
        )}s - ${moment.end.toFixed(1)}s`,
      });

      alert(
        "🔖 Highlight bookmarked successfully!"
      );

    } catch (error) {
      console.error(
        "Bookmark highlight error:",
        error
      );

      alert(
        "❌ Failed to bookmark highlight."
      );
    }
  };

  const goToReport = () => {
    if (!videoId) return;

    router.push(
      `/dashboard/report?videoId=${videoId}`
    );
  };

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        ⭐ Key Moments
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-6">

        <h2 className="text-lg font-semibold mb-6 text-black">
          {videoName}
        </h2>

        {keyMoments.length > 0 ? (
          <div className="space-y-4">

            {keyMoments.map(
              (moment, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 shadow-sm"
                >

                  {/* Timestamp */}
                  <p className="font-bold text-blue-600">
                    {moment.start.toFixed(1)}s -{" "}
                    {moment.end.toFixed(1)}s
                  </p>

                  {/* Key Moment Text */}
                  <p className="mt-2 text-black">
                    {moment.text}
                  </p>

                  {/* Importance Score */}
                  <p className="mt-2 text-sm text-gray-500">
                    Importance Score:{" "}
                    {moment.score}
                  </p>

                  {/* Bookmark */}
                  <button
                    onClick={() =>
                      bookmarkHighlight(
                        moment
                      )
                    }
                    disabled={!videoId}
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg shadow transition"
                  >
                    🔖 Bookmark Highlight
                  </button>

                </div>
              )
            )}

          </div>
        ) : (
          <p className="text-gray-500">
            No key moments available.
          </p>
        )}

        <div className="mt-8 flex justify-end">

          <button
            onClick={goToReport}
            disabled={!videoId}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg shadow transition"
          >
            📄 View AI Report →
          </button>

        </div>

      </div>

    </div>
  );
}