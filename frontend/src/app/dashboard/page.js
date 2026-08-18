"use client";

import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import UploadVideo from "@/components/UploadVideo";
import Transcripts from "@/components/Transcripts";
import Summaries from "@/components/Summaries";
import KeyMoments from "@/components/KeyMoments";
import Analytics from "@/components/Analytics";
import History from "@/components/History";
import StatDetail from "@/components/StatDetail";
import GlobalSearch from "@/components/GlobalSearch";
import Bookmarks from "@/components/Bookmarks";
import AdminDashboard from "@/components/AdminDashboard";
import LearningMaterials from "@/components/LearningMaterials";
import ClassroomAnalytics from "@/components/ClassroomAnalytics";
import VideoDetail from "@/components/VideoDetail";
import TrendingTopics from "@/components/TrendingTopics";
import VideoComparison from "@/components/VideoComparison";
import OnboardingTour from "@/components/OnboardingTour";
function DashboardShell() {
  const [active, setActive] = useState("Dashboard");
  const [statType, setStatType] = useState(null);
  const [viewingVideoId, setViewingVideoId] = useState(null);
  const [username, setUsername] = useState("Guest");
  const [role, setRole] = useState("learner");
  const [email, setEmail] = useState("");
  const [checked, setChecked] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem("clipmind_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const storedUser = localStorage.getItem("clipmind_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUsername(parsed.username || "Guest");
        setRole(parsed.role || "learner");
        setEmail(parsed.email || "");
      } catch (e) {
        setUsername("Guest");
      }
    }
    setChecked(true);
  }, []);

  function handleSelect(name) {
    setStatType(null); // leave any stat-detail view when navigating via sidebar
    setViewingVideoId(null);
    setActive(name);
  }

  function openVideo(videoId) {
    setViewingVideoId(videoId);
  }
  function renderContent() {
    if (role === "admin" && active === "Dashboard") {
      return <AdminDashboard />;
    }
    if (viewingVideoId) {
      return (
        <VideoDetail
          videoId={viewingVideoId}
          role={role}
          onBack={() => setViewingVideoId(null)}
          onNavigate={(tab) => {
            setViewingVideoId(null);
            setActive(tab);
          }}
        />
      );
    }
    if (statType) {
      return <StatDetail type={statType} onBack={() => setStatType(null)} onOpenVideo={openVideo} />;
    }
    if (active === "Dashboard")
      return (
        <Dashboard
          username={username}
          role={role}
          onGoToUpload={() => setActive("Upload Video")}
          onOpenStat={(type) => setStatType(type)}
          onNavigate={(tab) => setActive(tab)}
          onOpenVideo={openVideo}
        />
      );
    if (active === "Upload Video") return <UploadVideo onNavigate={(tab) => setActive(tab)} />;
    if (active === "Transcripts") return <Transcripts role={role} />;
    if (active === "Summaries") return <Summaries role={role} />;
    if (active === "Key Moments") return <KeyMoments role={role} />;
    if (active === "Analytics") return <Analytics />;
    if (active === "History") return <History onOpenVideo={openVideo} />;
    if (active === "Search") return <GlobalSearch />;
    if (active === "Bookmarks") return <Bookmarks />;
    if (active === "Learning Materials") return <LearningMaterials role={role} />;
    if (active === "Classroom Analytics") return <ClassroomAnalytics />;
    if (active === "Trending Topics") return <TrendingTopics />;
    if (active === "Compare Videos") return <VideoComparison />;
    return (
      <Dashboard
        username={username}
        role={role}
        onGoToUpload={() => setActive("Upload Video")}
        onOpenStat={(type) => setStatType(type)}
        onNavigate={(tab) => setActive(tab)}
        onOpenVideo={openVideo}
      />
    );
  }

  if (!checked) return null;

  return (
    <div className={`flex min-h-screen transition-colors ${isDark ? "bg-[#0F1117]" : "bg-[#F5F5FA]"}`}>
      <Sidebar active={active} onSelect={handleSelect} username={username} role={role} email={email} />
      <main className={`flex-1 p-8 transition-colors ${isDark ? "text-gray-100" : "text-gray-900"}`}>
        {renderContent()}
      </main>
      <OnboardingTour role={role} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <DashboardShell />
    </ThemeProvider>
  );
}