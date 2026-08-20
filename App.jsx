import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Footer from './components/Footer.jsx';
import { FiMenu, FiX } from 'react-icons/fi';
import Intro from './pages/Intro.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Upload from './pages/Upload.jsx';
import MyVideos from './pages/MyVideos.jsx';
import VideoDetail from './pages/VideoDetail.jsx';
import Transcript from './pages/Transcript.jsx';
import Summary from './pages/Summary.jsx';
import KeyMoments from './pages/KeyMoments.jsx';
import Analytics from './pages/Analytics.jsx';
import Bookmarks from './pages/Bookmarks.jsx';
import QuizPage from './pages/QuizPage.jsx';
import Notes from './pages/Notes.jsx';
import LearningMaterials from './pages/LearningMaterials.jsx';
import Classroom from './pages/Classroom.jsx';
import ClassroomAnalytics from './pages/ClassroomAnalytics.jsx';
import SharedSummary from './pages/SharedSummary.jsx';
import SharedLearningMaterial from './pages/SharedLearningMaterial.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';
import Forbidden from './pages/Forbidden.jsx';
import Browse from './pages/Browse.jsx';
import History from './pages/History.jsx';
import CreatorHistory from './pages/CreatorHistory.jsx';


function MainLayout() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed full height */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed left-0 top-0 h-screen z-50 transition-transform duration-300`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Navbar — fixed top, aligned right of sidebar */}
      <div className="fixed top-0 left-0 lg:left-64 right-0 z-30">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      </div>

      {/* Content area — below navbar, right of sidebar */}
      <main className="ml-0 lg:ml-64 pt-16 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <Routes>
      {/* Intro splash page — full screen, no layout */}
      <Route path="/" element={<Intro />} />

      {/* All other routes inside the main layout */}
      <Route element={<MainLayout />}>
        <Route path="/home" element={<Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/upload" element={isAuthenticated ? <Upload /> : <Navigate to="/login" />} />
        <Route path="/my-videos" element={isAuthenticated ? <MyVideos /> : <Navigate to="/login" />} />
        <Route
          path="/browse"
          element={isAuthenticated ? (user?.role === 'Learner' ? <Browse /> : <Navigate to="/forbidden" />) : <Navigate to="/login" />}
        />
        <Route
          path="/watch-history/creator"
          element={isAuthenticated ? (user?.role === 'Content Creator' ? <CreatorHistory /> : <Navigate to="/forbidden" />) : <Navigate to="/login" />}
        />
        <Route
          path="/history"
          element={isAuthenticated ? (user?.role === 'Learner' ? <History /> : <Navigate to="/forbidden" />) : <Navigate to="/login" />}
        />
        <Route path="/videos/:videoId" element={isAuthenticated ? <VideoDetail /> : <Navigate to="/login" />} />
        <Route path="/videos/:videoId/transcript" element={isAuthenticated ? <Transcript /> : <Navigate to="/login" />} />
        <Route path="/videos/:videoId/summary" element={isAuthenticated ? <Summary /> : <Navigate to="/login" />} />
        <Route path="/videos/:videoId/key-moments" element={isAuthenticated ? <KeyMoments /> : <Navigate to="/login" />} />
        <Route path="/videos/:videoId/analytics" element={isAuthenticated ? <Analytics /> : <Navigate to="/login" />} />
        <Route path="/classrooms/:videoId" element={isAuthenticated ? <Classroom /> : <Navigate to="/login" />} />
        <Route path="/videos/:videoId/quiz" element={isAuthenticated ? <QuizPage /> : <Navigate to="/login" />} />
        <Route path="/videos/:videoId/notes" element={isAuthenticated ? <Notes /> : <Navigate to="/login" />} />
        <Route path="/videos/:videoId/materials" element={isAuthenticated ? <LearningMaterials /> : <Navigate to="/login" />} />
        <Route path="/share/:token" element={<SharedSummary />} />
        <Route path="/study-notes/:token" element={<SharedLearningMaterial />} />
        <Route
          path="/classroom-analytics"
          element={
            isAuthenticated && (user?.role === 'Educator' || user?.role === 'Administrator')
              ? <ClassroomAnalytics />
              : <Navigate to="/forbidden" />
          }
        />
        <Route path="/bookmarks" element={isAuthenticated ? <Bookmarks /> : <Navigate to="/login" />} />
        <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
        <Route
          path="/admin"
          element={isAuthenticated && user?.role === 'Administrator' ? <AdminDashboard /> : <Navigate to="/forbidden" />}
        />
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
