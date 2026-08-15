"use client";
import {
  FaVideo,
  FaFileAlt,
  FaRobot,
  FaUserCircle,
} from "react-icons/fa";

import Link from "next/link";
import { getActivityHistory } from "@/services/activityService";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/services/authService";
import { getMyVideos } from "@/services/videoService";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activities, setActivities] = useState([]);
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

        const myVideos = await getMyVideos();
        setVideos(myVideos);

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
    case "VIDEO_UPLOADED":
      return "🎥";

    case "USER_LOGIN":
      return "🔑";

    case "USER_LOGOUT":
      return "🚪";

    case "USER_REGISTERED":
      return "👤";

    default:
      return "📌";
  }
};

  return (
    <DashboardLayout>

      <div>

        <h1 className="text-4xl font-bold text-slate-800 mb-2">
          Welcome, {user.full_name}
        </h1>

        <p className="text-slate-500 mb-8">
          Role: {user.role}
        </p>

        {/* Dashboard Cards */}

        {/* Dashboard Cards */}

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">

  {/* Uploaded Videos */}

<Link
  href="/videos"
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
      View Uploads →
    </p>

    </div>
</Link>

  {/* Transcripts */}

  <Link
  href="/transcripts"
  className="block bg-white rounded-3xl shadow-lg border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
>
  <div className="p-7">

    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white text-2xl shadow-lg">

      <FaFileAlt />

    </div>

    <h3 className="mt-6 text-xl font-bold text-slate-800">
      Transcripts
    </h3>

    <p className="mt-3 text-5xl font-extrabold text-sky-600">
      0
    </p>

    <p className="mt-2 text-slate-500">
      AI-generated transcripts
    </p>

    <hr className="my-5" />

    <p className="text-sky-600 font-semibold">
      View Transcripts →
    </p>

    </div>
</Link>

  {/* AI Summaries */}

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
      0
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

  {/* AI Processing */}

<div className="bg-white rounded-3xl shadow-lg p-7 border border-slate-200 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">

  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl shadow-lg">

    <FaRobot />

  </div>

  <h3 className="mt-6 text-xl font-bold text-slate-800">
    AI Processing
  </h3>

  <p className="mt-3 text-3xl font-bold text-amber-600">
    Ready
  </p>

  <p className="mt-2 text-slate-500">
    Whisper & AI Models
  </p>

  <hr className="my-5" />

  <p className="text-amber-600 font-semibold">
    Coming Soon
  </p>

</div>

</div>
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