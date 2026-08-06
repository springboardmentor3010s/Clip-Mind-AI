import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";

import ProtectedRoute from "../components/ProtectedRoute";

// Creator
import CreatorDashboard from "../pages/creator/CreatorDashboard";
import UploadContent from "../pages/shared/UploadContent";
import Processing from "../pages/creator/Processing";
import CreatorVideos from "../pages/creator/Videos";
import Transcript from "../pages/creator/Transcript";
import Summary from "../pages/creator/Summary";
import Topics from "../pages/creator/Topics";
import Quiz from "../pages/creator/Quiz";
import Flashcards from "../pages/creator/Flashcards";
import KeyMoments from "../pages/creator/KeyMoments";
import CreatorAnalytics from "../pages/creator/Analytics";
import Profile from "../pages/creator/Profile";

// Educator
import EducatorDashboard from "../pages/educator/EducatorDashboard";
import Courses from "../pages/educator/Courses";
import Students from "../pages/educator/Students";
import EducatorAnalytics from "../pages/educator/Analytics";
import EducatorProfile from "../pages/educator/Profile";
import CreateCourse from "../pages/educator/CreateCourse";
import EditCourse from "../pages/educator/EditCourse";
import UploadLecture from "../pages/educator/UploadLecture";
import MyLectures from "../pages/educator/MyLectures";
import LearningMaterials from "../pages/educator/LearningMaterials";
import TranscriptEditor from "../pages/educator/TranscriptEditor";
import SummaryEditor from "../pages/educator/SummaryEditor";
import MyCourses from "../pages/educator/MyCourses";
import CourseDetails from "../pages/educator/CourseDetails";
import StudentEngagement from "../pages/educator/StudentEngagement";
import LectureViewer from "../components/LectureViewer";
import Transcripts from "../pages/educator/Transcripts";
import Summaries from "../pages/educator/Summaries";
// Learner
import LearnerDashboard from "../pages/learner/LearnerDashboard";
import LearnerCourses from "../pages/learner/Courses";
import Lecture from "../pages/learner/Lecture";

// Admin
import AdminDashboard from "../pages/admin/AdminDashboard";

function AppRoutes() {
  return (
    <Routes>

      {/* ================= PUBLIC ================= */}

      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ================= CREATOR ================= */}

      <Route
        path="/creator-dashboard"
        element={
          <ProtectedRoute allowedRole="creator">
            <CreatorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/upload-content"
        element={
          <ProtectedRoute allowedRole="creator">
            <UploadContent role="creator" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/processing"
        element={
          <ProtectedRoute allowedRole="creator">
            <Processing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/videos"
        element={
          <ProtectedRoute allowedRole="creator">
            <CreatorVideos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/profile"
        element={
          <ProtectedRoute allowedRole="creator">
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/transcript/:videoId"
        element={
          <ProtectedRoute allowedRole="creator">
            <Transcript />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/summary/:videoId"
        element={
          <ProtectedRoute allowedRole="creator">
            <Summary />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/topics/:videoId"
        element={
          <ProtectedRoute allowedRole="creator">
            <Topics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/quiz/:videoId"
        element={
          <ProtectedRoute allowedRole="creator">
            <Quiz />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/flashcards/:videoId"
        element={
          <ProtectedRoute allowedRole="creator">
            <Flashcards />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/keymoments/:videoId"
        element={
          <ProtectedRoute allowedRole="creator">
            <KeyMoments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/creator/analytics/:videoId"
        element={
          <ProtectedRoute allowedRole="creator">
            <CreatorAnalytics />
          </ProtectedRoute>
        }
      />

      {/* ================= EDUCATOR ================= */}

      <Route
        path="/educator-dashboard"
        element={
          <ProtectedRoute allowedRole="educator">
            <EducatorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/create-course"
        element={
          <ProtectedRoute allowedRole="educator">
            <CreateCourse />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/edit-course/:id"
        element={
          <ProtectedRoute allowedRole="educator">
            <EditCourse />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/my-courses"
        element={
          <ProtectedRoute allowedRole="educator">
            <MyCourses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/course/:id"
        element={
          <ProtectedRoute allowedRole="educator">
            <CourseDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/upload-lecture"
        element={
          <ProtectedRoute allowedRole="educator">
            <UploadLecture />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/lectures"
        element={
          <ProtectedRoute allowedRole="educator">
            <MyLectures />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/materials"
        element={
          <ProtectedRoute allowedRole="educator">
            <LearningMaterials />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/transcript/:videoId"
        element={
          <ProtectedRoute allowedRole="educator">
            <TranscriptEditor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/summary/:videoId"
        element={
          <ProtectedRoute allowedRole="educator">
            <SummaryEditor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/courses"
        element={
          <ProtectedRoute allowedRole="educator">
            <Courses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/students"
        element={
          <ProtectedRoute allowedRole="educator">
            <Students />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/analytics"
        element={
          <ProtectedRoute allowedRole="educator">
            <EducatorAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/engagement"
        element={
          <ProtectedRoute allowedRole="educator">
            <StudentEngagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/educator/profile"
        element={
          <ProtectedRoute allowedRole="educator">
            <EducatorProfile />
          </ProtectedRoute>
        }
      />

      {/* ================= LEARNER ================= */}

      <Route
        path="/learner-dashboard"
        element={
          <ProtectedRoute allowedRole="learner">
            <LearnerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/learner/courses"
        element={
          <ProtectedRoute allowedRole="learner">
            <LearnerCourses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/learner/lecture/:videoId"
        element={
          <ProtectedRoute allowedRole="learner">
            <Lecture />
          </ProtectedRoute>
        }
      />

      <Route
    path="/educator/lecture/:videoId"
    element={
        <ProtectedRoute allowedRole="educator">
            <LectureViewer />
        </ProtectedRoute>
    }
/>

<Route
    path="/educator/transcripts"
    element={
        <ProtectedRoute allowedRole="educator">
            <Transcripts />
        </ProtectedRoute>
    }
/>

<Route
    path="/educator/summaries"
    element={
        <ProtectedRoute allowedRole="educator">
            <Summaries />
        </ProtectedRoute>
    }
/>

      {/* ================= ADMIN ================= */}

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default AppRoutes;