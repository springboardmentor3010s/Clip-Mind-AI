import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../../config";

import {
  FaHome,
  FaBook,
  FaVideo,
  FaChalkboardTeacher,
  FaFileAlt,
  FaChartBar,
  FaUsers,
  FaUser,
  FaSignOutAlt,
  FaPlusCircle,
  FaListAlt,
  FaBullseye,
  FaFileInvoice,
  FaLightbulb,
} from "react-icons/fa";

import "../../styles/EducatorDashboard.css";

function EducatorDashboard() {
  const navigate = useNavigate();

  const userName =
    localStorage.getItem("userName") ||
    "ClipMind Educator";

  const token = localStorage.getItem("access_token");

const [totalLectures, setTotalLectures] = useState(0);
const [totalCourses, setTotalCourses] = useState(0);
const [students, setStudents] = useState(0);
const [engagement, setEngagement] = useState(0);

const [loading, setLoading] = useState(true);

useEffect(() => {
  loadDashboardData();
}, []);

const loadDashboardData = async () => {
  try {
    if (!token) {
      navigate("/login");
      return;
    }

    console.log("=== LOADING EDUCATOR DASHBOARD ===");
    console.log("API:", API);
    console.log("URL:", `${API}/videos`);

    const response = await axios.get(
      `${API}/videos`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("VIDEOS FROM BACKEND:", response.data);

    const videos = Array.isArray(response.data)
      ? response.data
      : [];

    console.log("VIDEO COUNT:", videos.length);

    // ==============================
    // TOTAL LECTURES
    // ==============================

    setTotalLectures(videos.length);

    // ==============================
    // TOTAL COURSES
    // ==============================

    const savedCourses =
      JSON.parse(
        localStorage.getItem("educatorCourses")
      ) || [];

    setTotalCourses(savedCourses.length);

    // ==============================
    // STUDENTS
    // ==============================

    const savedStudents =
      JSON.parse(
        localStorage.getItem("educatorStudents")
      ) || [];

    setStudents(savedStudents.length);

    // ==============================
    // ENGAGEMENT
    // ==============================

    const calculatedEngagement =
      videos.length > 0
        ? Math.min(95, 50 + videos.length * 5)
        : 0;

    setEngagement(calculatedEngagement);

  } catch (error) {
    console.error(
      "EDUCATOR DASHBOARD ERROR:",
      error
    );

    if (error.response?.status === 401) {
      logout();
    }

  } finally {
    setLoading(false);
  }
};

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

    navigate("/login", { replace: true });
  };

  return (
    <div className="educator-layout">

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <aside className="educator-sidebar">

        <div className="educator-brand">
          🧠 ClipMind AI
        </div>

        <div className="educator-role">
          👨‍🏫 Educator Panel
        </div>

        <nav className="educator-nav">

          <button
            onClick={() =>
              navigate("/educator")
            }
            className="active"
          >
            <FaHome />
            Dashboard
          </button>

          <button
            onClick={() =>
              navigate(
                "/educator/create-course"
              )
            }
          >
            <FaPlusCircle />
            Create Course
          </button>

          <button
            onClick={() =>
              navigate(
                "/educator/my-courses"
              )
            }
          >
            <FaBook />
            My Courses
          </button>

          <button
            onClick={() =>
              navigate(
                "/educator/upload-lecture"
              )
            }
          >
            <FaVideo />
            Upload Lecture
          </button>

          <button
            onClick={() =>
              navigate(
                "/educator/my-lectures"
              )
            }
          >
            <FaListAlt />
            My Lectures
          </button>

          <button
            onClick={() =>
              navigate(
                "/educator/classrooms"
              )
            }
          >
            <FaChalkboardTeacher />
            Classrooms
          </button>

          <button
            onClick={() =>
              navigate(
                "/educator/transcripts"
              )
            }
          >
            <FaFileAlt />
            Transcripts
          </button>

          <button
            onClick={() =>
              navigate(
                "/educator/summaries"
              )
            }
          >
            📝
            Summaries
          </button>

          <button
            onClick={() =>
              navigate(
                "/educator/analytics"
              )
            }
          >
            <FaChartBar />
            Analytics
          </button>

        <button
  onClick={() =>
    navigate("/educator/key-moments")
  }
>
  <FaBullseye />
  Key Moments
</button>

<button
  onClick={() =>
    navigate("/educator/reports")
  }
>
  <FaFileInvoice />
  Reports
</button>

<button
  onClick={() =>
    navigate("/educator/insights")
  }
>
  <FaLightbulb />
  Content Insights
</button>

          <button
            onClick={() =>
              navigate(
                "/educator/student-engagement"
              )
            }
          >
            <FaUsers />
            Student Engagement
          </button>

          <button
            onClick={() =>
              navigate(
                "/educator/profile"
              )
            }
          >
            <FaUser />
            Profile
          </button>

        </nav>

        {/* LOGOUT */}

        <button
          className="educator-logout"
          onClick={logout}
        >
          <FaSignOutAlt />
          Logout
        </button>

      </aside>


      {/* ==========================================
          MAIN CONTENT
      ========================================== */}

      <main className="educator-main">

        {/* HEADER */}

        <div className="educator-header">

          <div>

            <h1>
              Welcome, {userName} 👋
            </h1>

            <p>
              Manage your courses, lectures and
              student engagement from one place.
            </p>

          </div>

          <button
            className="create-course-btn"
            onClick={() =>
              navigate(
                "/educator/create-course"
              )
            }
          >
            <FaPlusCircle />
            Create Course
          </button>

        </div>


        {/* ==========================================
            STATISTICS
        ========================================== */}

        <div className="educator-stats">

          {/* COURSES */}

          <div className="educator-stat-card">

            <FaBook />

            <div>

              <h3>
                {loading
                  ? "..."
                  : totalCourses}
              </h3>

              <p>
                Total Courses
              </p>

            </div>

          </div>


{/* LECTURES */}

<div className="educator-stat-card">

  <FaVideo />

  <div>

    <h3>
      {loading ? "..." : totalLectures}
    </h3>

    <p>
      Total Lectures
    </p>

  </div>

</div>


          {/* STUDENTS */}

          <div className="educator-stat-card">

            <FaUsers />

            <div>

              <h3>
                {loading
                  ? "..."
                  : students}
              </h3>

              <p>
                Students
              </p>

            </div>

          </div>


          {/* ENGAGEMENT */}

          <div className="educator-stat-card">

            <FaChartBar />

            <div>

              <h3>
                {loading
                  ? "..."
                  : `${engagement}%`}
              </h3>

              <p>
                Engagement
              </p>

            </div>

          </div>

        </div>


        {/* ==========================================
            QUICK ACTIONS
        ========================================== */}

        <section className="quick-actions">

          <h2>
            Quick Actions
          </h2>

          <div className="quick-action-grid">

            <button
              onClick={() =>
                navigate(
                  "/educator/create-course"
                )
              }
            >
              <FaPlusCircle />

              <span>
                Create Course
              </span>

            </button>


            <button
              onClick={() =>
                navigate(
                  "/educator/upload-lecture"
                )
              }
            >
              <FaVideo />

              <span>
                Upload Lecture
              </span>

            </button>


            <button
              onClick={() =>
                navigate(
                  "/educator/my-courses"
                )
              }
            >
              <FaBook />

              <span>
                My Courses
              </span>

            </button>


            <button
              onClick={() =>
                navigate(
                  "/educator/student-engagement"
                )
              }
            >
              <FaUsers />

              <span>
                Student Engagement
              </span>

            </button>
        
        <button
  onClick={() =>
    navigate("/educator/key-moments")
  }
>
  <FaBullseye />

  <span>
    Key Moments
  </span>
</button>

<button
  onClick={() =>
    navigate("/educator/analytics")
  }
>
  <FaChartBar />

  <span>
    Analytics
  </span>
</button>

<button
  onClick={() =>
    navigate("/educator/reports")
  }
>
  <FaFileInvoice />

  <span>
    Reports
  </span>
</button>

<button
  onClick={() =>
    navigate("/educator/insights")
  }
>
  <FaLightbulb />

  <span>
    Content Insights
  </span>
</button>    
        
          </div>

        </section>


        {/* ==========================================
            AI FEATURES
        ========================================== */}

        <section className="ai-features">

          <h2>
            ClipMind AI Tools
          </h2>

          <div className="ai-feature-grid">

            <div className="ai-feature-card">

              <span>
                📝
              </span>

              <h3>
                AI Transcripts
              </h3>

              <p>
                Automatically generate transcripts
                from lecture videos.
              </p>

            </div>


            <div className="ai-feature-card">

              <span>
                ✨
              </span>

              <h3>
                AI Summaries
              </h3>

              <p>
                Generate concise summaries of
                educational lectures.
              </p>

            </div>


            <div className="ai-feature-card">

              <span>
                ⭐
              </span>

              <h3>
                Key Moments
              </h3>

              <p>
                Identify important moments in
                lectures automatically.
              </p>

            </div>


            <div className="ai-feature-card">

              <span>
                📊
              </span>

              <h3>
                Learning Analytics
              </h3>

              <p>
                Understand student engagement
                and lecture performance.
              </p>

            </div>

          </div>

        </section>


        {/* ==========================================
            RECENT ACTIVITY
        ========================================== */}

        <section className="recent-activity">

          <h2>
            Recent Activity
          </h2>

          {loading ? (

            <p>
              Loading activity...
            </p>

          ) : totalLectures === 0 ? (

            <div className="empty-state">

              <span>
                🎥
              </span>

              <h3>
                No lectures yet
              </h3>

              <p>
                Upload your first lecture to
                start using ClipMind AI.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/educator/upload-lecture"
                  )
                }
              >
                Upload Lecture
              </button>

            </div>

          ) : (

            <div className="activity-message">

              <span>
                ✅
              </span>

              <div>

                <h3>
                  {totalLectures} lecture
                  {totalLectures !== 1
                    ? "s"
                    : ""}{" "}
                  processed
                </h3>

                <p>
                  Your lecture processing and AI
                  analysis are working successfully.
                </p>

              </div>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default EducatorDashboard;
