import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ===============================
// AUTH
// ===============================
import Login from "../pages/Login";
import Register from "../pages/Register";

// ===============================
// GENERAL PAGES
// ===============================
import Dashboard from "../pages/Dashboard";
import Upload from "../pages/Upload";
import Processing from "../pages/Processing";
import Summary from "../pages/Summary";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import MyVideos from "../pages/MyVideos";
import KeyMoments from "../pages/KeyMoments";
import Transcript from "../pages/Transcript";

// ===============================
// PROTECTED ROUTE
// ===============================
import ProtectedRoute from "./ProtectedRoute";

// ===============================
// EDUCATOR
// ===============================
import EducatorDashboard from "../pages/educator/EducatorDashboard";
import CreateCourse from "../pages/educator/CreateCourse";
import MyCourses from "../pages/educator/MyCourses";
import UploadLecture from "../pages/educator/UploadLecture";
import MyLectures from "../pages/educator/MyLectures";
import Classrooms from "../pages/educator/Classrooms";
import EducatorTranscripts from "../pages/educator/EducatorTranscripts";
import EducatorSummaries from "../pages/educator/EducatorSummaries";
import EducatorKeyMoments from "../pages/educator/EducatorKeyMoments";
import EducatorReports from "../pages/educator/EducatorReports";
import EducatorInsights from "../pages/educator/EducatorInsights";
import EducatorAnalytics from "../pages/educator/EducatorAnalytics";
import StudentEngagement from "../pages/educator/StudentEngagement";
import Profile from "../pages/educator/Profile";

// ===============================
// LEARNER
// ===============================
import LearnerDashboard from "../pages/learner/LearnerDashboard";
import LearnerVideos from "../pages/learner/LearnerVideos";
import LearnerTranscripts from "../pages/learner/LearnerTranscripts";
import LearnerSummaries from "../pages/learner/LearnerSummaries";
import LearnerKeyMoments from "../pages/learner/LearnerKeyMoments";
import LearnerAnalytics from "../pages/learner/LearnerAnalytics";

// ===============================
// CREATOR / CONTENT CREATOR
// ===============================
import CreatorDashboard from "../pages/creator/CreatorDashboard";
import CreatorVideos from "../pages/creator/CreatorVideos";
import CreatorAnalytics from "../pages/creator/CreatorAnalytics";

// ===============================
// ADMIN
// ===============================
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminVideos from "../pages/admin/AdminVideos";
import AdminAnalytics from "../pages/admin/AdminAnalytics";
import AdminSettings from "../pages/admin/AdminSettings";
import AdminProcessingJobs from "../pages/admin/AdminProcessingJobs";


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =====================================================
            GENERAL DASHBOARD
            ALL AUTHENTICATED USERS
        ===================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
                "educator",
                "learner",
                "admin",
              ]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            CREATOR / CONTENT CREATOR
        ===================================================== */}

        <Route
          path="/creator"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
              ]}
            >
              <CreatorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/creator/videos"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
              ]}
            >
              <CreatorVideos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/creator/analytics"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
              ]}
            >
              <CreatorAnalytics />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            EDUCATOR
        ===================================================== */}

        <Route
          path="/educator"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <EducatorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/create-course"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <CreateCourse />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/my-courses"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <MyCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/upload-lecture"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <UploadLecture />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/my-lectures"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <MyLectures />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/classrooms"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <Classrooms />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/transcripts"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <EducatorTranscripts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/summaries"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <EducatorSummaries />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/key-moments"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <EducatorKeyMoments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/analytics"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <EducatorAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/reports"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <EducatorReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/insights"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <EducatorInsights />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/student-engagement"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <StudentEngagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/educator/profile"
          element={
            <ProtectedRoute
              allowedRoles={["educator"]}
            >
              <Profile />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            LEARNER
        ===================================================== */}

        <Route
          path="/learner"
          element={
            <ProtectedRoute
              allowedRoles={["learner"]}
            >
              <LearnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner/videos"
          element={
            <ProtectedRoute
              allowedRoles={["learner"]}
            >
              <LearnerVideos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner/transcripts"
          element={
            <ProtectedRoute
              allowedRoles={["learner"]}
            >
              <LearnerTranscripts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner/summaries"
          element={
            <ProtectedRoute
              allowedRoles={["learner"]}
            >
              <LearnerSummaries />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner/key-moments"
          element={
            <ProtectedRoute
              allowedRoles={["learner"]}
            >
              <LearnerKeyMoments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learner/analytics"
          element={
            <ProtectedRoute
              allowedRoles={["learner"]}
            >
              <LearnerAnalytics />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            ADMIN
        ===================================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/videos"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <AdminVideos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/processing-jobs"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <AdminProcessingJobs />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            UPLOAD
            CREATOR + CONTENT CREATOR + EDUCATOR + ADMIN
        ===================================================== */}

        <Route
          path="/upload"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
                "educator",
                "admin",
              ]}
            >
              <Upload />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            PROCESSING
            CREATOR + CONTENT CREATOR + EDUCATOR + ADMIN
        ===================================================== */}

        <Route
          path="/processing"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
                "educator",
                "admin",
              ]}
            >
              <Processing />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            MY VIDEOS
            ALL USERS
        ===================================================== */}

        <Route
          path="/videos"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
                "educator",
                "learner",
                "admin",
              ]}
            >
              <MyVideos />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            SUMMARY
            ALL USERS
        ===================================================== */}

        <Route
          path="/summary"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
                "educator",
                "learner",
                "admin",
              ]}
            >
              <Summary />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            TRANSCRIPT
            ALL USERS
        ===================================================== */}

        <Route
          path="/transcript"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
                "educator",
                "learner",
                "admin",
              ]}
            >
              <Transcript />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            KEY MOMENTS
            ALL USERS
        ===================================================== */}

        <Route
          path="/keymoments"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
                "educator",
                "learner",
                "admin",
              ]}
            >
              <KeyMoments />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            ANALYTICS
            ALL USERS
        ===================================================== */}

        <Route
          path="/analytics"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
                "educator",
                "learner",
                "admin",
              ]}
            >
              <Analytics />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            SETTINGS
            ALL USERS
        ===================================================== */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute
              allowedRoles={[
                "creator",
                "content_creator",
                "educator",
                "learner",
                "admin",
              ]}
            >
              <Settings />
            </ProtectedRoute>
          }
        />


        {/* =====================================================
            FALLBACK
        ===================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;