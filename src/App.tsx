import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext';

import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingLayout } from './layouts/LandingLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { EducatorLayout } from './layouts/EducatorLayout';
import { CreatorLayout } from './layouts/CreatorLayout';
import { BookmarksPage } from './pages/BookmarksPage';
import { FileUploader } from './components/FileUploader';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { LibraryPage } from './pages/LibraryPage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { TranscriptsPage } from './pages/TranscriptsPage';
import { SummariesPage } from './pages/SummariesPage';
import { KeyMomentsPage } from './pages/KeyMomentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminPage } from './pages/AdminPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminVideosPage } from './pages/AdminVideosPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { AdminActivityPage } from './pages/AdminActivityPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { EducatorDashboardPage } from './pages/EducatorDashboardPage';
import EducatorClassroomPage from './pages/EducatorClassroomPage';
import { EducatorContentPage } from './pages/EducatorContentPage';
import { EducatorStudentsPage } from './pages/EducatorStudentsPage';
import { EducatorAssignmentsPage } from './pages/EducatorAssignmentsPage';
import { EducatorAnalyticsPage } from './pages/EducatorAnalyticsPage';
import { EducatorProfilePage } from './pages/EducatorProfilePage';
import { CreatorVideosPage } from './pages/CreatorVideosPage';
import { CreatorProcessingPage } from './pages/CreatorProcessingPage';
import { CreatorUploadPage } from './pages/CreatorUploadPage';
import LearnerClassroomPage from './pages/LearnerClassroomPage';

/* =========================================================
   PATH → TAB
========================================================= */

function getTabFromPath(path: string): string {
  const cleanPath =
    path.toLowerCase().replace(/\/$/, '') || '/';

  if (
    cleanPath === '/' ||
    cleanPath === '/landing'
  ) {
    return 'landing';
  }

  if (cleanPath === '/login') {
    return 'login';
  }

  if (
    cleanPath === '/register' ||
    cleanPath === '/signup'
  ) {
    return 'register';
  }

  if (
    cleanPath === '/admin-login' ||
    cleanPath === '/administrator-login'
  ) {
    return 'admin-login';
  }

  /* ================= NORMAL USER ROUTES ================= */

  if (cleanPath === '/dashboard') {
    return 'dashboard';
  }

  if (cleanPath === '/upload') {
    return 'upload';
  }

  if (
    cleanPath === '/library' ||
    cleanPath === '/dashboard/library'
  ) {
    return 'library';
  }

  if (
    cleanPath === '/transcripts' ||
    cleanPath === '/dashboard/transcripts'
  ) {
    return 'transcripts';
  }

  if (
    cleanPath === '/summaries' ||
    cleanPath === '/dashboard/summaries'
  ) {
    return 'summaries';
  }

  if (cleanPath === '/creator/key-moments') {
    return 'creator-key-moments';
  }
  
  if (cleanPath === '/bookmarks' || cleanPath === '/dashboard/bookmarks') {
    return 'bookmarks';
  }

  if (cleanPath === '/creator/bookmarks') {
    return 'creator-bookmarks';
  }
  
  if (cleanPath === '/creator/analytics') {
    return 'creator-analytics';
  }
  if (
    cleanPath === '/settings' ||
    cleanPath === '/profile' ||
    cleanPath === '/dashboard/profile' ||
    cleanPath === '/dashboard/settings'
  ) {
    return 'settings';
  }

  /* ================= CONTENT CREATOR ROUTES ================= */

  if (
    cleanPath === '/creator' ||
    cleanPath === '/dashboard/creator'
  ) {
    return 'creator';
  }

  if (cleanPath === '/creator/videos') {
    return 'creator-videos';
  }

  if (cleanPath === '/creator/upload') {
    return 'creator-upload';
  }

  if (cleanPath === '/creator/processing') {
    return 'creator-processing';
  }

  if (cleanPath === '/creator/transcripts') {
    return 'creator-transcripts';
  }

  if (cleanPath === '/creator/summaries') {
    return 'creator-summaries';
  }

  if (cleanPath === '/creator/key-moments') {
    return 'creator-key-moments';
  }

  if (cleanPath === '/creator/analytics') {
    return 'creator-analytics';
  }

  if (cleanPath === '/creator/profile') {
    return 'creator-profile';
  }

  /* ================= EDUCATOR ROUTES ================= */

  if (
    cleanPath === '/educator' ||
    cleanPath === '/dashboard/educator'
  ) {
    return 'educator';
  }

  if (
    cleanPath === '/educator/classroom' ||
    cleanPath === '/dashboard/educator/classroom'
  ) {
    return 'educator-classroom';
  }

  if (
    cleanPath === '/educator/content' ||
    cleanPath === '/dashboard/educator/content'
  ) {
    return 'educator-content';
  }

  if (
    cleanPath === '/educator/students' ||
    cleanPath === '/dashboard/educator/students'
  ) {
    return 'educator-students';
  }

  if (
    cleanPath === '/educator/assignments' ||
    cleanPath === '/dashboard/educator/assignments'
  ) {
    return 'educator-assignments';
  }

  if (
    cleanPath === '/educator/analytics' ||
    cleanPath === '/dashboard/educator/analytics'
  ) {
    return 'educator-analytics';
  }

  if (
    cleanPath === '/educator/profile' ||
    cleanPath === '/dashboard/educator/profile'
  ) {
    return 'educator-profile';
  }

  /* ================= LEARNER ROUTES ==============- */
  if (
    cleanPath === '/classrooms' ||
    cleanPath === '/dashboard/classrooms' ||
    cleanPath === '/my-classes' ||
    cleanPath === '/dashboard/my-classes' ||
    cleanPath === '/learner/classrooms'
  ) {
    return 'learner-classrooms';
  }

  /* ================= ADMIN ROUTES ================= */

  if (
    cleanPath === '/admin' ||
    cleanPath === '/dashboard/admin'
  ) {
    return 'admin';
  }

  if (cleanPath === '/admin/users') {
    return 'admin-users';
  }

  if (cleanPath === '/admin/videos') {
    return 'admin-videos';
  }

  if (cleanPath === '/admin/analytics') {
    return 'admin-analytics';
  }

  if (cleanPath === '/admin/activity') {
    return 'admin-activity';
  }

  if (cleanPath === '/admin/settings') {
    return 'admin-settings';
  }

  /* ================= VIDEO DETAIL ================= */

  if (
    cleanPath.startsWith('/detail') ||
    cleanPath.startsWith('/dashboard/detail')
  ) {
    return 'detail';
  }

  return 'landing';
}


