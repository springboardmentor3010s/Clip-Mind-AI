"use client";

import { useEffect, useState } from "react";
import { getMyVideos, getSummary } from "@/services/video";

interface Video {
  id: number;
  filename: string;
  original_filename: string;
  status: string;
}

interface SummaryData {
  summary?: string;
  short_summary?: string;
}

export default function EducatorSummariesPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [summaries, setSummaries] = useState<
    Record<number, SummaryData>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummaries = async () => {
      try {
        const videoData = await getMyVideos();

        setVideos(videoData);

        const completedVideos = videoData.filter(
          (video: Video) =>
            video.status === "Completed"
        );

        const summaryResults = await Promise.all(
          completedVideos.map(async (video: Video) => {
            try {
              const data = await getSummary(video.id);

              return {
                id: video.id,
                data,
              };
            } catch (error) {
              console.error(
                `Failed to load summary for video ${video.id}:`,
                error
              );

              return {
                id: video.id,
                data: {},
              };
            }
          })
        );

        const summaryMap: Record<number, SummaryData> = {};

        summaryResults.forEach((item) => {
          summaryMap[item.id] = item.data;
        });

        setSummaries(summaryMap);
      } catch (error) {
        console.error(
          "Failed to load educator summaries:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadSummaries();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "30px",
          color: "white",
        }}
      >
        Loading summaries...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        color: "white",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          marginBottom: "10px",
        }}
      >
        🤖 Educational Summaries
      </h1>

      <p
        style={{
          color: "#94A3B8",
          marginBottom: "30px",
        }}
      >
        Review AI-generated summaries for your lecture videos.
      </p>

      {videos.length === 0 ? (
        <div
          style={{
            background: "#1E293B",
            padding: "25px",
            borderRadius: "16px",
          }}
        >
          <p>No lectures uploaded yet.</p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {videos.map((video) => {
            const summary = summaries[video.id];

            return (
              <div
                key={video.id}
                style={{
                  background: "#1E293B",
                  borderRadius: "16px",
                  padding: "25px",
                  border: "1px solid #334155",
                }}
              >
                <h2
                  style={{
                    color: "#38BDF8",
                    fontSize: "21px",
                    marginBottom: "10px",
                  }}
                >
                  🎥 {video.original_filename}
                </h2>

                <p
                  style={{
                    color:
                      video.status === "Completed"
                        ? "#22C55E"
                        : "#F59E0B",
                    fontWeight: "600",
                    marginBottom: "20px",
                  }}
                >
                  Status: {video.status}
                </p>

                {video.status !== "Completed" ? (
                  <p
                    style={{
                      color: "#CBD5E1",
                    }}
                  >
                    AI processing is not completed yet.
                  </p>
                ) : summary?.summary ? (
                  <>
                    <h3
                      style={{
                        fontSize: "18px",
                        marginBottom: "10px",
                      }}
                    >
                      🤖 AI Generated Summary
                    </h3>

                    <div
                      style={{
                        background: "#0F172A",
                        borderRadius: "12px",
                        padding: "18px",
                        lineHeight: "1.7",
                        color: "#E2E8F0",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {summary.summary}
                    </div>
                  </>
                ) : summary?.short_summary ? (
                  <>
                    <h3
                      style={{
                        fontSize: "18px",
                        marginBottom: "10px",
                      }}
                    >
                      🤖 AI Generated Summary
                    </h3>

                    <div
                      style={{
                        background: "#0F172A",
                        borderRadius: "12px",
                        padding: "18px",
                        lineHeight: "1.7",
                        color: "#E2E8F0",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {summary.short_summary}
                    </div>
                  </>
                ) : (
                  <p
                    style={{
                      color: "#94A3B8",
                    }}
                  >
                    No summary available for this lecture yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
