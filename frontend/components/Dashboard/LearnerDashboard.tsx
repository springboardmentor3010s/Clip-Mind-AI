"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  joinClassroom,
  getMyJoinedClassrooms,
  getClassroomVideos,
  getClassroomSharedSummaries,
} from "@/services/classroom";

interface Classroom {
  id: number;
  name: string;
  code: string;
}

interface Video {
  id: number;
  filename: string;
  original_filename: string;
  status: string;
  classroom_id: number;
  transcript_available?: boolean;
  summary_available?: boolean;
}

interface Summary {
  share_id: number;
  video_id: number;
  classroom_id: number;
  filename: string;
  original_filename: string;
  status: string;
  summary: string;
}

export default function LearnerDashboard() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // LOAD LEARNER DATA
  // =========================================================

  const loadLearnerData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const classroomData =
        await getMyJoinedClassrooms();

      console.log(
        "MY JOINED CLASSROOMS:",
        classroomData
      );

      if (!Array.isArray(classroomData)) {
        setClassrooms([]);
        setVideos([]);
        setSummaries([]);
        return;
      }

      setClassrooms(classroomData);

      // No classrooms yet
      if (classroomData.length === 0) {
        setVideos([]);
        setSummaries([]);
        return;
      }

      // -------------------------------------------------------
      // LOAD VIDEOS + SUMMARIES FROM ALL JOINED CLASSROOMS
      // -------------------------------------------------------

      const videoResults = await Promise.all(
        classroomData.map(async (classroom: Classroom) => {
          try {
            const data = await getClassroomVideos(
              classroom.id
            );

            return Array.isArray(data) ? data : [];
          } catch (error) {
            console.error(
              `Failed to load videos for classroom ${classroom.id}:`,
              error
            );

            return [];
          }
        })
      );

      const summaryResults = await Promise.all(
        classroomData.map(async (classroom: Classroom) => {
          try {
            const data =
              await getClassroomSharedSummaries(
                classroom.id
              );

            return Array.isArray(data) ? data : [];
          } catch (error) {
            console.error(
              `Failed to load summaries for classroom ${classroom.id}:`,
              error
            );

            return [];
          }
        })
      );

      setVideos(videoResults.flat());
      setSummaries(summaryResults.flat());
    } catch (error: any) {
      console.error(
        "Error loading learner dashboard:",
        error
      );

      setErrorMessage(
        error?.response?.data?.detail ||
          "Unable to load classroom data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearnerData();
  }, []);

  // =========================================================
  // JOIN CLASSROOM
  // =========================================================

  const handleJoinClassroom = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    const classroomCode = code.trim().toUpperCase();

    if (!classroomCode) {
      setErrorMessage(
        "Please enter a classroom code."
      );
      return;
    }

    try {
      setJoining(true);

      const response =
        await joinClassroom(classroomCode);

      console.log(
        "JOIN CLASSROOM RESPONSE:",
        response
      );

      setSuccessMessage(
        response?.message ||
          "Successfully joined the classroom!"
      );

      setCode("");

      // Reload classrooms, videos and summaries
      await loadLearnerData();
    } catch (error: any) {
      console.error(
        "Join classroom error:",
        error
      );

      setErrorMessage(
        error?.response?.data?.detail ||
          "Unable to join classroom."
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          marginBottom: "35px",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Learner Dashboard 🎓
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          Learn smarter with AI-powered insights
          from your lectures.
        </p>
      </div>

      {/* =====================================================
          JOIN CLASSROOM
      ===================================================== */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
          marginBottom: "30px",
        }}
      >
        <h2
          style={{
            fontSize: "25px",
            marginBottom: "8px",
          }}
        >
          🏫 Join a Classroom
        </h2>

        <p
          style={{
            color: "#94A3B8",
            marginBottom: "20px",
          }}
        >
          Enter the classroom code provided by
          your educator.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(
                e.target.value.toUpperCase()
              );
              setSuccessMessage("");
              setErrorMessage("");
            }}
            placeholder="Enter classroom code"
            maxLength={10}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #475569",
              background: "#273449",
              color: "white",
              fontSize: "16px",
              letterSpacing: "2px",
              outline: "none",
            }}
          />

          <button
            onClick={handleJoinClassroom}
            disabled={joining}
            style={{
              padding: "14px 25px",
              border: "none",
              borderRadius: "10px",
              background: joining
                ? "#475569"
                : "#6366F1",
              color: "white",
              fontWeight: "600",
              fontSize: "16px",
              cursor: joining
                ? "not-allowed"
                : "pointer",
            }}
          >
            {joining
              ? "Joining..."
              : "Join Classroom"}
          </button>
        </div>

        {successMessage && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              borderRadius: "10px",
              background: "#064E3B",
              border: "1px solid #10B981",
              color: "#6EE7B7",
            }}
          >
            ✓ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              borderRadius: "10px",
              background: "#451A1A",
              border: "1px solid #7F1D1D",
              color: "#FCA5A5",
            }}
          >
            {errorMessage}
          </div>
        )}
      </div>

      {/* =====================================================
          MY CLASSROOMS
      ===================================================== */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "25px",
                marginBottom: "6px",
              }}
            >
              📚 My Classrooms
            </h2>

            <p
              style={{
                color: "#94A3B8",
                margin: 0,
              }}
            >
              Classrooms you have joined.
            </p>
          </div>

          <div
            style={{
              background: "#334155",
              padding: "10px 18px",
              borderRadius: "10px",
              color: "#A78BFA",
              fontWeight: "600",
            }}
          >
            {classrooms.length}{" "}
            {classrooms.length === 1
              ? "Classroom"
              : "Classrooms"}
          </div>
        </div>

        {loading ? (
          <p
            style={{
              color: "#94A3B8",
            }}
          >
            Loading classrooms...
          </p>
        ) : classrooms.length === 0 ? (
          <div
            style={{
              background: "#273449",
              borderRadius: "12px",
              padding: "30px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "40px",
                marginBottom: "10px",
              }}
            >
              🏫
            </div>

            <h3
              style={{
                fontSize: "20px",
                marginBottom: "8px",
              }}
            >
              No classrooms yet
            </h3>

            <p
              style={{
                color: "#94A3B8",
                margin: 0,
              }}
            >
              Enter a classroom code above to
              join your first classroom.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "15px",
            }}
          >
            {classrooms.map((classroom) => (
              <div
                key={classroom.id}
                style={{
                  background: "#273449",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <h3
                  style={{
                    fontSize: "20px",
                    marginBottom: "8px",
                  }}
                >
                  🏫 {classroom.name}
                </h3>

                <p
                  style={{
                    color: "#94A3B8",
                    marginBottom: "8px",
                  }}
                >
                  Classroom Code
                </p>

                <div
                  style={{
                    background: "#334155",
                    padding: "10px",
                    borderRadius: "8px",
                    color: "#A78BFA",
                    fontWeight: "700",
                    letterSpacing: "2px",
                    marginBottom: "15px",
                  }}
                >
                  {classroom.code}
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/learner/classrooms/${classroom.id}`
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "none",
                    borderRadius: "9px",
                    background: "#2563EB",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Open Classroom
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          CLASSROOM VIDEOS
      ===================================================== */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
          marginBottom: "30px",
        }}
      >
        <h2
          style={{
            fontSize: "25px",
            marginBottom: "6px",
          }}
        >
          🎥 Lecture Videos
        </h2>

        <p
          style={{
            color: "#94A3B8",
            marginBottom: "20px",
          }}
        >
          Videos available in your classrooms.
        </p>

        {loading ? (
          <p
            style={{
              color: "#94A3B8",
            }}
          >
            Loading videos...
          </p>
        ) : videos.length === 0 ? (
          <div
            style={{
              background: "#273449",
              borderRadius: "12px",
              padding: "30px",
              color: "#94A3B8",
            }}
          >
            No lecture videos are available yet.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {videos.map((video) => (
              <div
                key={`${video.classroom_id}-${video.id}`}
                style={{
                  background: "#273449",
                  borderRadius: "12px",
                  padding: "18px",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      marginBottom: "5px",
                    }}
                  >
                    🎬{" "}
                    {video.original_filename}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color:
                        video.status ===
                        "Completed"
                          ? "#22C55E"
                          : "#F59E0B",
                    }}
                  >
                    Status: {video.status}
                  </p>
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/learner/classrooms/${video.classroom_id}`
                    )
                  }
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2563EB",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          SHARED AI SUMMARIES
      ===================================================== */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "25px",
                marginBottom: "6px",
              }}
            >
              🤖 Shared AI Summaries
            </h2>

            <p
              style={{
                color: "#94A3B8",
                margin: 0,
              }}
            >
              AI summaries shared by your educators.
            </p>
          </div>

          <div
            style={{
              background: "#334155",
              padding: "10px 18px",
              borderRadius: "10px",
              color: "#38BDF8",
              fontWeight: "600",
            }}
          >
            {summaries.length}{" "}
            {summaries.length === 1
              ? "Summary"
              : "Summaries"}
          </div>
        </div>

        {loading ? (
          <p
            style={{
              color: "#94A3B8",
            }}
          >
            Loading summaries...
          </p>
        ) : summaries.length === 0 ? (
          <div
            style={{
              background: "#273449",
              borderRadius: "12px",
              padding: "30px",
              color: "#94A3B8",
            }}
          >
            No summaries have been shared with
            your classrooms yet.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {summaries.map((item) => (
              <div
                key={item.share_id}
                style={{
                  background: "#273449",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <h3
                  style={{
                    color: "#38BDF8",
                    fontSize: "19px",
                    marginBottom: "8px",
                  }}
                >
                  🎥 {item.original_filename}
                </h3>

                <p
                  style={{
                    color: "#22C55E",
                    fontWeight: "600",
                    marginBottom: "15px",
                  }}
                >
                  ✓ Shared by educator
                </p>

                <div
                  style={{
                    background: "#0F172A",
                    borderRadius: "10px",
                    padding: "18px",
                    color: "#E2E8F0",
                    lineHeight: "1.7",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {item.summary}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          OTHER LEARNING TOOLS
      ===================================================== */}

      <h2
        style={{
          fontSize: "25px",
          marginBottom: "20px",
        }}
      >
        Learning Tools
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        {/* Transcripts */}
        <div
          style={{
            background: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "18px",
            padding: "25px",
          }}
        >
          <div
            style={{
              fontSize: "38px",
              marginBottom: "15px",
            }}
          >
            📝
          </div>

          <h3
            style={{
              fontSize: "21px",
              marginBottom: "10px",
            }}
          >
            Lecture Transcripts
          </h3>

          <p
            style={{
              color: "#94A3B8",
              lineHeight: "1.6",
              marginBottom: "20px",
            }}
          >
            Read searchable transcripts generated
            from lecture videos.
          </p>

          <button
            onClick={() =>
              router.push("/dashboard/transcript")
            }
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "10px",
              background: "#2563EB",
              color: "white",
              fontWeight: "600",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            View Transcripts
          </button>
        </div>

        {/* Key Moments */}
        <div
          style={{
            background: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "18px",
            padding: "25px",
          }}
        >
          <div
            style={{
              fontSize: "38px",
              marginBottom: "15px",
            }}
          >
            ⭐
          </div>

          <h3
            style={{
              fontSize: "21px",
              marginBottom: "10px",
            }}
          >
            Key Moments
          </h3>

          <p
            style={{
              color: "#94A3B8",
              lineHeight: "1.6",
              marginBottom: "20px",
            }}
          >
            Quickly find important moments from
            your lectures.
          </p>

          <button
            onClick={() =>
              router.push(
                "/dashboard/key-moments"
              )
            }
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "10px",
              background: "#EC4899",
              color: "white",
              fontWeight: "600",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            View Key Moments
          </button>
        </div>

        {/* Bookmarks */}
        <div
          style={{
            background: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "18px",
            padding: "25px",
          }}
        >
          <div
            style={{
              fontSize: "38px",
              marginBottom: "15px",
            }}
          >
            🔖
          </div>

          <h3
            style={{
              fontSize: "21px",
              marginBottom: "10px",
            }}
          >
            Bookmarks
          </h3>

          <p
            style={{
              color: "#94A3B8",
              lineHeight: "1.6",
              marginBottom: "20px",
            }}
          >
            Access your saved lecture moments and
            important content.
          </p>

          <button
            onClick={() =>
              router.push(
                "/dashboard/bookmarks"
              )
            }
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "10px",
              background: "#F59E0B",
              color: "white",
              fontWeight: "600",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            View Bookmarks
          </button>
        </div>
      </div>
    </div>
  );
}