// src/pages/Dashboard.jsx

import { useNavigate } from "react-router-dom";
import {
  FaUpload,
  FaFileAlt,
  FaBrain,
  FaClock,
  FaChartBar,
  FaUserCircle,
  FaSignOutAlt,
  FaVideo,     // 🟢 Video Library & Content Management
  FaBookmark,  // 🟢 Bookmarks
  FaBook,      // 🟢 Learning Materials
  FaUsers,     // 🛡️ Admin: User Management
  FaRobot,     // 🛡️ Admin: AI Processing Jobs
  FaHdd,       // 🛡️ Admin: Storage & Resources
  FaShieldAlt, // 🛡️ Admin: Audit Logs
  FaCogs       // 🛡️ Admin: Platform Settings
} from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();

  const name =
    localStorage.getItem("userName") ||
    localStorage.getItem("username") ||
    localStorage.getItem("name") ||
    "User";

  const userRole =
    localStorage.getItem("userRole") ||
    localStorage.getItem("role") ||
    "Learner";

  const isAdmin = userRole.toLowerCase() === "administrator";
  const isEducator = userRole.toLowerCase() === "educator";
  const isContentCreator = userRole.toLowerCase() === "content creator";
  const isLearner = userRole.toLowerCase() === "learner";

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "10px",
    padding: "25px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "0.3s",
    textAlign: "center",
  };

  const getRoleBanner = () => {
    const roleLower = userRole.toLowerCase();

    if (roleLower === "educator") {
      return {
        bg: "#fef3c7",
        border: "#d97706",
        text: "👨‍🏫 Educator Workstation: Upload lectures, edit transcripts, and share summaries with students.",
      };
    } else if (roleLower === "content creator") {
      return {
        bg: "#eff6ff",
        border: "#2563eb",
        text: "🎥 Content Creator Studio: Upload videos, detect key moments, export timestamps, and view analytics.",
      };
    } else if (roleLower === "administrator") {
      return {
        bg: "#f3e8ff",
        border: "#7e22ce",
        text: "👨‍💼 Administrator Portal: Manage users & roles, moderate content, view system analytics, and monitor AI jobs.",
      };
    }
    // Learner Banner
    return {
      bg: "#f0fdf4",
      border: "#16a34a",
      text: "🎓 Learner Station (Read-Only): Watch videos, read transcripts, view AI summaries, and search key moments.",
    };
  };

  const banner = getRoleBanner();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa" }}>
      {/* Header */}
      <div
        style={{
          background: "#2563eb",
          color: "white",
          padding: "18px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>ClipMind AI Dashboard</h2>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span
            style={{
              background: "rgba(255,255,255,0.2)",
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Role: {userRole}
          </span>

          <button
            onClick={logout}
            style={{
              background: "#ef4444",
              border: "none",
              color: "white",
              padding: "10px 18px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Welcome Banner */}
      <div style={{ padding: "30px 40px 10px" }}>
        <h1 style={{ margin: "0 0 10px 0" }}>Welcome, {name} 👋</h1>

        <div
          style={{
            background: banner.bg,
            borderLeft: `5px solid ${banner.border}`,
            padding: "15px 20px",
            borderRadius: "8px",
            color: "#1e293b",
            fontSize: "15px",
            fontWeight: "500",
          }}
        >
          {banner.text}
        </div>
      </div>

      {/* Action Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: "25px",
          padding: "30px 40px",
        }}
      >
        {/* ================= 🛡️ 1. ADMINISTRATOR DASHBOARD CARDS ================= */}
        {isAdmin ? (
          <>
            <div style={cardStyle} onClick={() => navigate("/admin-panel?tab=users")}>
              <FaUsers size={45} color="#2563eb" />
              <h3>User Management</h3>
              <p>Manage users & assign permissions.</p>
            </div>

            <div style={cardStyle} onClick={() => navigate("/admin-panel?tab=content")}>
              <FaVideo size={45} color="#16a34a" />
              <h3>Content Management</h3>
              <p>Moderate & monitor video lectures.</p>
            </div>

            <div style={cardStyle} onClick={() => navigate("/admin-panel?tab=jobs")}>
              <FaRobot size={45} color="#f97316" />
              <h3>AI Processing Jobs</h3>
              <p>Track Whisper & LLM pipeline execution.</p>
            </div>

            <div style={cardStyle} onClick={() => navigate("/admin-panel?tab=analytics")}>
              <FaChartBar size={45} color="#0891b2" />
              <h3>System Analytics</h3>
              <p>View overall system usage & metrics.</p>
            </div>

            <div style={cardStyle} onClick={() => navigate("/admin-panel?tab=storage")}>
              <FaHdd size={45} color="#9333ea" />
              <h3>Storage & Resources</h3>
              <p>Check disk, DB size & memory cache.</p>
            </div>

            <div style={cardStyle} onClick={() => navigate("/admin-panel?tab=audit")}>
              <FaShieldAlt size={45} color="#0284c7" />
              <h3>Audit Logs</h3>
              <p>Review system security & admin events.</p>
            </div>

            <div style={cardStyle} onClick={() => navigate("/admin-panel?tab=settings")}>
              <FaCogs size={45} color="#475569" />
              <h3>Platform Settings</h3>
              <p>Manage AI models & server limits.</p>
            </div>

            <div style={cardStyle} onClick={() => navigate("/profile")}>
              <FaUserCircle size={45} color="#dc2626" />
              <h3>Profile</h3>
              <p>Manage admin account settings.</p>
            </div>
          </>
        ) : (
          /* ================= 🧑‍🎓 2. LEARNER, EDUCATOR & CREATOR CARDS ================= */
          <>
            {/* Learner Exclusive: Video Library Card */}
            {isLearner && (
              <div style={cardStyle} onClick={() => navigate("/library")}>
                <FaVideo size={45} color="#2563eb" />
                <h3>Video Library</h3>
                <p>Browse uploaded lecture lessons.</p>
              </div>
            )}

            {/* Content Creator Exclusive: My Videos Card */}
            {isContentCreator && (
              <div style={cardStyle} onClick={() => navigate("/my-videos")}>
                <FaVideo size={45} color="#2563eb" />
                <h3>My Videos</h3>
                <p>Manage your published videos.</p>
              </div>
            )}

            {/* Upload Card - Hidden for Learner */}
            {!isLearner && (
              <div style={cardStyle} onClick={() => navigate("/upload")}>
                <FaUpload size={45} color="#2563eb" />
                <h3>Upload Video</h3>
                <p>Upload new videos for AI processing.</p>
              </div>
            )}

            {/* Transcript Card */}
            <div style={cardStyle} onClick={() => navigate("/transcript")}>
              <FaFileAlt size={45} color="#16a34a" />
              <h3>Transcript</h3>
              <p>Read speech-to-text transcript.</p>
            </div>

            {/* AI Summary Card */}
            <div style={cardStyle} onClick={() => navigate("/summary")}>
              <FaBrain size={45} color="#f97316" />
              <h3>AI Summary</h3>
              <p>View AI-generated summaries.</p>
            </div>

            {/* Learning Materials Card - Learner & Educator Only */}
            {(isLearner || isEducator) && (
              <div style={cardStyle} onClick={() => navigate("/learning-materials")}>
                <FaBook size={45} color="#8b5cf6" />
                <h3>Learning Materials</h3>
                <p>{isEducator ? "Create study notes & quizzes." : "Access shared study guides."}</p>
              </div>
            )}

            {/* Key Moments Card */}
            <div style={cardStyle} onClick={() => navigate("/keymoments")}>
              <FaClock size={45} color="#9333ea" />
              <h3>Key Moments</h3>
              <p>View highlights &amp; timestamps.</p>
            </div>

            {/* Learner Exclusive: My Bookmarks Card */}
            {isLearner && (
              <div style={cardStyle} onClick={() => navigate("/bookmarks")}>
                <FaBookmark size={45} color="#d97706" />
                <h3>My Bookmarks</h3>
                <p>Access saved notes &amp; moments.</p>
              </div>
            )}

            {/* Analytics Card - Hidden for Learner */}
            {!isLearner && (
              <div style={cardStyle} onClick={() => navigate("/analytics")}>
                <FaChartBar size={45} color="#0891b2" />
                <h3>Analytics</h3>
                <p>View video performance &amp; AI metrics.</p>
              </div>
            )}

            {/* Profile Card */}
            <div style={cardStyle} onClick={() => navigate("/profile")}>
              <FaUserCircle size={45} color="#dc2626" />
              <h3>Profile</h3>
              <p>Manage your account.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;