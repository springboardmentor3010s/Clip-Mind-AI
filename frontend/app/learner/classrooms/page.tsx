"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getClassroomVideos,
  getClassroomSharedSummaries,
} from "@/services/classroom";

interface Video {
  id: number;
  filename?: string;
  original_filename?: string;
  status?: string;
  classroom_id?: number;
  transcript_available?: boolean;
  summary_available?: boolean;
}

interface SharedSummary {
  share_id: number;
  video_id: number;
  classroom_id: number;
  filename?: string;
  original_filename?: string;
  status?: string;
  summary?: string;
}

export default function ClassroomPage() {
  const params = useParams();

  const classroomId = Number(params.id);

  const [videos, setVideos] = useState<Video[]>([]);
  const [summaries, setSummaries] = useState<SharedSummary[]>([]);

  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadingSummaries, setLoadingSummaries] = useState(true);

  const [videoError, setVideoError] = useState("");
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    if (!classroomId) return;

    const loadClassroomContent = async () => {
      try {
        setLoadingVideos(true);
        setVideoError("");

        const data = await getClassroomVideos(classroomId);

        console.log("CLASSROOM VIDEOS:", data);

        if (Array.isArray(data)) {
          setVideos(data);
        } else {
          setVideos([]);
        }
      } catch (error: any) {
        console.error("Error loading classroom videos:", error);

        setVideoError(
          error?.response?.data?.detail ||
            "Unable to load classroom videos."
        );
      } finally {
        setLoadingVideos(false);
      }
    };

    const loadSharedSummaries = async () => {
      try {
        setLoadingSummaries(true);
        setSummaryError("");

        const data =
          await getClassroomSharedSummaries(classroomId);

        console.log("CLASSROOM SHARED SUMMARIES:", data);

        if (Array.isArray(data)) {
          setSummaries(data);
        } else {
          setSummaries([]);
        }
      } catch (error: any) {
        console.error(
          "Error loading shared summaries:",
          error
        );

        setSummaryError(
          error?.response?.data?.detail ||
            "Unable to load shared summaries."
        );
      } finally {
        setLoadingSummaries(false);
      }
    };

    loadClassroomContent();
    loadSharedSummaries();
  }, [classroomId]);

  return (
    <div
      style={{
        minHeight: "100%",
        color: "white",
        paddingBottom: "40px",
      }}
    >
      {/* Header */}

      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "34px",
            fontWeight: "700",
            marginBottom: "8px",
          }}
        >
          🏫 Classroom
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          Classroom ID: {classroomId}
        </p>
      </div>

      {/* Classroom Overview */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "25px",
        }}
      >
        <h2
          style={{
            fontSize: "25px",
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          Classroom Overview
        </h2>

        <p
          style={{
            color: "#CBD5E1",
            marginBottom: "25px",
          }}
        >
          Access lecture videos and AI-generated summaries
          shared by your educator.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "20px",
          }}
        >
          {/* Lectures */}

          <div
            style={{
              background: "#273449",
              borderRadius: "12px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                marginBottom: "8px",
              }}
            >
              🎥
            </div>

            <h3
              style={{
                fontSize: "20px",
                marginBottom: "5px",
              }}
            >
              Lectures
            </h3>

            <p
              style={{
                color: "#94A3B8",
                margin: 0,
              }}
            >
              {loadingVideos
                ? "Loading..."
                : `${videos.length} lecture${
                    videos.length !== 1 ? "s" : ""
                  } available`}
            </p>
          </div>

          {/* Summaries */}

          <div
            style={{
              background: "#273449",
              borderRadius: "12px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                marginBottom: "8px",
              }}
            >
              📝
            </div>

            <h3
              style={{
                fontSize: "20px",
                marginBottom: "5px",
              }}
            >
              AI Summaries
            </h3>

            <p
              style={{
                color: "#94A3B8",
                margin: 0,
              }}
            >
              {loadingSummaries
                ? "Loading..."
                : `${summaries.length} summar${
                    summaries.length !== 1
                      ? "ies"
                      : "y"
                  } available`}
            </p>
          </div>
        </div>
      </div>

      {/* Lecture Videos */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "25px",
                fontWeight: "600",
                marginBottom: "6px",
              }}
            >
              🎥 Lecture Videos
            </h2>

            <p
              style={{
                color: "#94A3B8",
                margin: 0,
              }}
            >
              Lecture videos shared in this classroom.
            </p>
          </div>

          <div
            style={{
              background: "#334155",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: "600",
              color: "#93C5FD",
            }}
          >
            {videos.length} Videos
          </div>
        </div>

        {/* Loading */}

        {loadingVideos && (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#94A3B8",
            }}
          >
            Loading lecture videos...
          </div>
        )}

        {/* Error */}

        {!loadingVideos && videoError && (
          <div
            style={{
              background: "#451A1A",
              border: "1px solid #7F1D1D",
              borderRadius: "10px",
              padding: "16px",
              color: "#FCA5A5",
            }}
          >
            {videoError}
          </div>
        )}

        {/* No Videos */}

        {!loadingVideos &&
          !videoError &&
          videos.length === 0 && (
            <div
              style={{
                background: "#273449",
                borderRadius: "12px",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "45px",
                  marginBottom: "12px",
                }}
              >
                🎥
              </div>

              <h3
                style={{
                  fontSize: "20px",
                  marginBottom: "8px",
                }}
              >
                No lectures available
              </h3>

              <p
                style={{
                  color: "#94A3B8",
                  margin: 0,
                }}
              >
                Your educator has not added any lecture
                videos to this classroom yet.
              </p>
            </div>
          )}

        {/* Videos */}

        {!loadingVideos &&
          !videoError &&
          videos.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {videos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    background: "#273449",
                    borderRadius: "12px",
                    padding: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: "600",
                      }}
                    >
                      🎬{" "}
                      {video.original_filename ||
                        video.filename ||
                        "Lecture Video"}
                    </h3>

                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#94A3B8",
                      }}
                    >
                      Status: {video.status || "Available"}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {video.transcript_available && (
                        <span
                          style={{
                            background: "#1E3A8A",
                            color: "#BFDBFE",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                          }}
                        >
                          Transcript Available
                        </span>
                      )}

                      {video.summary_available && (
                        <span
                          style={{
                            background: "#4C1D95",
                            color: "#DDD6FE",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "13px",
                          }}
                        >
                          AI Summary Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Shared Summaries */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "25px",
                fontWeight: "600",
                marginBottom: "6px",
              }}
            >
              📚 Shared Lecture Summaries
            </h2>

            <p
              style={{
                color: "#94A3B8",
                margin: 0,
              }}
            >
              AI-generated summaries shared by your educator.
            </p>
          </div>

          <div
            style={{
              background: "#334155",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: "600",
              color: "#C4B5FD",
            }}
          >
            {summaries.length}{" "}
            {summaries.length === 1
              ? "Summary"
              : "Summaries"}
          </div>
        </div>

        {/* Loading */}

        {loadingSummaries && (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#94A3B8",
            }}
          >
            Loading summaries...
          </div>
        )}

        {/* Error */}

        {!loadingSummaries && summaryError && (
          <div
            style={{
              background: "#451A1A",
              border: "1px solid #7F1D1D",
              borderRadius: "10px",
              padding: "16px",
              color: "#FCA5A5",
            }}
          >
            {summaryError}
          </div>
        )}

        {/* No Summaries */}

        {!loadingSummaries &&
          !summaryError &&
          summaries.length === 0 && (
            <div
              style={{
                background: "#273449",
                borderRadius: "12px",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "45px",
                  marginBottom: "12px",
                }}
              >
                📝
              </div>

              <h3
                style={{
                  fontSize: "20px",
                  marginBottom: "8px",
                }}
              >
                No summaries shared yet
              </h3>

              <p
                style={{
                  color: "#94A3B8",
                  margin: 0,
                }}
              >
                Your educator has not shared any AI-generated
                summaries with this classroom yet.
              </p>
            </div>
          )}

        {/* Summaries */}

        {!loadingSummaries &&
          !summaryError &&
          summaries.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {summaries.map((summary) => (
                <div
                  key={summary.share_id}
                  style={{
                    background: "#273449",
                    borderRadius: "12px",
                    padding: "22px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "19px",
                      fontWeight: "600",
                      marginBottom: "10px",
                    }}
                  >
                    📄{" "}
                    {summary.original_filename ||
                      summary.filename ||
                      "Lecture Summary"}
                  </h3>

                  <p
                    style={{
                      color: "#94A3B8",
                      fontSize: "14px",
                      marginBottom: "15px",
                    }}
                  >
                    Status:{" "}
                    {summary.status || "Available"}
                  </p>

                  <div
                    style={{
                      background: "#1E293B",
                      borderRadius: "10px",
                      padding: "18px",
                      lineHeight: "1.7",
                      color: "#E2E8F0",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {summary.summary ||
                      "No summary content available."}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}