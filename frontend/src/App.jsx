// src/App.jsx

import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Transcript from "./pages/Transcript";
import Summary from "./pages/Summary";
import KeyMoments from "./pages/KeyMoments";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";

// 🟢 Learner-Specific Pages
import VideoLibrary from "./pages/VideoLibrary";
import Bookmarks from "./pages/Bookmarks";

// 🟢 New Pages (Educator & Content Creator Workflows)
import LearningMaterials from "./pages/LearningMaterials";
import MyVideos from "./pages/MyVideos";

// Standard Authentication Route Guard
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Role-Based Route Guard Helper
function RoleProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole") || "Learner";

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const hasPermission = allowedRoles.some(
    (role) => role.toLowerCase() === userRole.toLowerCase()
  );

  if (!hasPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Common Dashboard Layout Wrapper
function Layout({ children }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f5f6fa"
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "30px",
          overflowY: "auto"
        }}
      >
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🎬 My Videos & Upload History - Content Creator Access */}
        <Route
          path="/my-videos"
          element={
            <RoleProtectedRoute allowedRoles={["Content Creator", "Administrator"]}>
              <Layout>
                <MyVideos />
              </Layout>
            </RoleProtectedRoute>
          }
        />

        {/* 🟢 Video Library Page - Learner Access */}
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Layout>
                <VideoLibrary />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Upload - NO LEARNER ACCESS */}
        <Route
          path="/upload"
          element={
            <RoleProtectedRoute allowedRoles={["Content Creator", "Educator", "Administrator"]}>
              <Layout>
                <Upload />
              </Layout>
            </RoleProtectedRoute>
          }
        />

        {/* Transcript Page */}
        <Route
          path="/transcript"
          element={
            <ProtectedRoute>
              <Layout>
                <Transcript />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Summary Page */}
        <Route
          path="/summary"
          element={
            <ProtectedRoute>
              <Layout>
                <Summary />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 📚 Learning Materials Page (Learners & Educators) */}
        <Route
          path="/learning-materials"
          element={
            <ProtectedRoute>
              <Layout>
                <LearningMaterials />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Key Moments Detection */}
        <Route
          path="/keymoments"
          element={
            <ProtectedRoute>
              <Layout>
                <KeyMoments />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🟢 My Bookmarks Page - Learner Access */}
        <Route
          path="/bookmarks"
          element={
            <ProtectedRoute>
              <Layout>
                <Bookmarks />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Analytics Page - NO LEARNER ACCESS */}
        <Route
          path="/analytics"
          element={
            <RoleProtectedRoute allowedRoles={["Content Creator", "Educator", "Administrator"]}>
              <Layout>
                <Analytics />
              </Layout>
            </RoleProtectedRoute>
          }
        />

        {/* 🛡️ Admin Panel - ADMINISTRATOR EXCLUSIVE */}
        <Route
          path="/admin-panel"
          element={
            <RoleProtectedRoute allowedRoles={["Administrator"]}>
              <Layout>
                <AdminPanel />
              </Layout>
            </RoleProtectedRoute>
          }
        />

        {/* User Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={2500}
        theme="colored"
      />
    </>
  );
}

export default App;