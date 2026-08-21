"use client";

import { useEffect, useState } from "react";

import {
  getMyVideos,
  getVideo,
  getTranscript,
  getSummary,
  getKeyMoments,
  getKeywords,
} from "@/services/video";

export default function MyVideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [keyMoments, setKeyMoments] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [activeSection, setActiveSection] =
    useState("summary");

  const [error, setError] = useState("");

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyVideos();

      console.log("MY VIDEOS:", data);

      setVideos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load videos:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load your videos."
      );
    } finally {
      setLoading(false);
    }
  };

  const openVideo = async (video: any) => {
    try {
      setDetailsLoading(true);
      setError("");

      setSelectedVideo(video);

      setTranscript("");
      setSummary("");
      setKeyMoments([]);
      setKeywords([]);

      const videoId = video.id;

      const videoDetails = await getVideo(videoId);

      setSelectedVideo({
        ...video,
        ...videoDetails,
      });

      try {
        const transcriptData =
          await getTranscript(videoId);

        setTranscript(
          typeof transcriptData === "string"
            ? transcriptData
            : transcriptData?.transcript || ""
        );
      } catch (err) {
        console.log(
          "Transcript not available yet."
        );
      }

      try {
        const summaryData =
          await getSummary(videoId);

        setSummary(
          typeof summaryData === "string"
            ? summaryData
            : summaryData?.summary || ""
        );
      } catch (err) {
        console.log(
          "Summary not available yet."
        );
      }

      try {
        const momentsData =
          await getKeyMoments(videoId);

        setKeyMoments(
          Array.isArray(momentsData)
            ? momentsData
            : momentsData?.key_moments || []
        );
      } catch (err) {
        console.log(
          "Key moments not available yet."
        );
      }

      try {
        const keywordsData =
          await getKeywords(videoId);

        setKeywords(
          Array.isArray(keywordsData)
            ? keywordsData
            : keywordsData?.keywords || []
        );
      } catch (err) {
        console.log(
          "Keywords not available yet."
        );
      }
    } catch (err: any) {
      console.error(
        "Failed to load video details:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load video details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedVideo(null);
    setTranscript("");
    setSummary("");
    setKeyMoments([]);
    setKeywords([]);
  };

    const downloadTextFile = (
    content: string,
    filename: string
  ) => {
    if (!content) {
      alert("No content available to download.");
      return;
    }

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const downloadTranscript = () => {
    const filename =
      selectedVideo?.original_filename ||
      selectedVideo?.filename ||
      "video";

    downloadTextFile(
      transcript,
      `${filename}_transcript.txt`
    );
  };

  const downloadSummary = () => {
    const filename =
      selectedVideo?.original_filename ||
      selectedVideo?.filename ||
      "video";

    downloadTextFile(
      summary,
      `${filename}_summary.txt`
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* Header */}

      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          My Videos 🎥
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          Manage your uploaded videos and AI-generated content.
        </p>
      </div>

      {/* Error */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            borderRadius: "10px",
            background: "#451A1A",
            border: "1px solid #7F1D1D",
            color: "#FCA5A5",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}

      {loading ? (
        <div
          style={{
            background: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "18px",
            padding: "30px",
            color: "#94A3B8",
          }}
        >
          Loading your videos...
        </div>
      ) : videos.length === 0 ? (
        /* No Videos */

        <div
          style={{
            background: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "18px",
            padding: "50px 30px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "50px",
              marginBottom: "15px",
            }}
          >
            🎥
          </div>

          <h2
            style={{
              fontSize: "24px",
              marginBottom: "10px",
            }}
          >
            No Videos Yet
          </h2>

          <p
            style={{
              color: "#94A3B8",
            }}
          >
            Upload your first video to see it here.
          </p>
        </div>
      ) : (
        <>
          {/* Video Cards */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            {videos.map((video) => (
              <div
                key={video.id}
                style={{
                  background: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "18px",
                  padding: "22px",
                }}
              >
                <div
                  style={{
                    fontSize: "40px",
                    marginBottom: "15px",
                  }}
                >
                  🎬
                </div>

                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    marginBottom: "10px",
                    wordBreak: "break-word",
                  }}
                >
                  {video.original_filename ||
                    video.filename ||
                    "Untitled Video"}
                </h2>

                <p
                  style={{
                    color: "#94A3B8",
                    marginBottom: "8px",
                  }}
                >
                  Video ID: {video.id}
                </p>

                {video.classroom_id && (
                  <p
                    style={{
                      color: "#94A3B8",
                      marginBottom: "15px",
                    }}
                  >
                    Classroom ID: {video.classroom_id}
                  </p>
                )}

                <div
                  style={{
                    marginBottom: "18px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "7px 12px",
                      borderRadius: "8px",
                      background:
                        video.status?.toLowerCase() ===
                        "completed"
                          ? "#064E3B"
                          : "#334155",
                      color:
                        video.status?.toLowerCase() ===
                        "completed"
                          ? "#A7F3D0"
                          : "#CBD5E1",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {video.status || "Uploaded"}
                  </span>
                </div>

                <button
                  onClick={() => openVideo(video)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#2563EB",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "15px",
                  }}
                >
                  View Content →
                </button>
              </div>
            ))}
          </div>

          {/* Video Details */}

          {selectedVideo && (
            <div
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "18px",
                padding: "25px",
              }}
            >
              {/* Details Header */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "25px",
                  gap: "15px",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "26px",
                      marginBottom: "6px",
                    }}
                  >
                    {selectedVideo.original_filename ||
                      selectedVideo.filename ||
                      "Video Details"}
                  </h2>

                  <p
                    style={{
                      color: "#94A3B8",
                    }}
                  >
                    Video ID: {selectedVideo.id}
                  </p>
                </div>

                <button
                  onClick={closeDetails}
                  style={{
                    padding: "9px 15px",
                    borderRadius: "8px",
                    border: "1px solid #475569",
                    background: "#0F172A",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>

              {detailsLoading ? (
                <p
                  style={{
                    color: "#94A3B8",
                  }}
                >
                  Loading video content...
                </p>
              ) : (
                <>
                  {/* Tabs */}

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginBottom: "20px",
                    }}
                  >
                    <TabButton
                      active={
                        activeSection === "summary"
                      }
                      onClick={() =>
                        setActiveSection("summary")
                      }
                    >
                      🤖 Summary
                    </TabButton>

                    <TabButton
                      active={
                        activeSection === "transcript"
                      }
                      onClick={() =>
                        setActiveSection("transcript")
                      }
                    >
                      📝 Transcript
                    </TabButton>

                    <TabButton
                      active={
                        activeSection === "moments"
                      }
                      onClick={() =>
                        setActiveSection("moments")
                      }
                    >
                      ⭐ Key Moments
                    </TabButton>

                    <TabButton
                      active={
                        activeSection === "keywords"
                      }
                      onClick={() =>
                        setActiveSection("keywords")
                      }
                    >
                      🔑 Keywords
                    </TabButton>
                  </div>

                
{activeSection === "summary" && (
  <ContentBox>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "15px",
        flexWrap: "wrap",
      }}
    >
      <h3>AI Summary 🤖</h3>

      {summary && (
        <button
          onClick={downloadSummary}
          style={{
            padding: "9px 14px",
            borderRadius: "8px",
            border: "none",
            background: "#2563EB",
            color: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ⬇️ Download Summary
        </button>
      )}
    </div>

    {summary ? (
      <p
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: "1.7",
          color: "#CBD5E1",
        }}
      >
        {summary}
      </p>
    ) : (
      <p
        style={{
          color: "#94A3B8",
        }}
      >
        AI summary is not available yet.
      </p>
    )}
  </ContentBox>
)}

                  {/* Transcript */}

{activeSection === "transcript" && (
  <ContentBox>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "15px",
        flexWrap: "wrap",
      }}
    >
      <h3>Transcript 📝</h3>

      {transcript && (
        <button
          onClick={downloadTranscript}
          style={{
            padding: "9px 14px",
            borderRadius: "8px",
            border: "none",
            background: "#2563EB",
            color: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ⬇️ Download Transcript
        </button>
      )}
    </div>

    {transcript ? (
      <p
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: "1.7",
          color: "#CBD5E1",
        }}
      >
        {transcript}
      </p>
    ) : (
      <p
        style={{
          color: "#94A3B8",
        }}
      >
        Transcript is not available yet.
      </p>
    )}
  </ContentBox>
)}

{/* Key Moments */}

{activeSection === "moments" && (
  <ContentBox>
    <h3>Key Moments ⭐</h3>

    {keyMoments.length === 0 ? (
      <p
        style={{
          color: "#94A3B8",
        }}
      >
        No key moments available yet.
      </p>
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          marginTop: "15px",
        }}
      >
        {keyMoments.map((moment: any, index: number) => {
          const text =
            typeof moment === "string"
              ? moment
              : moment?.text ||
                moment?.description ||
                moment?.content ||
                moment?.summary ||
                "No description available.";

          const start =
            moment?.start ??
            moment?.start_time ??
            moment?.startTime ??
            null;

          const end =
            moment?.end ??
            moment?.end_time ??
            moment?.endTime ??
            null;

          const timestamp =
            moment?.timestamp ||
            moment?.time ||
            null;

          return (
            <div
              key={index}
              style={{
                padding: "18px",
                background: "#1E293B",
                border: "1px solid #334155",
                borderLeft: "4px solid #FACC15",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "white",
                  marginBottom: "8px",
                }}
              >
                ⭐ Key Moment {index + 1}
              </div>

              {(start !== null || end !== null) && (
                <p
                  style={{
                    color: "#38BDF8",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  ⏱{" "}
                  {start !== null
                    ? `${Number(start).toFixed(2)}s`
                    : ""}
                  {end !== null
                    ? ` - ${Number(end).toFixed(2)}s`
                    : ""}
                </p>
              )}

              {timestamp && (
                <p
                  style={{
                    color: "#38BDF8",
                    marginBottom: "8px",
                    fontSize: "14px",
                  }}
                >
                  ⏱ {timestamp}
                </p>
              )}

              <p
                style={{
                  color: "#CBD5E1",
                  lineHeight: "1.6",
                  margin: 0,
                }}
              >
                {text}
              </p>
            </div>
          );
        })}
      </div>
    )}
  </ContentBox>
)}

                  {/* Keywords */}

                  {activeSection === "keywords" && (
                    <ContentBox>
                      <h3>Keywords 🔑</h3>

                      {keywords.length === 0 ? (
                        <p
                          style={{
                            color: "#94A3B8",
                          }}
                        >
                          No keywords available yet.
                        </p>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                          }}
                        >
                          {keywords.map(
                            (keyword, index) => {
                              const text =
                                typeof keyword ===
                                "string"
                                  ? keyword
                                  : keyword.keyword ||
                                    keyword.word ||
                                    keyword.text ||
                                    `Keyword ${index + 1}`;

                              return (
                                <span
                                  key={index}
                                  style={{
                                    padding:
                                      "8px 13px",
                                    borderRadius:
                                      "20px",
                                    background:
                                      "#0F172A",
                                    border:
                                      "1px solid #475569",
                                    color:
                                      "#38BDF8",
                                  }}
                                >
                                  {text}
                                </span>
                              );
                            }
                          )}
                        </div>
                      )}
                    </ContentBox>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 15px",
        borderRadius: "9px",
        border: "1px solid #475569",
        background: active
          ? "#2563EB"
          : "#0F172A",
        color: "white",
        cursor: "pointer",
        fontWeight: "600",
      }}
    >
      {children}
    </button>
  );
}

function ContentBox({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#0F172A",
        borderRadius: "12px",
        padding: "22px",
        minHeight: "150px",
      }}
    >
      {children}
    </div>
  );
}