/* =========================================================
   TAB → PATH
========================================================= */

function getPathFromTab(tab: string): string {
  switch (tab) {

    case 'landing':
      return '/';

    case 'login':
      return '/login';

    case 'register':
      return '/signup';

    case 'admin-login':
      return '/admin-login';

    /* Normal user */

    case 'dashboard':
      return '/dashboard';

    case 'upload':
      return '/upload';

    case 'library':
      return '/library';

    case 'transcripts':
      return '/transcripts';

    case 'summaries':
      return '/summaries';
      case 'creator-key-moments':
        return '/creator/key-moments';
      
      case 'creator-bookmarks':
        return '/creator/bookmarks';
      
      case 'creator-analytics':
        return '/creator/analytics';

    case 'settings':
      return '/settings';

    /* Content Creator */

    case 'creator':
      return '/creator';

    case 'creator-videos':
      return '/creator/videos';

    case 'creator-upload':
      return '/creator/upload';

    case 'creator-processing':
      return '/creator/processing';

    case 'creator-transcripts':
      return '/creator/transcripts';

    case 'creator-summaries':
      return '/creator/summaries';

    case 'creator-key-moments':
      return '/creator/key-moments';

    case 'creator-analytics':
      return '/creator/analytics';

    case 'creator-profile':
      return '/creator/profile';

    /* Educator */

    case 'educator':
      return '/educator';

    case 'educator-classroom':
      return '/educator/classroom';

    /* Learner */
    case 'learner-classrooms':
      return '/classrooms';

    case 'educator-content':
      return '/educator/content';

    case 'educator-students':
      return '/educator/students';

    case 'educator-assignments':
      return '/educator/assignments';

    case 'educator-analytics':
      return '/educator/analytics';

    case 'educator-profile':
      return '/educator/profile';

    /* Admin */

    case 'admin':
      return '/admin';

    case 'admin-users':
      return '/admin/users';

    case 'admin-videos':
      return '/admin/videos';

    case 'admin-analytics':
      return '/admin/analytics';

    case 'admin-activity':
      return '/admin/activity';

    case 'admin-settings':
      return '/admin/settings';

    case 'detail':
      return '/detail';

    default:
      return '/';
  }
}


/* =========================================================
   PROTECTED ROUTES
========================================================= */

