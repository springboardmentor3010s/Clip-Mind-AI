"use client";
import {
  FaVideo,
  FaSchool,
  FaUpload,
  FaBookOpen,
  FaFileAlt,
  FaRobot,
  FaFilm,
} from "react-icons/fa";

import Link from "next/link";
import { getActivityHistory } from "@/services/activityService";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/services/authService";
import { getMyVideos } from "@/services/videoService";
import { getUsageAnalytics } from "@/services/analyticsService";
import { getSystemAnalytics } from "@/services/adminService";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);

  const [activities, setActivities] = useState([]);

  const [analytics, setAnalytics] = useState(null);

  const [adminAnalytics, setAdminAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await getCurrentUser(token);

        setUser(response.user);

        if (response.user.role !== "LEARNER") {

  const myVideos = await getMyVideos();

  setVideos(myVideos);

}

if (response.user.role === "CONTENT_CREATOR") {

  try {

    const analyticsData = await getUsageAnalytics();

    setAnalytics(analyticsData);

  } catch (analyticsError) {

    console.error(
      "Failed to load dashboard analytics:",
      analyticsError
    );

  }

}

if (response.user.role === "ADMIN") {

  try {

    const adminAnalyticsData =
      await getSystemAnalytics();

    setAdminAnalytics(
      adminAnalyticsData
    );

  } catch (adminAnalyticsError) {

    console.error(
      "Failed to load administrator analytics:",
      adminAnalyticsError
    );

  }

}

const activityData = await getActivityHistory();

setActivities(activityData.slice(0, 5));

        localStorage.setItem(
          "user",
          JSON.stringify(response.user)
        );

        localStorage.setItem(
          "role",
          response.user.role
        );

      } catch (error) {

        console.error(error);

        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        router.replace("/login");

      } finally {

        setLoading(false);

      }
    }

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-xl">
        Loading Dashboard...
      </div>
    );
  }

  const getActivityIcon = (type) => {
  switch (type) {
  
    case "LOGIN":
  return "🔑";

case "LOGOUT":
  return "🚪";

case "REGISTER":
  return "👤";

case "PROFILE_UPDATED":
  return "✏️";

case "VIDEO_UPLOADED":
  return "🎥";

case "TRANSCRIPT_GENERATED":
  return "📄";

case "SUMMARY_GENERATED":
  return "🤖";

case "KEY_MOMENTS_DETECTED":
  return "⭐";

    default:
      return "📌";
  }
};

const isContentCreator =
  user?.role === "CONTENT_CREATOR";

const isEducator =
  user?.role === "EDUCATOR";

