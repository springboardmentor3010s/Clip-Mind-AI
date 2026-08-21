"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createClassroom,
  getMyClassrooms,
} from "@/services/classroom";

export default function EducatorDashboard() {
  const router = useRouter();

  // Classroom name entered in the input
  const [classroomName, setClassroomName] = useState("");

  // List of classrooms created by educator
  const [classrooms, setClassrooms] = useState<any[]>([]);

  // Loading classrooms
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);

  const [classroomError, setClassroomError] = useState("");

  // Newly generated classroom code
  const [classroomCode, setClassroomCode] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(false);

  // Load educator's classrooms
  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        setLoadingClassrooms(true);
        setClassroomError("");

        const data = await getMyClassrooms();

        console.log("MY CLASSROOMS:", data);

        if (Array.isArray(data)) {
          setClassrooms(data);
        } else if (Array.isArray(data.classrooms)) {
          setClassrooms(data.classrooms);
        } else {
          setClassrooms([]);
        }
      } catch (error: any) {
        console.error(
          "Error loading classrooms:",
          error
        );

        setClassroomError(
          error?.response?.data?.detail ||
            "Unable to load classrooms."
        );
      } finally {
        setLoadingClassrooms(false);
      }
    };

    loadClassrooms();
  }, []);

  // Create classroom
  const handleCreateClassroom = async () => {
    setSuccessMessage("");
    setErrorMessage("");
    setClassroomCode("");

    if (!classroomName.trim()) {
      setErrorMessage(
        "Please enter a classroom name."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await createClassroom(
        classroomName.trim()
      );

      console.log(
        "Classroom created:",
        data
      );

      const code =
        data?.classroom_code ||
        data?.code ||
        data?.classroom?.code ||
        "";

      setClassroomCode(code);

      setSuccessMessage(
        "Classroom created successfully!"
      );

      setClassroomName("");

      // Refresh classroom list
      const updated =
        await getMyClassrooms();

      if (Array.isArray(updated)) {
        setClassrooms(updated);
      } else if (
        Array.isArray(updated.classrooms)
      ) {
        setClassrooms(updated.classrooms);
      }
    } catch (error: any) {
      console.error(
        "Create classroom error:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create classroom.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "45px" }}>
        <h1
          style={{
            fontSize: "40px",
            fontWeight: "700",
            color: "white",
            marginBottom: "12px",
          }}
        >
          Educator Dashboard
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          Manage your classrooms, lectures and learning content from one place.
        </p>
      </div>

      {/* Quick Actions */}
      <h2
        style={{
          color: "white",
          fontSize: "28px",
          marginBottom: "25px",
        }}
      >
        Quick Actions
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "25px",
        }}
      >
        {/* CREATE CLASSROOM */}
        <div
          style={{
            background: "#1E293B",
            padding: "30px",
            borderRadius: "18px",
            border: "1px solid #334155",
            minHeight: "340px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "20px" }}>
            🏫
          </div>

          <h2
            style={{
              color: "white",
              fontSize: "24px",
              marginBottom: "15px",
            }}
          >
            Create Classroom
          </h2>

          <p
            style={{
              color: "#CBD5E1",
              fontSize: "16px",
              lineHeight: "1.7",
              marginBottom: "20px",
            }}
          >
            Create a classroom and invite your students
            using a classroom code.
          </p>

          <input
            type="text"
            value={classroomName}
            onChange={(e) => setClassroomName(e.target.value)}
            placeholder="Enter classroom name"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #475569",
              background: "#172033",
              color: "white",
              fontSize: "15px",
              outline: "none",
              marginBottom: "14px",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={handleCreateClassroom}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: loading
                ? "#64748B"
                : "#8B5CF6",
              color: "white",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Creating..."
              : "Create Classroom"}
          </button>

          {/* Success */}
          {successMessage && (
            <p
              style={{
                color: "#22C55E",
                marginTop: "15px",
                fontWeight: "600",
              }}
            >
              {successMessage}
            </p>
          )}

          {/* Error */}
          {errorMessage && (
            <p
              style={{
                color: "#F87171",
                marginTop: "15px",
                fontWeight: "600",
              }}
            >
              {errorMessage}
            </p>
          )}

          {/* Classroom Code */}
          {classroomCode && (
            <div
              style={{
                marginTop: "18px",
                padding: "15px",
                borderRadius: "10px",
                background: "#334155",
              }}
            >
              <div
                style={{
                  color: "#CBD5E1",
                  fontSize: "14px",
                  marginBottom: "5px",
                }}
              >
                Classroom Code
              </div>

              <div
                style={{
                  color: "#A78BFA",
                  fontSize: "26px",
                  fontWeight: "800",
                  letterSpacing: "3px",
                }}
              >
                {classroomCode}
              </div>
            </div>
          )}
        </div>

        {/* UPLOAD LECTURE */}
        <div
          style={{
            background: "#1E293B",
            padding: "30px",
            borderRadius: "18px",
            border: "1px solid #334155",
            minHeight: "340px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "20px" }}>
            📤
          </div>

          <h2 style={{ color: "white", fontSize: "24px" }}>
            Upload Lecture
          </h2>

          <p
            style={{
              color: "#CBD5E1",
              lineHeight: "1.7",
              marginTop: "15px",
            }}
          >
            Upload lecture videos for your students
            and generate AI insights.
          </p>

          <button
            onClick={() =>
              router.push("/dashboard/upload")
            }
            style={{
              marginTop: "auto",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#0EA5E9",
              color: "white",
              fontWeight: "700",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Upload Lecture
          </button>
        </div>

        {/* TRANSCRIPTS */}
        <div
          style={{
            background: "#1E293B",
            padding: "30px",
            borderRadius: "18px",
            border: "1px solid #334155",
            minHeight: "340px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "20px" }}>
            📝
          </div>

          <h2 style={{ color: "white", fontSize: "24px" }}>
            Review Transcripts
          </h2>

          <p
            style={{
              color: "#CBD5E1",
              lineHeight: "1.7",
              marginTop: "15px",
            }}
          >
            Review and edit transcripts generated
            from your lectures.
          </p>

          <button
            onClick={() =>
              router.push("/dashboard/videos")
            }
            style={{
              marginTop: "auto",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#2563EB",
              color: "white",
              fontWeight: "700",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            View Transcripts
          </button>
        </div>

        {/* SHARE */}
        <div
          style={{
            background: "#1E293B",
            padding: "30px",
            borderRadius: "18px",
            border: "1px solid #334155",
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: "42px", marginBottom: "20px" }}>
            📢
          </div>

          <h2 style={{ color: "white", fontSize: "24px" }}>
            Share with Students
          </h2>

          <p
            style={{
              color: "#CBD5E1",
              lineHeight: "1.7",
              marginTop: "15px",
            }}
          >
            Share summaries with your students in classroom.
          </p>

          <button
            onClick={() =>
              router.push("/dashboard/sharing")
            }
            style={{
              marginTop: "auto",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#EC4899",
              color: "white",
              fontWeight: "700",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Manage Sharing
          </button>
        </div>

        {/* ============================= */}
      {/* MY CLASSROOMS */}
      {/* ============================= */}

      <div style={{ marginTop: "50px" }}>
        <h2
          style={{
            color: "white",
            fontSize: "28px",
            fontWeight: "700",
            marginBottom: "25px",
          }}
        >
          🏫 My Classrooms
        </h2>

        {loadingClassrooms ? (
          <p
            style={{
              color: "#94A3B8",
              fontSize: "16px",
            }}
          >
            Loading classrooms...
          </p>
        ) : classroomError ? (
          <p
            style={{
              color: "#F87171",
              fontSize: "16px",
            }}
          >
            {classroomError}
          </p>
        ) : classrooms.length === 0 ? (
          <div
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "30px",
              color: "#94A3B8",
            }}
          >
            You haven't created any classrooms yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {classrooms.map((classroom) => (
              <div
                key={classroom.id}
                style={{
                  background: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "16px",
                  padding: "25px",
                }}
              >
                <h3
                  style={{
                    color: "white",
                    fontSize: "21px",
                    fontWeight: "700",
                    marginBottom: "12px",
                  }}
                >
                  🏫{" "}
                  {classroom.name ||
                    classroom.classroom_name ||
                    "Unnamed Classroom"}
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
                    borderRadius: "10px",
                    padding: "12px",
                    color: "#A78BFA",
                    fontSize: "20px",
                    fontWeight: "800",
                    letterSpacing: "3px",
                    marginBottom: "20px",
                  }}
                >
                  {classroom.code ||
                    classroom.classroom_code ||
                    "N/A"}
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/classroom/${classroom.id}`
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "none",
                    borderRadius: "9px",
                    background: "#2563EB",
                    color: "white",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  View Classroom
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}