"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMyVideos } from "@/services/videoService";
import { getCurrentUser } from "@/services/authService";

export default function VideosPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadVideos() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await getCurrentUser(token);
        const currentUser = response.user;

        setUser(currentUser);

        localStorage.setItem(
          "user",
          JSON.stringify(currentUser)
        );

        localStorage.setItem(
          "role",
          currentUser.role
        );

        const allowedRoles = [
          "LEARNER",
          "CONTENT_CREATOR",
          "EDUCATOR",
          "ADMIN",
        ];

        if (!allowedRoles.includes(currentUser.role)) {
          router.replace("/dashboard");
          return;
        }

        const data = await getMyVideos();
        setVideos(data);

      } catch (error) {
        console.error("Failed to load videos:", error);

        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        router.replace("/login");

      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, [router]);

  const filteredAndSortedVideos = useMemo(() => {
    const filteredVideos = videos.filter((video) =>
      video.filename
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim())
    );

    return [...filteredVideos].sort((a, b) => {
      if (sortOrder === "latest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      return new Date(a.created_at) - new Date(b.created_at);
    });
  }, [videos, sortOrder, searchQuery]);

  const isLearner = user?.role === "LEARNER";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh] text-xl font-semibold">
          Loading videos...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Page Header */}
        <div>
          <h1 className="text-5xl font-extrabold text-slate-900">
            {isLearner ? "Learning Library" : "My Uploads"}
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            {isLearner
              ? "Explore available videos and access AI-powered learning resources."
              : "Manage and review all your uploaded videos."
            }
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="text-slate-500">
                {isLearner
                  ? "Available Videos"
                  : "Total Uploaded Videos"
                }
              </p>

              <h2 className="text-4xl font-bold text-violet-600 mt-2">
                {videos.length}
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-4">

              {/* Search Videos */}
              <div className="w-full sm:w-72">
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Search Videos
                </label>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by video name..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Sort Videos */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Sort By
                </label>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="rounded-xl border border-slate-300 px-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="latest">
                    Latest Uploads
                  </option>

                  <option value="oldest">
                    Oldest Uploads
                  </option>
                </select>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-3xl">
                🎥
              </div>

            </div>

          </div>

        </div>

        {/* Empty State */}
        {videos.length === 0 ? (

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-14 text-center">

            <div className="text-6xl mb-6">
              🎥
            </div>

            <h2 className="text-3xl font-bold text-slate-800">
              {isLearner
                ? "No Learning Videos Available Yet"
                : "No Videos Uploaded Yet"
              }
            </h2>

            <p className="mt-4 text-slate-500">
              {isLearner
                ? "There are currently no videos available for learning."
                : "Upload your first video to get started with ClipMind AI."
              }
            </p>

            {!isLearner && (
              <button
                onClick={() => router.push("/upload")}
                className="mt-8 px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold shadow-lg"
              >
                Upload Your First Video
              </button>
            )}

          </div>

        ) : filteredAndSortedVideos.length === 0 ? (

          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-12 text-center">

            <div className="text-5xl mb-5">
              🔍
            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              No Matching Videos Found
            </h2>

            <p className="mt-3 text-slate-500">
              No video matches "{searchQuery}".
            </p>

            <button
              onClick={() => setSearchQuery("")}
              className="mt-6 px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-all"
            >
              Clear Search
            </button>

          </div>

        ) : (

          /* Video Grid */
          <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-8">

            {filteredAndSortedVideos.map((video) => (

              <div
                key={video.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
              >

                <img
                  src={`http://127.0.0.1:8000/${video.thumbnail_path.replace(
                    /\\/g,
                    "/"
                  )}`}
                  alt={video.filename}
                  className="w-full h-56 object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/600x350?text=ClipMind+AI";
                  }}
                />

                <div className="p-6">

                  <h2 className="text-xl font-bold text-slate-800 break-words leading-8">
                    {video.filename}
                  </h2>

                  <div className="mt-5 space-y-4">

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">
                        Status
                      </span>

                      <span
  className={`px-3 py-1 rounded-full text-sm font-semibold ${
    video.status === "COMPLETED"
      ? "bg-green-100 text-green-700"
      : video.status === "PROCESSING"
      ? "bg-amber-100 text-amber-700"
      : video.status === "FAILED"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700"
  }`}
>
  {video.status}
</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">
                        Duration
                      </span>

                      <span className="font-semibold text-slate-800">
                        {Number(video.duration).toFixed(2)} sec
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">
                        File Size
                      </span>

                      <span className="font-semibold text-slate-800">
                        {(video.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        {isLearner ? "Available Since" : "Uploaded"}
                      </p>

                      <p className="font-medium text-slate-700">
                        {new Date(video.created_at).toLocaleString()}
                      </p>
                    </div>

                  </div>

                  <button
                    onClick={() => router.push(`/videos/${video.id}`)}
                    className="mt-8 w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white py-3 rounded-2xl font-semibold shadow-lg transition-all duration-300"
                  >
                    {isLearner
                      ? "Open Learning Content"
                      : "Open Workspace"
                    }
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </DashboardLayout>
  );
}