"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Classroom {
  id: number;
  name: string;
  code: string;
  student_count?: number;
}

interface Student {
  id: number;
  username: string;
  email: string;
}

interface StudentWithClassroom extends Student {
  classroomId: number;
  classroomName: string;
  classroomCode: string;
}

export default function StudentEngagementPage() {
  const [students, setStudents] = useState<StudentWithClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, user } = useAuth();

useEffect(() => {
  if (!token || !user) {
    return;
  }

  const loadStudentEngagement = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/classrooms/my-classrooms",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const classrooms: Classroom[] = response.data;

      const allStudents: StudentWithClassroom[] = [];

      for (const classroom of classrooms) {
        const studentResponse = await api.get(
          `/classrooms/${classroom.id}/students`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const classroomStudents: Student[] =
          studentResponse.data;

        classroomStudents.forEach((student) => {
          allStudents.push({
            id: student.id,
            username: student.username,
            email: student.email,
            classroomId: classroom.id,
            classroomName: classroom.name,
            classroomCode: classroom.code,
          });
        });
      }

      setStudents(allStudents);
    } catch (err) {
      console.error(
        "Failed to load student engagement:",
        err
      );

      setError(
        "Failed to load student and classroom information."
      );
    } finally {
      setLoading(false);
    }
  };

  loadStudentEngagement();
}, [token, user]);
  return (
    <div
      style={{
        padding: "32px",
        color: "white",
      }}
    >
      <h1
        style={{
          fontSize: "36px",
          fontWeight: "700",
          marginBottom: "8px",
        }}
      >
        👥 Student Engagement
      </h1>

      <p
        style={{
          color: "#94A3B8",
          fontSize: "17px",
          marginBottom: "30px",
        }}
      >
        View students and the classrooms they belong to.
      </p>

      {loading && (
        <div
          style={{
            background: "#1E293B",
            padding: "25px",
            borderRadius: "14px",
            color: "#CBD5E1",
          }}
        >
          Loading student information...
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#451A1A",
            border: "1px solid #991B1B",
            padding: "18px",
            borderRadius: "12px",
            color: "#FCA5A5",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div
            style={{
              background: "#1E293B",
              borderRadius: "14px",
              padding: "22px",
              marginBottom: "25px",
              border: "1px solid #334155",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                color: "#94A3B8",
                marginBottom: "6px",
              }}
            >
              Total Students
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#38BDF8",
              }}
            >
              {students.length}
            </div>
          </div>

          {students.length === 0 ? (
            <div
              style={{
                background: "#1E293B",
                borderRadius: "14px",
                padding: "50px",
                textAlign: "center",
                border: "1px solid #334155",
              }}
            >
              <div
                style={{
                  fontSize: "45px",
                  marginBottom: "15px",
                }}
              >
                👨‍🎓
              </div>

              <h2
                style={{
                  fontSize: "22px",
                  marginBottom: "8px",
                }}
              >
                No students yet
              </h2>

              <p
                style={{
                  color: "#94A3B8",
                }}
              >
                Students who join your classrooms will
                appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {students.map((student, index) => (
                <div
                  key={`${student.id}-${student.classroomId}-${index}`}
                  style={{
                    background: "#1E293B",
                    border: "1px solid #334155",
                    borderRadius: "16px",
                    padding: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: "22px",
                    }}
                  >
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "50%",
                        background: "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "21px",
                        fontWeight: "700",
                      }}
                    >
                      {student.username
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h2
                        style={{
                          fontSize: "20px",
                          fontWeight: "600",
                          margin: 0,
                        }}
                      >
                        {student.username}
                      </h2>

                      <p
                        style={{
                          color: "#94A3B8",
                          margin: "5px 0 0",
                          fontSize: "14px",
                        }}
                      >
                        Student ID: {student.id}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid #334155",
                      paddingTop: "18px",
                    }}
                  >
                    <p
                      style={{
                        color: "#94A3B8",
                        marginBottom: "6px",
                      }}
                    >
                      Email
                    </p>

                    <p
                      style={{
                        marginBottom: "18px",
                        wordBreak: "break-word",
                      }}
                    >
                      {student.email}
                    </p>

                    <p
                      style={{
                        color: "#94A3B8",
                        marginBottom: "6px",
                      }}
                    >
                      Classroom
                    </p>

                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        marginBottom: "8px",
                      }}
                    >
                      🏫 {student.classroomName}
                    </p>

                    <p
                      style={{
                        color: "#CBD5E1",
                        margin: 0,
                      }}
                    >
                      Classroom ID: {student.classroomId}
                    </p>

                    <p
                      style={{
                        color: "#CBD5E1",
                        marginTop: "5px",
                      }}
                    >
                      Classroom Code: {student.classroomCode}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}