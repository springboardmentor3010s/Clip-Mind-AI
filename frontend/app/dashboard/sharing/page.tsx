"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Classroom {
  id: number;
  name: string;
  code: string;
  student_count?: number;
}

interface Video {
  id: number;
  filename: string;
  original_filename: string;
  status: string;
  classroom_id?: number;
  summary?: string;
}

export default function ShareWithStudentsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  const [selectedClassroom, setSelectedClassroom] =
    useState("");

  const [selectedVideo, setSelectedVideo] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setError("Authentication required.");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [classroomResponse, videoResponse] =
          await Promise.all([
            api.get("/classrooms/my-classrooms", {
              headers,
            }),
            api.get("/videos/my-videos", {
              headers,
            }),
          ]);

        setClassrooms(
          Array.isArray(classroomResponse.data)
            ? classroomResponse.data
            : []
        );

console.log("MY VIDEOS:", videoResponse.data);
        setVideos(
          Array.isArray(videoResponse.data)
            ? videoResponse.data
            : []
        );
      } catch (err: any) {
        console.error("Failed to load sharing data:", err);

        setError(
          err?.response?.data?.detail ||
            "Failed to load classrooms and lectures."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const selectedClassroomData =
    classrooms.find(
      (classroom) =>
        String(classroom.id) === selectedClassroom
    );

  const classroomVideos = videos.filter((video) => {
    if (!selectedClassroom) return false;

    return (
      video.classroom_id ===
      Number(selectedClassroom)
    );
  });

  const selectedVideoData = videos.find(
    (video) =>
      String(video.id) === selectedVideo
  );

  const handleShare = async () => {
    setMessage("");
    setError("");

    if (!selectedClassroom) {
      setError("Please select a classroom.");
      return;
    }

    if (!selectedVideo) {
      setError("Please select a lecture.");
      return;
    }

    if (!selectedVideoData?.summary) {
      setError(
        "This lecture does not have an AI summary yet."
      );
      return;
    }

    try {
  setSharing(true);

  const token = localStorage.getItem("token");

  await api.post(
    "/summary-shares/",
    {
      video_id: Number(selectedVideo),
      classroom_id: Number(selectedClassroom),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  setMessage("Lecture summary shared successfully with the classroom.");
  setSelectedVideo("");
} catch (err: any) {
  console.error("Share error:", err);

  setError(
    err?.response?.data?.detail ||
      "Failed to share summary."
  );
} finally {
  setSharing(false);
}

  return (
    <div
      style={{
        minHeight: "100%",
        color: "white",
        padding: "10px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          marginBottom: "35px",
        }}
      >
        <h1
          style={{
            fontSize: "38px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          📢 Share with Students
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          Share AI-generated lecture summaries
          with students in your classrooms.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div
          style={{
            background: "#451A1A",
            border: "1px solid #991B1B",
            color: "#FCA5A5",
            padding: "16px 20px",
            borderRadius: "12px",
            marginBottom: "25px",
          }}
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {message && (
        <div
          style={{
            background: "#064E3B",
            border: "1px solid #059669",
            color: "#A7F3D0",
            padding: "16px 20px",
            borderRadius: "12px",
            marginBottom: "25px",
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div
          style={{
            background: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
            color: "#94A3B8",
          }}
        >
          Loading classrooms and lectures...
        </div>
      ) : (
        <>
          {/* MAIN SHARE CARD */}

          <div
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "18px",
              padding: "30px",
              marginBottom: "30px",
            }}
          >
            <h2
              style={{
                fontSize: "25px",
                marginBottom: "8px",
              }}
            >
              📚 Share a Lecture Summary
            </h2>

            <p
              style={{
                color: "#94A3B8",
                marginBottom: "30px",
              }}
            >
              Choose a classroom and a completed
              lecture summary to share with your
              students.
            </p>

            {/* CLASSROOM */}

            <div
              style={{
                marginBottom: "25px",
              }}
            >
              <label
                style={{
                  display: "block",
                  color: "#CBD5E1",
                  fontWeight: "600",
                  marginBottom: "10px",
                }}
              >
                🏫 Select Classroom
              </label>

              <select
                value={selectedClassroom}
                onChange={(e) => {
                  setSelectedClassroom(
                    e.target.value
                  );
                  setSelectedVideo("");
                  setError("");
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #475569",
                  background: "#0F172A",
                  color: "white",
                  fontSize: "16px",
                }}
              >
                <option value="">
                  Select a classroom
                </option>

                {classrooms.map((classroom) => (
                  <option
                    key={classroom.id}
                    value={classroom.id}
                  >
                    {classroom.name} —{" "}
                    {classroom.code}
                  </option>
                ))}
              </select>
            </div>

            {/* CLASSROOM INFO */}

            {selectedClassroomData && (
              <div
                style={{
                  background: "#273449",
                  borderRadius: "12px",
                  padding: "18px",
                  marginBottom: "25px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#94A3B8",
                        fontSize: "13px",
                      }}
                    >
                      Classroom
                    </div>

                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        marginTop: "5px",
                      }}
                    >
                      🏫{" "}
                      {selectedClassroomData.name}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: "#94A3B8",
                        fontSize: "13px",
                      }}
                    >
                      Classroom Code
                    </div>

                    <div
                      style={{
                        color: "#A78BFA",
                        fontSize: "18px",
                        fontWeight: "700",
                        letterSpacing: "2px",
                        marginTop: "5px",
                      }}
                    >
                      {selectedClassroomData.code}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: "#94A3B8",
                        fontSize: "13px",
                      }}
                    >
                      Students
                    </div>

                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        marginTop: "5px",
                      }}
                    >
                      👥{" "}
                      {selectedClassroomData.student_count ??
                        0}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LECTURE */}

            <div
              style={{
                marginBottom: "25px",
              }}
            >
              <label
                style={{
                  display: "block",
                  color: "#CBD5E1",
                  fontWeight: "600",
                  marginBottom: "10px",
                }}
              >
                🎥 Select Lecture
              </label>

              <select
                value={selectedVideo}
                onChange={(e) => {
                  setSelectedVideo(
                    e.target.value
                  );
                  setError("");
                }}
                disabled={!selectedClassroom}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid #475569",
                  background:
                    !selectedClassroom
                      ? "#111827"
                      : "#0F172A",
                  color: "white",
                  fontSize: "16px",
                  cursor: selectedClassroom
                    ? "pointer"
                    : "not-allowed",
                }}
              >
                <option value="">
                  {!selectedClassroom
                    ? "Select a classroom first"
                    : classroomVideos.length === 0
                    ? "No lectures uploaded to this classroom"
                    : "Select a lecture"}
                </option>

                {classroomVideos.map((video) => (
                  <option
                    key={video.id}
                    value={video.id}
                  >
                    {video.original_filename}
                  </option>
                ))}
              </select>
            </div>

            {/* SUMMARY PREVIEW */}

            {selectedVideoData && (
              <div
                style={{
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: "14px",
                  padding: "22px",
                  marginBottom: "25px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    marginBottom: "15px",
                    gap: "15px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "20px",
                    }}
                  >
                    🤖 AI Summary
                  </h3>

                  <span
                    style={{
                      background:
                        selectedVideoData.status ===
                        "Completed"
                          ? "#064E3B"
                          : "#78350F",
                      color:
                        selectedVideoData.status ===
                        "Completed"
                          ? "#6EE7B7"
                          : "#FCD34D",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {selectedVideoData.status}
                  </span>
                </div>

                {selectedVideoData.summary ? (
                  <div
                    style={{
                      color: "#CBD5E1",
                      lineHeight: "1.7",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedVideoData.summary}
                  </div>
                ) : (
                  <p
                    style={{
                      color: "#94A3B8",
                      margin: 0,
                    }}
                  >
                    AI summary is not available
                    for this lecture yet.
                  </p>
                )}
              </div>
            )}

            {/* SHARE BUTTON */}

            <button
              onClick={handleShare}
              disabled={
                sharing ||
                !selectedClassroom ||
                !selectedVideo
              }
              style={{
                width: "100%",
                padding: "15px",
                border: "none",
                borderRadius: "10px",
                background:
                  sharing ||
                  !selectedClassroom ||
                  !selectedVideo
                    ? "#475569"
                    : "#EC4899",
                color: "white",
                fontSize: "17px",
                fontWeight: "700",
                cursor:
                  sharing ||
                  !selectedClassroom ||
                  !selectedVideo
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {sharing
                ? "Sharing..."
                : "📢 Share with Classroom"}
            </button>
          </div>

          {/* HOW IT WORKS */}

          <div
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "18px",
              padding: "30px",
            }}
          >
            <h2
              style={{
                fontSize: "23px",
                marginBottom: "20px",
              }}
            >
              💡 How Sharing Works
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              <div
                style={{
                  background: "#273449",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    marginBottom: "10px",
                  }}
                >
                  1️⃣
                </div>

                <h3>Select Classroom</h3>

                <p
                  style={{
                    color: "#94A3B8",
                    lineHeight: "1.6",
                  }}
                >
                  Choose the classroom whose
                  students should receive the
                  lecture summary.
                </p>
              </div>

              <div
                style={{
                  background: "#273449",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    marginBottom: "10px",
                  }}
                >
                  2️⃣
                </div>

                <h3>Select Lecture</h3>

                <p
                  style={{
                    color: "#94A3B8",
                    lineHeight: "1.6",
                  }}
                >
                  Select a lecture that has already
                  been processed and has an AI
                  summary.
                </p>
              </div>

              <div
                style={{
                  background: "#273449",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    marginBottom: "10px",
                  }}
                >
                  3️⃣
                </div>

                <h3>Share</h3>

                <p
                  style={{
                    color: "#94A3B8",
                    lineHeight: "1.6",
                  }}
                >
                  Share the summary with everyone
                  enrolled in the selected classroom.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
  }}
  