const isAdmin =
  user?.role === "ADMIN";

  return (
    <DashboardLayout>

      <div>

        <h1 className="text-4xl font-bold text-slate-800 mb-2">
          Welcome, {user?.full_name}
        </h1>

        <p className="text-slate-500 mb-8">
          Role: {user?.role?.replace(/_/g, " ")}
        </p>

        {/* Dashboard Cards */}

{isEducator && (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">

    {/* =====================================================
        UPLOADED VIDEOS
    ====================================================== */}

    <Link
      href="/key-moments"
      className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
    >
      <div className="p-7">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-2xl shadow-lg">
          <FaVideo />
        </div>

        <h3 className="mt-6 text-xl font-bold text-slate-800">
          Uploaded Videos
        </h3>

        <p className="mt-3 text-5xl font-extrabold text-violet-600">
          {videos.length}
        </p>

        <p className="mt-2 text-slate-500">
          Videos uploaded to ClipMind AI
        </p>

        <hr className="my-5" />

        <p className="text-violet-600 font-semibold">
          Manage Videos →
        </p>

      </div>
    </Link>


    {/* =====================================================
        MANAGE CLASSROOMS
    ====================================================== */}

    <Link
      href="/classrooms"
      className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
    >
      <div className="p-7">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">
          <FaSchool />
        </div>

        <h3 className="mt-6 text-xl font-bold text-slate-800">
          Manage Classrooms
        </h3>

        <p className="mt-3 text-lg font-semibold text-blue-600">
          Organize your classrooms
        </p>

        <p className="mt-2 text-slate-500">
          Manage learners and classroom content.
        </p>

        <hr className="my-5" />

        <p className="text-blue-600 font-semibold">
          Open Classrooms →
        </p>

      </div>
    </Link>


    {/* =====================================================
        UPLOAD LECTURE
    ====================================================== */}

    <Link
      href="/upload"
      className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
    >
      <div className="p-7">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl shadow-lg">
          <FaUpload />
        </div>

        <h3 className="mt-6 text-xl font-bold text-slate-800">
          Upload Lecture
        </h3>

        <p className="mt-3 text-lg font-semibold text-emerald-600">
          Add a new lecture
        </p>

        <p className="mt-2 text-slate-500">
          Upload educational videos for processing.
        </p>

        <hr className="my-5" />

        <p className="text-emerald-600 font-semibold">
          Upload Lecture →
        </p>

      </div>
    </Link>


    {/* =====================================================
        LEARNING MATERIALS
    ====================================================== */}

    <Link
      href="/learning-materials"
      className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
    >
      <div className="p-7">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl shadow-lg">
          <FaBookOpen />
        </div>

        <h3 className="mt-6 text-xl font-bold text-slate-800">
          Learning Materials
        </h3>

        <p className="mt-3 text-lg font-semibold text-amber-600">
          Create study resources
        </p>

        <p className="mt-2 text-slate-500">
          Generate structured material from transcripts.
        </p>

        <hr className="my-5" />

        <p className="text-amber-600 font-semibold">
          Open Learning Materials →
        </p>

      </div>
    </Link>

  </div>
)}

{/* ============================================================
    CONTENT CREATOR DASHBOARD CARDS
============================================================ */}

{isContentCreator && (

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">

    {/* =====================================================
        UPLOADED VIDEOS
    ====================================================== */}

    <Link
      href="/key-moments"
      className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
    >

      <div className="p-7">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-2xl shadow-lg">
          <FaVideo />
        </div>

        <h3 className="mt-6 text-xl font-bold text-slate-800">
          Uploaded Videos
        </h3>

        <p className="mt-3 text-5xl font-extrabold text-violet-600">
          {videos.length}
        </p>

        <p className="mt-2 text-slate-500">
          Videos uploaded to ClipMind AI
        </p>

        <hr className="my-5" />

        <p className="text-violet-600 font-semibold">
          Manage Videos →
        </p>

      </div>

    </Link>


    {/* =====================================================
        TRANSCRIPTS
    ====================================================== */}

    <Link
      href="/transcripts"
      className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
    >

      <div className="p-7">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white text-2xl shadow-lg">
          <FaFileAlt />
        </div>

        <h3 className="mt-6 text-xl font-bold text-slate-800">
          Transcript Segments
        </h3>

        <p className="mt-3 text-5xl font-extrabold text-sky-600">
          {analytics?.total_transcript_segments ?? 0}
        </p>

        <p className="mt-2 text-slate-500">
          AI-generated transcript segments
        </p>

        <hr className="my-5" />

        <p className="text-sky-600 font-semibold">
          View Transcripts →
        </p>

      </div>

    </Link>


    {/* =====================================================
        AI SUMMARIES
    ====================================================== */}

    <Link
      href="/summaries"
      className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
    >

      <div className="p-7">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl shadow-lg">
          <FaRobot />
        </div>

        <h3 className="mt-6 text-xl font-bold text-slate-800">
          AI Summaries
        </h3>

        <p className="mt-3 text-5xl font-extrabold text-emerald-600">
          {analytics?.total_summaries ?? 0}
        </p>

        <p className="mt-2 text-slate-500">
          AI-powered summaries
        </p>

        <hr className="my-5" />

        <p className="text-emerald-600 font-semibold">
          View Summaries →
        </p>

      </div>

    </Link>


    {/* =====================================================
        KEY MOMENTS
    ====================================================== */}

    <Link
      href="/key-moments"
      className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
    >

      <div className="p-7">

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl shadow-lg">
          <FaFilm />
        </div>

        <h3 className="mt-6 text-xl font-bold text-slate-800">
          Key Moments
        </h3>

        <p className="mt-3 text-5xl font-extrabold text-amber-600">
          {analytics?.total_key_moments ?? 0}
        </p>

        <p className="mt-2 text-slate-500">
          Explore important moments detected in your videos.
        </p>

        <hr className="my-5" />

        <p className="text-amber-600 font-semibold">
          View Key Moments →
        </p>

      </div>

    </Link>

  </div>

)}

{/* ============================================================
    ADMINISTRATOR DASHBOARD
============================================================ */}

{isAdmin && (

  <div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">

      {/* TOTAL USERS */}

      <Link
        href="/admin/users"
        className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
      >

        <div className="p-7">

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">
            👥
          </div>

          <h3 className="mt-6 text-xl font-bold text-slate-800">
            Total Users
          </h3>

          <p className="mt-3 text-5xl font-extrabold text-blue-600">
            {adminAnalytics?.users?.total ?? 0}
          </p>

          <p className="mt-2 text-slate-500">
            Users registered on ClipMind AI
          </p>

          <hr className="my-5" />

          <p className="text-blue-600 font-semibold">
            Manage Users →
          </p>

        </div>

      </Link>


      {/* TOTAL VIDEOS */}

      <Link
        href="/admin/content"
        className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
      >

        <div className="p-7">

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-2xl shadow-lg">
            🎥
          </div>

          <h3 className="mt-6 text-xl font-bold text-slate-800">
            Uploaded Videos
          </h3>

          <p className="mt-3 text-5xl font-extrabold text-violet-600">
            {adminAnalytics?.videos?.total ?? 0}
          </p>

          <p className="mt-2 text-slate-500">
            Videos uploaded across the platform
          </p>

          <hr className="my-5" />

          <p className="text-violet-600 font-semibold">
            Manage Content →
          </p>

        </div>

      </Link>


      {/* STORAGE */}

      <Link
        href="/admin/storage"
        className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
      >

        <div className="p-7">

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl shadow-lg">
            💾
          </div>

          <h3 className="mt-6 text-xl font-bold text-slate-800">
            Storage Used
          </h3>

          <p className="mt-3 text-5xl font-extrabold text-emerald-600">
            {adminAnalytics?.storage?.total_gb ?? 0}
          </p>

          <p className="mt-2 text-slate-500">
            GB of platform storage
          </p>

          <hr className="my-5" />

          <p className="text-emerald-600 font-semibold">
            View Storage →
          </p>

        </div>

      </Link>


      {/* AI PROCESSING */}

<Link
  href="/admin/ai-jobs"
  className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
>

  <div className="p-7">

    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl shadow-lg">
      🤖
    </div>

    <h3 className="mt-6 text-xl font-bold text-slate-800">
      AI Processing Jobs
    </h3>

    <p className="mt-3 text-5xl font-extrabold text-amber-600">
      {(adminAnalytics?.videos?.processing ?? 0) +
        (adminAnalytics?.videos?.completed ?? 0) +
        (adminAnalytics?.videos?.failed ?? 0)}
    </p>

    <p className="mt-2 text-slate-500">
      Total AI processing jobs
    </p>

    <hr className="my-5" />

    <p className="text-amber-600 font-semibold">
      Monitor AI Jobs →
    </p>

  </div>

</Link>

    </div>


    {/* ADMINISTRATION QUICK ACTIONS */}

    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 mt-10">

      <h2 className="text-3xl font-bold text-slate-900">
        Administration
      </h2>

      <p className="text-slate-500 mt-2 mb-8">
        Manage and monitor the ClipMind AI platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        <Link
          href="/admin/users"
          className="p-5 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all"
        >
          <h3 className="font-bold text-blue-700">
            Manage Users & Roles
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            Manage accounts, roles and status.
          </p>
        </Link>


        <Link
          href="/admin/activity"
          className="p-5 rounded-2xl bg-violet-50 hover:bg-violet-100 transition-all"
        >
          <h3 className="font-bold text-violet-700">
            Platform Activity
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            Monitor platform activity.
          </p>
        </Link>


        <Link
          href="/admin/analytics"
          className="p-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition-all"
        >
          <h3 className="font-bold text-emerald-700">
            System Analytics
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            View system statistics.
          </p>
        </Link>


        <Link
          href="/admin/settings"
          className="p-5 rounded-2xl bg-amber-50 hover:bg-amber-100 transition-all"
        >
          <h3 className="font-bold text-amber-700">
            Platform Settings
          </h3>

          <p className="text-sm text-slate-500 mt-2">
            Configure platform behavior.
          </p>
        </Link>

      </div>

    </div>

  </div>

)}

        {/* Recent Activity */}

<div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 mt-10">

  <div className="flex items-center justify-between mb-8">

    <div>

      <h2 className="text-3xl font-bold text-slate-900">
        Recent Activity
      </h2>

      <p className="text-slate-500 mt-2">
        Your latest actions in ClipMind AI.
      </p>

    </div>

    <Link
      href="/history"
      className="px-5 py-2 rounded-xl bg-violet-100 text-violet-700 font-semibold hover:bg-violet-200 transition-all duration-300"
    >
       View Full History
    </Link>

  </div>

  <div className="space-y-5">

  {activities.length === 0 ? (

    <div className="text-center py-10 text-slate-500">

      No recent activity found.

    </div>

  ) : (

    activities.map((activity) => (

      <div
        key={activity.id}
        className="flex justify-between items-start p-5 rounded-2xl bg-slate-50 hover:bg-violet-50 transition-all duration-300"
      >

        <div>

          <h3 className="font-semibold text-slate-800">

            {getActivityIcon(activity.activity_type)}{" "}

            {activity.activity_type
              .toLowerCase()
              .split("_")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}

          </h3>

          <p className="text-slate-500 mt-2">

            {activity.description}

          </p>

        </div>

        <span className="text-sm text-slate-400">

          {new Date(activity.created_at).toLocaleString()}

        </span>

      </div>

    ))

  )}

</div>

</div>

      </div>

    </DashboardLayout>
  );
}