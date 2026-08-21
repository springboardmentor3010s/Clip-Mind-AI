"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  getClassroomStudents,
  getClassroomSharedSummaries,
} from "@/services/classroom";

interface Student {
  id: number;
  username?: string;
  name?: string;
  email: string;
}

interface SharedSummary {
  share_id: number;
  video_id: number;
  classroom_id: number;
  filename: string;
  original_filename: string;
  status: string;
  summary?: string;
}

export default function ClassroomPage() {
  const params = useParams();

  const classroomId = Number(params.id);

  const [students, setStudents] = useState<Student[]>([]);
  const [summaries, setSummaries] = useState<SharedSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================================================
  // LOAD STUDENTS
  // =========================================================

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getClassroomStudents(classroomId);

        console.log("CLASSROOM STUDENTS:", data);

        if (Array.isArray(data)) {
          setStudents(data);
        } else if (Array.isArray(data?.students)) {
          setStudents(data.students);
        } else {
          setStudents([]);
        }
      } catch (err: any) {
        console.error(
          "Error loading classroom students:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load classroom students."
        );
      } finally {
        setLoading(false);
      }
    };

    if (classroomId) {
      loadStudents();
    }
  }, [classroomId]);

  // =========================================================
  // LOAD SHARED SUMMARIES
  // =========================================================

  useEffect(() => {
    const loadSharedSummaries = async () => {
      try {
        setSummaryLoading(true);

        const data =
          await getClassroomSharedSummaries(classroomId);

        console.log(
          "CLASSROOM SHARED SUMMARIES:",
          data
        );

        if (Array.isArray(data)) {
          setSummaries(data);
        } else {
          setSummaries([]);
        }
      } catch (err: any) {
        console.error(
          "Error loading classroom shared summaries:",
          err
        );

        setSummaries([]);
      } finally {
        setSummaryLoading(false);
      }
    };

    if (classroomId) {
      loadSharedSummaries();
    }
  }, [classroomId]);

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100%",
        color: "white",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

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

      {/* =====================================================
          CLASSROOM OVERVIEW
      ===================================================== */}

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
          Manage your classroom, students and lecture
          content here.
        </p>

        {/* Overview Cards */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          {/* STUDENTS */}

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
              👨‍🎓
            </div>

            <h3
              style={{
                fontSize: "20px",
                marginBottom: "5px",
              }}
            >
              Students
            </h3>

            <p
              style={{
                color: "#94A3B8",
                margin: 0,
              }}
            >
              {loading
                ? "Loading..."
                : `${students.length} student${
                    students.length !== 1
                      ? "s"
                      : ""
                  }`}
            </p>
          </div>

          {/* LECTURES */}

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
              Manage lecture videos
            </p>
          </div>

          {/* ANALYTICS */}

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
              📊
            </div>

            <h3
              style={{
                fontSize: "20px",
                marginBottom: "5px",
              }}
            >
              Analytics
            </h3>

            <p
              style={{
                color: "#94A3B8",
                margin: 0,
              }}
            >
              View classroom activity
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          STUDENTS SECTION
      ===================================================== */}

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
              👨‍🎓 Students
            </h2>

            <p
              style={{
                color: "#94A3B8",
                margin: 0,
              }}
            >
              Students who have joined this
              classroom
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
            {students.length} Students
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#94A3B8",
            }}
          >
            Loading students...
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div
            style={{
              background: "#451A1A",
              border: "1px solid #7F1D1D",
              borderRadius: "10px",
              padding: "16px",
              color: "#FCA5A5",
            }}
          >
            {error}
          </div>
        )}

        {/* NO STUDENTS */}

        {!loading &&
          !error &&
          students.length === 0 && (
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
                👨‍🎓
              </div>

              <h3
                style={{
                  fontSize: "20px",
                  marginBottom: "8px",
                }}
              >
                No students yet
              </h3>

              <p
                style={{
                  color: "#94A3B8",
                  margin: 0,
                }}
              >
                Students who join this classroom
                will appear here.
              </p>
            </div>
          )}

        {/* STUDENTS LIST */}

        {!loading &&
          !error &&
          students.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {students.map((student) => (
                <div
                  key={student.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    background: "#273449",
                    borderRadius: "12px",
                    padding: "18px 20px",
                  }}
                >
                  {/* Avatar */}

                  <div
                    style={{
                      width: "45px",
                      height: "45px",
                      borderRadius: "50%",
                      background: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "18px",
                    }}
                  >
                    {(
                      student.username ||
                      student.name ||
                      student.email ||
                      "S"
                    )[0].toUpperCase()}
                  </div>

                  {/* Student Info */}

                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "17px",
                        fontWeight: "600",
                      }}
                    >
                      {student.username ||
                        student.name ||
                        "Student"}
                    </h3>

                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#94A3B8",
                      }}
                    >
                      {student.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* =====================================================
          SHARED LECTURE SUMMARIES
      ===================================================== */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "30px",
          marginTop: "25px",
        }}
      >
        {/* Header */}

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
              AI-generated summaries shared with
              this classroom.
            </p>
          </div>

          <div
            style={{
              background: "#334155",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: "600",
              color: "#38BDF8",
            }}
          >
            {summaries.length}{" "}
            {summaries.length === 1
              ? "Summary"
              : "Summaries"}
          </div>
        </div>

        {/* Loading */}

        {summaryLoading && (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#94A3B8",
            }}
          >
            Loading shared summaries...
          </div>
        )}

        {/* No summaries */}

        {!summaryLoading &&
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
                📚
              </div>

              <h3
                style={{
                  fontSize: "20px",
                  marginBottom: "8px",
                }}
              >
                No shared summaries yet
              </h3>

              <p
                style={{
                  color: "#94A3B8",
                  margin: 0,
                }}
              >
                Summaries shared by the educator
                will appear here.
              </p>
            </div>
          )}

        {/* Summary List */}

        {!summaryLoading &&
          summaries.length > 0 && (
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
                    padding: "22px",
                  }}
                >
                  {/* Video Name */}

                  <h3
                    style={{
                      color: "#38BDF8",
                      fontSize: "20px",
                      marginBottom: "10px",
                    }}
                  >
                    🎥{" "}
                    {item.original_filename ||
                      item.filename}
                  </h3>

                  {/* Status */}

                  <p
                    style={{
                      color:
                        item.status ===
                        "Completed"
                          ? "#22C55E"
                          : "#F59E0B",
                      fontWeight: "600",
                      marginBottom: "15px",
                    }}
                  >
                    Status: {item.status}
                  </p>

                  {/* Summary */}

                  {item.summary ? (
                    <>
                      <h4
                        style={{
                          fontSize: "17px",
                          marginBottom: "10px",
                        }}
                      >
                        🤖 AI Generated Summary
                      </h4>

                      <div
                        style={{
                          background: "#0F172A",
                          borderRadius: "10px",
                          padding: "18px",
                          lineHeight: "1.7",
                          color: "#E2E8F0",
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {item.summary}
                      </div>
                    </>
                  ) : (
                    <p
                      style={{
                        color: "#94A3B8",
                      }}
                    >
                      No summary available.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}