function isProtectedRoute(tab: string): boolean {
  return [
    'dashboard',
    'upload',
    'library',
    'transcripts',
    'summaries',
    'key-moments',
    'analytics',
    'settings',
    'bookmarks',
    'detail',

    /* Content Creator */
    'creator',
    'creator-videos',
    'creator-upload',
    'creator-processing',
    'creator-transcripts',
    'creator-summaries',
    'creator-key-moments',
    'creator-bookmarks',
    'creator-analytics',
    'creator-profile',

    /* Educator */
    'educator',
    'educator-classroom',

    /* Learner */
    'learner-classrooms',

    /* Admin */
    'admin',
    'admin-users',
    'admin-videos',
    'admin-analytics',
    'admin-activity',
    'admin-settings',
  ].includes(tab);
}


/* =========================================================
   ADMIN ROUTES
========================================================= */

function isCreatorRoute(tab: string): boolean {
  return [
    'creator',
    'creator-videos',
    'creator-upload',
    'creator-processing',
    'creator-transcripts',
    'creator-summaries',
    'creator-key-moments',
    'creator-bookmarks',
    'creator-analytics',
    'creator-profile',
  ].includes(tab);
}


function isEducatorRoute(tab: string): boolean {
  return [
    'educator',
    'educator-classroom',
    'educator-content',
    'educator-students',
    'educator-assignments',
    'educator-analytics',
    'educator-profile',
  ].includes(tab);
}


function isAdminRoute(tab: string): boolean {
  return [
    'admin',
    'admin-users',
    'admin-videos',
    'admin-analytics',
    'admin-activity',
    'admin-settings',
  ].includes(tab);
}


/* =========================================================
   MAIN LAYOUT
========================================================= */

