"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getClassroomStudents } from "@/services/classroom";
import { getClassroomSharedSummaries } from "@/services/summaryShare";

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
  original_filename?: string;
  summary?: string;
}

export default function ClassroomPage() {
  const params = useParams();

  const classroomId = Number(params.id);

  const [students, setStudents] = useState<Student[]>([]);
  const [sharedSummaries, setSharedSummaries] = useState<
    SharedSummary[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [error, setError] = useState("");
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    if (!classroomId || Number.isNaN(classroomId)) {
      setLoading(false);
      setSummaryLoading(false);
      setError("Invalid classroom ID.");
      return;
    }

    const loadClassroomData = async () => {
      // =========================================
      // LOAD CLASSROOM STUDENTS
      // =========================================

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

        setStudents([]);
      } finally {
        setLoading(false);
      }

      // =========================================
      // LOAD SHARED SUMMARIES
      // =========================================

      try {
        setSummaryLoading(true);
        setSummaryError("");

        const data =
          await getClassroomSharedSummaries(classroomId);

        console.log("SHARED SUMMARIES:", data);

        if (Array.isArray(data)) {
          setSharedSummaries(data);
        } else if (Array.isArray(data?.summaries)) {
          setSharedSummaries(data.summaries);
        } else {
          setSharedSummaries([]);
        }
      } catch (err: any) {
        console.error(
          "Error loading shared summaries:",
          err
        );

        setSummaryError(
          err?.response?.data?.detail ||
            "Unable to load shared summaries."
        );

        setSharedSummaries([]);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadClassroomData();
  }, [classroomId]);

  return (
    <div
      style={{
        minHeight: "100%",
        color: "white",
      }}
    >
      {/* =========================================
          HEADER
      ========================================= */}

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
          Classroom
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "17px",
          }}
        >
          View students and shared learning content.
        </p>
      </div>

      {/* =========================================
          CLASSROOM ID
      ========================================= */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "14px",
          padding: "18px 22px",
          marginBottom: "30px",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#94A3B8",
          }}
        >
          Classroom ID
        </p>

        <p
          style={{
            margin: "5px 0 0",
            fontSize: "22px",
            fontWeight: "600",
          }}
        >
          {classroomId}
        </p>
      </div>

      {/* =========================================
          STUDENTS SECTION
      ========================================= */}

      <section
        style={{
          marginBottom: "40px",
        }}
      >
        <h2
          style={{
            fontSize: "26px",
            fontWeight: "600",
            marginBottom: "20px",
          }}
        >
          Classroom Students
        </h2>

        {loading ? (
          <div
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#94A3B8",
              }}
            >
              Loading students...
            </p>
          </div>
        ) : error ? (
          <div
            style={{
              background: "#451A1A",
              border: "1px solid #7F1D1D",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#FCA5A5",
              }}
            >
              {error}
            </p>
          </div>
        ) : students.length === 0 ? (
          <div
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#94A3B8",
              }}
            >
              No students found in this classroom.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "18px",
              padding: "10px 25px",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Email</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={tdStyle}>
                      {student.id}
                    </td>

                    <td style={tdStyle}>
                      {student.name || "—"}
                    </td>

                    <td style={tdStyle}>
                      {student.username || "—"}
                    </td>

                    <td style={tdStyle}>
                      {student.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =========================================
          SHARED SUMMARIES SECTION
      ========================================= */}

      <section
        style={{
          marginBottom: "40px",
        }}
      >
        <h2
          style={{
            fontSize: "26px",
            fontWeight: "600",
            marginBottom: "20px",
          }}
        >
          Shared Summaries
        </h2>

        {summaryLoading ? (
          <div
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#94A3B8",
              }}
            >
              Loading shared summaries...
            </p>
          </div>
        ) : summaryError ? (
          <div
            style={{
              background: "#451A1A",
              border: "1px solid #7F1D1D",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#FCA5A5",
              }}
            >
              {summaryError}
            </p>
          </div>
        ) : sharedSummaries.length === 0 ? (
          <div
            style={{
              background: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#94A3B8",
              }}
            >
              No summaries have been shared with this
              classroom yet.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {sharedSummaries.map((summary) => (
              <div
                key={summary.share_id}
                style={{
                  background: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "18px",
                  padding: "25px",
                }}
              >
                <div
                  style={{
                    fontSize: "34px",
                    marginBottom: "15px",
                  }}
                >
                  📝
                </div>

                <h3
                  style={{
                    fontSize: "20px",
                    marginBottom: "12px",
                  }}
                >
                  {summary.original_filename ||
                    summary.filename ||
                    "Shared Video"}
                </h3>

                <p
                  style={{
                    color: "#94A3B8",
                    marginBottom: "12px",
                  }}
                >
                  Video ID: {summary.video_id}
                </p>

                {summary.summary ? (
                  <div
                    style={{
                      color: "#CBD5E1",
                      lineHeight: "1.7",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {summary.summary}
                  </div>
                ) : (
                  <p
                    style={{
                      color: "#64748B",
                    }}
                  >
                    Summary is not available yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const thStyle = {
  textAlign: "left" as const,
  padding: "16px 12px",
  borderBottom: "1px solid #475569",
  color: "#CBD5E1",
  fontSize: "15px",
};

const tdStyle = {
  padding: "16px 12px",
  borderBottom: "1px solid #334155",
  color: "#E2E8F0",
  fontSize: "15px",
};




// "use client";

// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import { getClassroomStudents } from "@/services/classroom";
// import { getClassroomSharedSummaries } from "@/services/summaryShare";

// interface Student {
//   id: number;
//   username?: string;
//   name?: string;
//   email: string;
// }

// interface SharedSummary {
//   share_id: number;
//   video_id: number;
//   classroom_id: number;
//   filename: string;
//   original_filename?: string;
//   summary?: string;
// }
// export default function ClassroomPage() {
//   const params = useParams();

//   const classroomId = Number(params.id);

//   const [students, setStudents] = useState<Student[]>([]);
//   const [sharedSummaries, setSharedSummaries] = useState<
//     SharedSummary[]
//   >([]);

//   const [loading, setLoading] = useState(true);
//   const [summaryLoading, setSummaryLoading] = useState(true);

//   const [error, setError] = useState("");
//   const [summaryError, setSummaryError] = useState("");

//   useEffect(() => {
//     const loadClassroomData = async () => {
//       if (!classroomId) return;

//       // -----------------------------------------
//       // LOAD STUDENTS
//       // -----------------------------------------

//       try {
//         setLoading(true);
//         setError("");

//         const data = await getClassroomStudents(classroomId);

//         console.log("CLASSROOM STUDENTS:", data);

//         if (Array.isArray(data)) {
//           setStudents(data);
//         } else if (Array.isArray(data?.students)) {
//           setStudents(data.students);
//         } else {
//           setStudents([]);
//         }
//       } catch (err: any) {
//         console.error(
//           "Error loading classroom students:",
//           err
//         );

//         setError(
//           err?.response?.data?.detail ||
//             "Unable to load classroom students."
//         );
//       } finally {
//         setLoading(false);
//       }

//       // -----------------------------------------
//       // LOAD SHARED SUMMARIES
//       // -----------------------------------------

//       try {
//         setSummaryLoading(true);
//         setSummaryError("");

//         const data = await getSharedSummaries(classroomId);

//         console.log("SHARED SUMMARIES:", data);

//         if (Array.isArray(data)) {
//           setSharedSummaries(data);
//         } else {
//           setSharedSummaries([]);
//         }
//       } catch (err: any) {
//         console.error(
//           "Error loading shared summaries:",
//           err
//         );

//         setSummaryError(
//           err?.response?.data?.detail ||
//             "Unable to load shared summaries."
//         );
//       } finally {
//         setSummaryLoading(false);
//       }
//     };

//     loadClassroomData();
//   }, [classroomId]);

//   return (
//     <div
//       style={{
//         minHeight: "100%",
//         color: "white",
//       }}
//     >
//       {/* =========================================
//           HEADER
//       ========================================= */}

//       <div style={{ marginBottom: "30px" }}>
//         <h1
//           style={{
//             fontSize: "34px",
//             fontWeight: "700",
//             marginBottom: "8px",
//           }}
//         >
//           🏫 Classroom
//         </h1>

//         <p
//           style={{
//             color: "#94A3B8",
//             fontSize: "18px",
//           }}
//         >
//           Classroom ID: {classroomId}
//         </p>
//       </div>

//       {/* =========================================
//           CLASSROOM OVERVIEW
//       ========================================= */}

//       <div
//         style={{
//           background: "#1E293B",
//           border: "1px solid #334155",
//           borderRadius: "16px",
//           padding: "30px",
//           marginBottom: "25px",
//         }}
//       >
//         <h2
//           style={{
//             fontSize: "25px",
//             fontWeight: "600",
//             marginBottom: "10px",
//           }}
//         >
//           Classroom Overview
//         </h2>

//         <p
//           style={{
//             color: "#CBD5E1",
//             marginBottom: "25px",
//           }}
//         >
//           Manage your classroom, students and lecture content here.
//         </p>

//         {/* Overview Cards */}

//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(3, 1fr)",
//             gap: "20px",
//           }}
//         >
//           {/* Students */}

//           <div
//             style={{
//               background: "#273449",
//               borderRadius: "12px",
//               padding: "22px",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "28px",
//                 marginBottom: "8px",
//               }}
//             >
//               👨‍🎓
//             </div>

//             <h3
//               style={{
//                 fontSize: "20px",
//                 marginBottom: "5px",
//               }}
//             >
//               Students
//             </h3>

//             <p
//               style={{
//                 color: "#94A3B8",
//                 margin: 0,
//               }}
//             >
//               {loading
//                 ? "Loading..."
//                 : `${students.length} student${
//                     students.length !== 1 ? "s" : ""
//                   }`}
//             </p>
//           </div>

//           {/* Lectures */}

//           <div
//             style={{
//               background: "#273449",
//               borderRadius: "12px",
//               padding: "22px",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "28px",
//                 marginBottom: "8px",
//               }}
//             >
//               🎥
//             </div>

//             <h3
//               style={{
//                 fontSize: "20px",
//                 marginBottom: "5px",
//               }}
//             >
//               Lectures
//             </h3>

//             <p
//               style={{
//                 color: "#94A3B8",
//                 margin: 0,
//               }}
//             >
//               {summaryLoading
//                 ? "Loading..."
//                 : `${sharedSummaries.length} shared lecture${
//                     sharedSummaries.length !== 1 ? "s" : ""
//                   }`}
//             </p>
//           </div>

//           {/* Analytics */}

//           <div
//             style={{
//               background: "#273449",
//               borderRadius: "12px",
//               padding: "22px",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "28px",
//                 marginBottom: "8px",
//               }}
//             >
//               📊
//             </div>

//             <h3
//               style={{
//                 fontSize: "20px",
//                 marginBottom: "5px",
//               }}
//             >
//               Analytics
//             </h3>

//             <p
//               style={{
//                 color: "#94A3B8",
//                 margin: 0,
//               }}
//             >
//               View classroom activity
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* =========================================
//           STUDENTS SECTION
//       ========================================= */}

//       <div
//         style={{
//           background: "#1E293B",
//           border: "1px solid #334155",
//           borderRadius: "16px",
//           padding: "30px",
//           marginBottom: "25px",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: "25px",
//           }}
//         >
//           <div>
//             <h2
//               style={{
//                 fontSize: "25px",
//                 fontWeight: "600",
//                 marginBottom: "6px",
//               }}
//             >
//               👨‍🎓 Students
//             </h2>

//             <p
//               style={{
//                 color: "#94A3B8",
//                 margin: 0,
//               }}
//             >
//               Students who have joined this classroom
//             </p>
//           </div>

//           <div
//             style={{
//               background: "#334155",
//               padding: "10px 18px",
//               borderRadius: "10px",
//               fontWeight: "600",
//               color: "#C4B5FD",
//             }}
//           >
//             {students.length} Students
//           </div>
//         </div>

//         {/* Loading */}

//         {loading && (
//           <div
//             style={{
//               padding: "30px",
//               textAlign: "center",
//               color: "#94A3B8",
//             }}
//           >
//             Loading students...
//           </div>
//         )}

//         {/* Error */}

//         {!loading && error && (
//           <div
//             style={{
//               background: "#451A1A",
//               border: "1px solid #7F1D1D",
//               borderRadius: "10px",
//               padding: "16px",
//               color: "#FCA5A5",
//             }}
//           >
//             {error}
//           </div>
//         )}

//         {/* No Students */}

//         {!loading && !error && students.length === 0 && (
//           <div
//             style={{
//               background: "#273449",
//               borderRadius: "12px",
//               padding: "40px",
//               textAlign: "center",
//             }}
//           >
//             <div
//               style={{
//                 fontSize: "45px",
//                 marginBottom: "12px",
//               }}
//             >
//               👨‍🎓
//             </div>

//             <h3
//               style={{
//                 fontSize: "20px",
//                 marginBottom: "8px",
//               }}
//             >
//               No students yet
//             </h3>

//             <p
//               style={{
//                 color: "#94A3B8",
//                 margin: 0,
//               }}
//             >
//               Students who join this classroom will appear here.
//             </p>
//           </div>
//         )}

//         {/* Students List */}

//         {!loading && !error && students.length > 0 && (
//           <div
//             style={{
//               display: "flex",
//               flexDirection: "column",
//               gap: "12px",
//             }}
//           >
//             {students.map((student) => (
//               <div
//                 key={student.id}
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "15px",
//                   background: "#273449",
//                   borderRadius: "12px",
//                   padding: "18px 20px",
//                 }}
//               >
//                 {/* Avatar */}

//                 <div
//                   style={{
//                     width: "45px",
//                     height: "45px",
//                     borderRadius: "50%",
//                     background: "#2563EB",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     fontWeight: "700",
//                     fontSize: "18px",
//                   }}
//                 >
//                   {(student.username ||
//                     student.name ||
//                     student.email ||
//                     "S")[0].toUpperCase()}
//                 </div>

//                 {/* Student Info */}

//                 <div>
//                   <h3
//                     style={{
//                       margin: 0,
//                       fontSize: "17px",
//                       fontWeight: "600",
//                     }}
//                   >
//                     {student.username ||
//                       student.name ||
//                       "Student"}
//                   </h3>

//                   <p
//                     style={{
//                       margin: "4px 0 0",
//                       color: "#94A3B8",
//                     }}
//                   >
//                     {student.email}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* =========================================
//           SHARED LECTURE SUMMARIES
//       ========================================= */}

//       <div
//         style={{
//           background: "#1E293B",
//           border: "1px solid #334155",
//           borderRadius: "16px",
//           padding: "30px",
//           marginBottom: "30px",
//         }}
//       >
//         {/* Section Header */}

//         <div style={{ marginBottom: "25px" }}>
//           <h2
//             style={{
//               fontSize: "25px",
//               fontWeight: "600",
//               marginBottom: "6px",
//             }}
//           >
//             📚 Shared Lecture Summaries
//           </h2>

//           <p
//             style={{
//               color: "#94A3B8",
//               margin: 0,
//             }}
//           >
//             AI-generated summaries shared with this classroom.
//           </p>
//         </div>

//         {/* Loading */}

//         {summaryLoading && (
//           <div
//             style={{
//               background: "#273449",
//               borderRadius: "12px",
//               padding: "35px",
//               textAlign: "center",
//               color: "#94A3B8",
//             }}
//           >
//             Loading shared summaries...
//           </div>
//         )}

//         {/* Error */}

//         {!summaryLoading && summaryError && (
//           <div
//             style={{
//               background: "#451A1A",
//               border: "1px solid #7F1D1D",
//               borderRadius: "10px",
//               padding: "16px",
//               color: "#FCA5A5",
//             }}
//           >
//             {summaryError}
//           </div>
//         )}

//         {/* No Shared Summaries */}

//         {!summaryLoading &&
//           !summaryError &&
//           sharedSummaries.length === 0 && (
//             <div
//               style={{
//                 background: "#273449",
//                 borderRadius: "12px",
//                 padding: "40px",
//                 textAlign: "center",
//               }}
//             >
//               <div
//                 style={{
//                   fontSize: "45px",
//                   marginBottom: "12px",
//                 }}
//               >
//                 📚
//               </div>

//               <h3
//                 style={{
//                   fontSize: "20px",
//                   marginBottom: "8px",
//                 }}
//               >
//                 No shared summaries yet
//               </h3>

//               <p
//                 style={{
//                   color: "#94A3B8",
//                   margin: 0,
//                 }}
//               >
//                 Lecture summaries shared by the educator will
//                 appear here.
//               </p>
//             </div>
//           )}

//         {/* Shared Summaries List */}

//         {!summaryLoading &&
//           !summaryError &&
//           sharedSummaries.length > 0 && (
//             <div
//               style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "20px",
//               }}
//             >
//               {sharedSummaries.map((item) => (
//                 <div
//                   key={item.share_id}
//                   style={{
//                     background: "#273449",
//                     borderRadius: "14px",
//                     padding: "24px",
//                     border: "1px solid #334155",
//                   }}
//                 >
//                   {/* Video Name */}

//                   <h3
//                     style={{
//                       color: "#38BDF8",
//                       fontSize: "20px",
//                       marginBottom: "10px",
//                     }}
//                   >
//                     🎥 {item.original_filename}
//                   </h3>

//                   {/* Status */}

//                   <p
//                     style={{
//                       color:
//                         item.status === "Completed"
//                           ? "#22C55E"
//                           : "#F59E0B",
//                       fontWeight: "600",
//                       marginBottom: "18px",
//                     }}
//                   >
//                     Status: {item.status}
//                   </p>

//                   {/* Summary */}

//                   {item.summary ? (
//                     <>
//                       <h4
//                         style={{
//                           fontSize: "17px",
//                           marginBottom: "10px",
//                         }}
//                       >
//                         🤖 AI Generated Summary
//                       </h4>

//                       <div
//                         style={{
//                           background: "#0F172A",
//                           borderRadius: "12px",
//                           padding: "18px",
//                           lineHeight: "1.7",
//                           color: "#E2E8F0",
//                           whiteSpace: "pre-wrap",
//                         }}
//                       >
//                         {item.summary}
//                       </div>
//                     </>
//                   ) : (
//                     <p
//                       style={{
//                         color: "#94A3B8",
//                       }}
//                     >
//                       No summary available for this lecture.
//                     </p>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//       </div>
//             {/* Shared Summaries Section */}
//       <div
//         style={{
//           background: "#1E293B",
//           border: "1px solid #334155",
//           borderRadius: "16px",
//           padding: "30px",
//           marginTop: "25px",
//         }}
//       >
//         <div style={{ marginBottom: "25px" }}>
//           <h2
//             style={{
//               fontSize: "25px",
//               fontWeight: "600",
//               marginBottom: "6px",
//             }}
//           >
//             📚 Shared Lecture Summaries
//           </h2>

//           <p
//             style={{
//               color: "#94A3B8",
//               margin: 0,
//             }}
//           >
//             AI-generated summaries shared by your educator.
//           </p>
//         </div>

//         {/* Loading */}
//         {summaryLoading && (
//           <div
//             style={{
//               padding: "30px",
//               textAlign: "center",
//               color: "#94A3B8",
//             }}
//           >
//             Loading shared summaries...
//           </div>
//         )}

//         {/* Error */}
//         {!summaryLoading && summaryError && (
//           <div
//             style={{
//               background: "#451A1A",
//               border: "1px solid #7F1D1D",
//               borderRadius: "10px",
//               padding: "16px",
//               color: "#FCA5A5",
//             }}
//           >
//             {summaryError}
//           </div>
//         )}

//         {/* Empty State */}
//         {!summaryLoading &&
//           !summaryError &&
//           sharedSummaries.length === 0 && (
//             <div
//               style={{
//                 background: "#273449",
//                 borderRadius: "12px",
//                 padding: "40px",
//                 textAlign: "center",
//               }}
//             >
//               <div
//                 style={{
//                   fontSize: "45px",
//                   marginBottom: "12px",
//                 }}
//               >
//                 📚
//               </div>

//               <h3
//                 style={{
//                   fontSize: "20px",
//                   marginBottom: "8px",
//                 }}
//               >
//                 No summaries shared yet
//               </h3>

//               <p
//                 style={{
//                   color: "#94A3B8",
//                   margin: 0,
//                 }}
//               >
//                 Your educator has not shared any lecture
//                 summaries with this classroom yet.
//               </p>
//             </div>
//           )}

//         {/* Shared Summaries */}
//         {!summaryLoading &&
//           !summaryError &&
//           sharedSummaries.length > 0 && (
//             <div
//               style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 gap: "18px",
//               }}
//             >
//               {sharedSummaries.map((item) => (
//                 <div
//                   key={item.share_id}
//                   style={{
//                     background: "#273449",
//                     borderRadius: "12px",
//                     padding: "22px",
//                     border:
//                       "1px solid #334155",
//                   }}
//                 >
//                   <h3
//                     style={{
//                       color: "#38BDF8",
//                       fontSize: "20px",
//                       fontWeight: "600",
//                       marginBottom: "8px",
//                     }}
//                   >
//                     🎥 {item.original_filename}
//                   </h3>

//                   <p
//                     style={{
//                       color: "#22C55E",
//                       fontSize: "14px",
//                       fontWeight: "600",
//                       marginBottom: "15px",
//                     }}
//                   >
//                     ✓ Shared by educator
//                   </p>

//                   <div
//                     style={{
//                       background: "#0F172A",
//                       borderRadius: "10px",
//                       padding: "18px",
//                       color: "#E2E8F0",
//                       lineHeight: "1.7",
//                       whiteSpace: "pre-wrap",
//                     }}
//                   >
//                     {item.summary ||
//                       "Summary not available."}
//                   </div>

//                   <button
//                     onClick={() =>
//                       window.location.href =
//                         `/dashboard/summary?videoId=${item.video_id}`
//                     }
//                     style={{
//                       marginTop: "15px",
//                       background: "#2563EB",
//                       color: "white",
//                       border: "none",
//                       borderRadius: "8px",
//                       padding: "10px 18px",
//                       cursor: "pointer",
//                       fontWeight: "600",
//                     }}
//                   >
//                     View Full Summary →
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//       </div>
//     </div>
//   );
// }