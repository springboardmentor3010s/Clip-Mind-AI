import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SharedVideo from "./pages/SharedVideo";
import FeaturesPage from "./pages/FeaturesPage";
import About from "./pages/About";
import Contact from "./pages/Contact";

import Dashboard from "./pages/Dashboard";
import UploadVideo from "./pages/UploadVideo";
import Processing from "./pages/Processing";
import Transcript from "./pages/Transcript";
import AISummary from "./pages/AISummary";
import KeyMoments from "./pages/KeyMoments";
import Analytics from "./pages/Analytics";
import Library from "./pages/Library";
import Search from "./pages/Search";
import Bookmarks from "./pages/Bookmarks";
import History from "./pages/History";
import LearningMaterials from "./pages/LearningMaterials";
import ClassroomAnalytics from "./pages/ClassroomAnalytics";
import AdminDashboard from "./pages/AdminDashboard";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import { ROLES, UPLOADER_ROLES } from "./lib/roles";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ---------- Public Routes ---------- */}

        <Route path="/" element={<Home />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Public share page — intentionally outside ProtectedRoute */}
        <Route path="/shared/:token" element={<SharedVideo />} />

        {/* ---------- Protected Routes ---------- */}

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Available to every authenticated role */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transcript" element={<Transcript />} />
          <Route path="/summary" element={<AISummary />} />
          <Route path="/key-moments" element={<KeyMoments />} />
          <Route path="/search" element={<Search />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/history" element={<History />} />
          <Route path="/library" element={<Library />} />

          {/* Analytics — not a Learner capability under the spec */}
          <Route
            path="/analytics"
            element={
              <RoleRoute allow={[ROLES.CONTENT_CREATOR, ROLES.EDUCATOR, ROLES.ADMIN]}>
                <Analytics />
              </RoleRoute>
            }
          />

          {/* Uploaders only — learners are read-only consumers */}
          <Route
            path="/upload"
            element={<RoleRoute allow={UPLOADER_ROLES}><UploadVideo /></RoleRoute>}
          />
          <Route
            path="/processing"
            element={<RoleRoute allow={UPLOADER_ROLES}><Processing /></RoleRoute>}
          />

          {/* Learning materials — authored by educators, readable by all */}
          <Route path="/learning-materials" element={<LearningMaterials />} />

          {/* Educator */}
          <Route
            path="/classroom"
            element={
              <RoleRoute allow={[ROLES.EDUCATOR, ROLES.ADMIN]}>
                <ClassroomAnalytics />
              </RoleRoute>
            }
          />

          {/* Administrator */}
          <Route
            path="/admin"
            element={
              <RoleRoute allow={[ROLES.ADMIN]}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