function MainLayout() {

  const {
    isAuthenticated,
    isLoading,
    user,
  } = useAuth();

  const [
    currentTab,
    setCurrentTab,
  ] = useState<string>(() =>
    getTabFromPath(window.location.pathname)
  );

  const [
    selectedVideoId,
    setSelectedVideoId,
  ] = useState<string | null>(null);

  const [
    selectedClassroomId,
    setSelectedClassroomId,
  ] = useState<string | null>(null);

  const [
    showUploadModal,
    setShowUploadModal,
  ] = useState(false);


  /* =======================================================
     NAVIGATION
  ======================================================= */

  const handleNavigate = useCallback(
    (
      tab: string,
      videoId?: string
    ) => {

      if (
        tab === 'detail' &&
        videoId
      ) {
        setSelectedVideoId(videoId);
      }

      setCurrentTab(tab);

      const targetPath =
        getPathFromTab(tab);

      if (
        window.location.pathname !==
        targetPath
      ) {
        window.history.pushState(
          {},
          '',
          targetPath
        );
      }

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    },
    []
  );


  /* =======================================================
     BROWSER BACK / FORWARD
  ======================================================= */

  useEffect(() => {

    const handlePopState = () => {

      setCurrentTab(
        getTabFromPath(
          window.location.pathname
        )
      );
    };

    window.addEventListener(
      'popstate',
      handlePopState
    );

    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState
      );
    };

  }, []);


  /* =======================================================
     AUTH ROUTE GUARD
  ======================================================= */

  useEffect(() => {

    if (isLoading) {
      return;
    }


    /* -------------------------------------------------------
       Unauthenticated user trying to access protected page
    ------------------------------------------------------- */

    if (
      !isAuthenticated &&
      isProtectedRoute(currentTab)
    ) {

      if (isAdminRoute(currentTab)) {

        setCurrentTab('admin-login');

        window.history.replaceState(
          {},
          '',
          '/admin-login'
        );

      } else {

        setCurrentTab('login');

        window.history.replaceState(
          {},
          '',
          '/login'
        );
      }

      return;
    }


    /* -------------------------------------------------------
       Authenticated user on login/register
    ------------------------------------------------------- */

    if (
      isAuthenticated &&
      (
        currentTab === 'login' ||
        currentTab === 'register'
      )
    ) {

      if (
        user?.role ===
        'ADMINISTRATOR'
      ) {

        setCurrentTab('admin');

        window.history.replaceState(
          {},
          '',
          '/admin'
        );

      } else {

        setCurrentTab('dashboard');

        window.history.replaceState(
          {},
          '',
          '/dashboard'
        );
      }

      return;
    }


    /* -------------------------------------------------------
       Administrator must not use normal user dashboard
    ------------------------------------------------------- */

    if (
      isAuthenticated &&
      user?.role === 'ADMINISTRATOR' &&
      (
        currentTab === 'dashboard' ||
        currentTab === 'upload' ||
        currentTab === 'library' ||
        currentTab === 'transcripts' ||
        currentTab === 'summaries' ||
        currentTab === 'key-moments' ||
        currentTab === 'analytics' ||
        currentTab === 'settings' ||
        currentTab === 'detail'
      )
    ) {

      setCurrentTab('admin');

      window.history.replaceState(
        {},
        '',
        '/admin'
      );

      return;
    }

  }, [
    isAuthenticated,
    isLoading,
    currentTab,
    user?.role,
  ]);


  /* =======================================================
     INITIAL AUTH LOADING
  ======================================================= */

  if (
    isLoading &&
    isProtectedRoute(currentTab)
  ) {

    return (
      <div className="min-h-screen bg-[#070B16] flex items-center justify-center">

        <div className="flex flex-col items-center gap-4">

          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />

          <p className="text-sm text-slate-400">
            Loading ClipMind AI...
          </p>

        </div>

      </div>
    );
  }


  /* =======================================================
     LANDING
  ======================================================= */

  if (currentTab === 'landing') {

    return (
      <LandingLayout
        onNavigate={handleNavigate}
      >

        <LandingPage
          onNavigate={handleNavigate}
          isAuthenticated={
            isAuthenticated
          }
        />

      </LandingLayout>
    );
  }


  /* =======================================================
     LOGIN
  ======================================================= */

  if (currentTab === 'login') {

    return (
      <AuthLayout>

        <LoginPage
          onNavigate={handleNavigate}
        />

      </AuthLayout>
    );
  }


  /* =======================================================
     REGISTER
  ======================================================= */

  if (currentTab === 'register') {

    return (
      <AuthLayout>

        <RegisterPage
          onNavigate={handleNavigate}
        />

      </AuthLayout>
    );
  }


  /* =======================================================
     ADMIN LOGIN
  ======================================================= */

  if (currentTab === 'admin-login') {

    return (
      <AuthLayout>

        <AdminLoginPage
          onNavigate={handleNavigate}
        />

      </AuthLayout>
    );
  }


  /* =======================================================
     EDUCATOR APPLICATION
  ======================================================= */

  if (isEducatorRoute(currentTab)) {

    const isEducator =
      user?.role === 'EDUCATOR';

    if (!isEducator) {
      return (
        <ProtectedRoute
          onRedirectToLogin={() =>
            handleNavigate('login')
          }
        >
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenUploadModal={() =>
              setShowUploadModal(true)
            }
          />
        </ProtectedRoute>
      );
    }

    return (
      <ProtectedRoute
        onRedirectToLogin={() =>
          handleNavigate('login')
        }
      >
        <EducatorLayout
          currentTab={currentTab}
          onNavigate={handleNavigate}
        >

          {currentTab === 'educator' && (
            <EducatorDashboardPage
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'educator-classroom' && (
            <EducatorClassroomPage
              onNavigate={handleNavigate}
              onOpenClassroom={(classroomId) => {
                setSelectedClassroomId(classroomId);
                handleNavigate('educator-content');
              }}
            />
          )}

          {currentTab === 'educator-content' && (
            <EducatorContentPage
              classroomId={selectedClassroomId}
            />
          )}

          {currentTab === 'educator-students' && (
            <EducatorStudentsPage />
          )}

          {currentTab === 'educator-assignments' && (
            <EducatorAssignmentsPage />
          )}

          {currentTab === 'educator-analytics' && (
            <EducatorAnalyticsPage />
          )}

          {currentTab === 'educator-profile' && (
            <EducatorProfilePage />
          )}

        </EducatorLayout>
      </ProtectedRoute>
    );
  }


  /* =======================================================
     CONTENT CREATOR APPLICATION
  ======================================================= */

  if (isCreatorRoute(currentTab)) {

    const isCreator =
      user?.role === 'CONTENT_CREATOR' ||
      user?.role === 'CONTENT CREATOR' ||
      user?.role === 'content\_creator';

    if (!isCreator) {
      return (
        <ProtectedRoute
          onRedirectToLogin={() =>
            handleNavigate('login')
          }
        >
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenUploadModal={() =>
              setShowUploadModal(true)
            }
          />
        </ProtectedRoute>
      );
    }

    return (
      <ProtectedRoute
        onRedirectToLogin={() =>
          handleNavigate('login')
        }
      >
        <CreatorLayout
          currentTab={currentTab}
          onNavigate={handleNavigate}
        >

          {currentTab === 'creator' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenUploadModal={() =>
                setShowUploadModal(true)
              }
            />
          )}

          {currentTab === 'creator-videos' && (
            <CreatorVideosPage
              onNavigate={handleNavigate}
              onOpenUploadModal={() =>
                setShowUploadModal(true)
              }
            />
          )}

          {currentTab === 'creator-upload' && (
            <CreatorUploadPage
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'creator-processing' && (
            <CreatorProcessingPage
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'creator-transcripts' && (
            <TranscriptsPage
              initialVideoId={
                selectedVideoId || undefined
              }
            />
          )}

          {currentTab === 'creator-summaries' && (
            <SummariesPage
              initialVideoId={
                selectedVideoId || undefined
              }
            />
          )}

          {currentTab === 'creator-key-moments' && (
            <KeyMomentsPage
              initialVideoId={
                selectedVideoId || undefined
              }
            />
          )}
          {currentTab === 'creator-bookmarks' && (
  <BookmarksPage />
)}

          {currentTab === 'creator-analytics' && (
            <AnalyticsPage />
          )}

          {currentTab === 'creator-profile' && (
            <ProfileSettingsPage />
          )}

        </CreatorLayout>
      </ProtectedRoute>
    );
  }


  /* =======================================================
     ADMIN APPLICATION
  ======================================================= */

  if (
    isAdminRoute(currentTab)
  ) {

    return (
      <ProtectedRoute
        onRedirectToLogin={() =>
          handleNavigate('admin-login')
        }
      >
<AdminLayout
  currentTab={currentTab}
  onNavigate={handleNavigate}
>
{currentTab === 'admin' && (
  <AdminPage />
)}

{currentTab === 'admin-users' && (
  <AdminUsersPage />
)}

{currentTab === 'admin-videos' && (
  <AdminVideosPage />
)}

{currentTab === 'admin-analytics' && (
  <AdminAnalyticsPage />
)}

{currentTab === 'admin-activity' && (
  <AdminActivityPage />
)}

{currentTab === 'admin-settings' && (
  <AdminSettingsPage />
)}
</AdminLayout>
      </ProtectedRoute>
    );
  }


  /* =======================================================
     NORMAL USER APPLICATION
  ======================================================= */

  if (
    isProtectedRoute(currentTab)
  ) {

    return (
      <ProtectedRoute
        onRedirectToLogin={() =>
          handleNavigate('login')
        }
      >

        <DashboardLayout
          currentTab={currentTab}
          onNavigate={handleNavigate}
          onOpenUploadModal={() =>
            setShowUploadModal(true)
          }
        >

          {currentTab === 'learner-classrooms' && (
            <LearnerClassroomPage
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onOpenUploadModal={() =>
                setShowUploadModal(true)
              }
            />
          )}

          {currentTab === 'upload' && (
            <UploadPage
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'library' && (
            <LibraryPage
              onNavigate={handleNavigate}
              onOpenUploadModal={() =>
                setShowUploadModal(true)
              }
            />
          )}

          {currentTab === 'transcripts' && (
            <TranscriptsPage
              initialVideoId={
                selectedVideoId ||
                undefined
              }
            />
          )}

          {currentTab === 'summaries' && (
            <SummariesPage
              initialVideoId={
                selectedVideoId ||
                undefined
              }
            />
          )}

          {currentTab === 'key-moments' && (
            <KeyMomentsPage
              initialVideoId={
                selectedVideoId ||
                undefined
              }
            />
          )}

          {currentTab === 'detail' &&
            selectedVideoId && (
              <VideoDetailPage
                videoId={
                  selectedVideoId
                }
                onBack={() =>
                  handleNavigate(
                    user?.role === 'CONTENT_CREATOR'
                      ? 'creator-videos'
                      : 'library'
                  )
                }
              />
            )}

          {currentTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {currentTab === 'bookmarks' && (
            <BookmarksPage />
          )}

          {currentTab === 'settings' && (
            <ProfileSettingsPage />
          )}

        </DashboardLayout>


        {/* Upload modal */}

        {showUploadModal &&
          isAuthenticated && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">

              <FileUploader
                onSuccess={(uploadedVideo) => {

                  setShowUploadModal(false);

                  handleNavigate(
                    'detail',
                    uploadedVideo.id
                  );

                }}

                onClose={() =>
                  setShowUploadModal(false)
                }
              />

            </div>
          )}

      </ProtectedRoute>
    );
  }


  /* =======================================================
     FALLBACK
  ======================================================= */

  return (
    <LandingLayout
      onNavigate={handleNavigate}
    >

      <LandingPage
        onNavigate={handleNavigate}
        isAuthenticated={
          isAuthenticated
        }
      />

    </LandingLayout>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {

  return (
    <AuthProvider>

      <MainLayout />

    </AuthProvider>
  );
}