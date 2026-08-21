// src/pages/Profile.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaUser,
  FaEnvelope,
  FaIdBadge,
  FaUserShield,
  FaSignOutAlt,
  FaTrash,
  FaArrowLeft,
  FaVideo,
  FaBookmark,
  FaBrain,
  FaCheckCircle,
  FaCalendarAlt
} from "react-icons/fa";
import { deleteUser, getAllVideos } from "../api";

function Profile() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId") || "1";
  const name =
    localStorage.getItem("userName") ||
    localStorage.getItem("username") ||
    localStorage.getItem("name") ||
    "User";
  const email =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email") ||
    "user@clipmind.ai";
  const userRole =
    localStorage.getItem("userRole") ||
    localStorage.getItem("role") ||
    "Learner";

  const [totalVideos, setTotalVideos] = useState(0);
  const [totalBookmarks, setTotalBookmarks] = useState(0);

  useEffect(() => {
    // 1. Fetch DB Video count
    getAllVideos()
      .then((res) => {
        const vids = res.data || [];
        setTotalVideos(vids.length);
      })
      .catch(() => setTotalVideos(0));

    // 2. Fetch Bookmarks count
    const bms = JSON.parse(localStorage.getItem("bookmarks_default") || "[]");
    setTotalBookmarks(bms.length);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    toast.info("Logged out successfully");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your ClipMind AI account? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      if (deleteUser) {
        await deleteUser(userId);
      }
      localStorage.clear();
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (err) {
      toast.error("Failed to delete account from server");
    }
  };

  // Role Color Schemes
  const getRoleBadgeStyle = () => {
    switch (userRole.toLowerCase()) {
      case "administrator":
        return { bg: "#fee2e2", color: "#991b1b", border: "#f87171" };
      case "educator":
        return { bg: "#fef3c7", color: "#92400e", border: "#fbbf24" };
      case "content creator":
        return { bg: "#eff6ff", color: "#1e40af", border: "#60a5fa" };
      default:
        return { bg: "#dcfce7", color: "#166534", border: "#4ade80" };
    }
  };

  const roleStyle = getRoleBadgeStyle();

  // Role-Specific Capabilities Description
  const getRoleCapabilities = () => {
    switch (userRole.toLowerCase()) {
      case "administrator":
        return [
          "Full Platform Governance & User Role Management",
          "AI Pipelines & Job Queue Monitoring",
          "System Storage, Resource Auditing & Platform Settings"
        ];
      case "educator":
        return [
          "Upload Course Lectures & Edit Transcripts",
          "Generate & Share Study Guides with Students",
          "Monitor Classroom Engagement & Lecture Insights"
        ];
      case "content creator":
        return [
          "Upload Videos & Import via YouTube URL",
          "Export Multilingual Summaries & Viral Key Moments",
          "Access Video Performance Analytics"
        ];
      default:
        return [
          "Browse Video Library & Watch Lectures",
          "Read Real-Time Transcripts & AI Summaries",
          "Access Shared Learning Materials & Bookmark Key Concepts"
        ];
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "35px" }}>
      {/* Top Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <div>
          <h1 style={{ color: "#1e293b", margin: 0, fontSize: "28px", fontWeight: "800" }}>
            My Account &amp; Profile
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Manage your personal credentials, permissions, and active role status
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px"
          }}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "25px", alignItems: "start" }}>
        {/* Left Side: User Identity Card */}
        <div
          style={{
            background: "#ffffff",
            padding: "30px 20px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
          }}
        >
          {/* Avatar Circle */}
          <div
            style={{
              width: "90px",
              height: "90px",
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              color: "#ffffff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: "bold",
              margin: "0 auto 15px auto",
              boxShadow: "0 4px 12px rgba(37,99,235,0.25)"
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>

          <h2 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "22px" }}>{name}</h2>
          <p style={{ margin: "0 0 15px 0", color: "#64748b", fontSize: "14px" }}>{email}</p>

          <span
            style={{
              display: "inline-block",
              background: roleStyle.bg,
              color: roleStyle.color,
              border: `1px solid ${roleStyle.border}`,
              padding: "5px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "700",
              marginBottom: "25px"
            }}
          >
            {userRole} Mode
          </span>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                padding: "11px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "14px"
              }}
            >
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>

        {/* Right Side: Detailed Details & Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Quick Metrics Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "15px" }}>
            <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <FaIdBadge size={28} color="#2563eb" />
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Account ID</span>
                <h4 style={{ margin: 0, color: "#1e293b", fontSize: "18px" }}>#{userId}</h4>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <FaVideo size={28} color="#16a34a" />
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Available Lessons</span>
                <h4 style={{ margin: 0, color: "#1e293b", fontSize: "18px" }}>{totalVideos}</h4>
              </div>
            </div>

            <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
              <FaBookmark size={28} color="#f59e0b" />
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>My Bookmarks</span>
                <h4 style={{ margin: 0, color: "#1e293b", fontSize: "18px" }}>{totalBookmarks}</h4>
              </div>
            </div>
          </div>

          {/* Account Details Table */}
          <div style={{ background: "#ffffff", padding: "25px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#1e293b", fontSize: "17px", fontWeight: "700" }}>
              📋 Personal Details
            </h3>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 0", color: "#64748b", width: "160px", fontWeight: "600" }}>Full Name</td>
                  <td style={{ padding: "12px 0", color: "#1e293b", fontWeight: "700" }}>{name}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 0", color: "#64748b", fontWeight: "600" }}>Email Address</td>
                  <td style={{ padding: "12px 0", color: "#1e293b" }}>{email}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 0", color: "#64748b", fontWeight: "600" }}>Assigned Role</td>
                  <td style={{ padding: "12px 0", color: "#2563eb", fontWeight: "700" }}>{userRole}</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 0", color: "#64748b", fontWeight: "600" }}>Account Status</td>
                  <td style={{ padding: "12px 0" }}>
                    <span style={{ background: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                      Active
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Role Permissions & Workflows */}
          <div style={{ background: "#ffffff", padding: "25px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#1e293b", fontSize: "17px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaUserShield color="#2563eb" /> Active Permissions &amp; Capabilities
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {getRoleCapabilities().map((cap, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#334155" }}>
                  <FaCheckCircle color="#16a34a" /> {cap}
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{ background: "#fef2f2", padding: "22px", borderRadius: "14px", border: "1px solid #fecaca" }}>
            <h3 style={{ margin: "0 0 6px 0", color: "#991b1b", fontSize: "16px", fontWeight: "700" }}>
              ⚠️ Danger Zone
            </h3>
            <p style={{ margin: "0 0 15px 0", color: "#7f1d1d", fontSize: "13px", lineHeight: "20px" }}>
              Permanently remove your ClipMind AI account and all personal activity logs.
            </p>
            <button
              onClick={handleDeleteAccount}
              style={{
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
                padding: "9px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px"
              }}
            >
              <FaTrash /> Delete My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;