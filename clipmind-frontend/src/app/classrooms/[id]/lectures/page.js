"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getClassroomVideos } from "@/services/classroomService";

export default function ClassroomLecturesPage() {
  const params = useParams();
  const classroomId = params.id;

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load videos assigned to this classroom
  const loadVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getClassroomVideos(classroomId);
      setVideos(data);
    } catch (err) {
      console.error("Failed to load classroom videos:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to load classroom lectures."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classroomId) {
      loadVideos();
    }
  }, [classroomId]);

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 md:p-8">

        {/* Page Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-violet-600">
            Classroom Management
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Manage Lectures
          </h1>

          <p className="mt-3 text-slate-600">
            View and manage educational videos for this classroom.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Lectures */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-white">
            Classroom Lectures
          </h2>

          {loading ? (
            <p className="mt-4 text-slate-400">
              Loading lectures...
            </p>
          ) : videos.length === 0 ? (
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-800 p-5">
              <p className="font-medium text-white">
                No lectures assigned yet.
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Upload a video and assign it to this classroom.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                >
                  <h3 className="font-semibold text-white">
                    {video.filename}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
                    <span>
                      Status: {video.status}
                    </span>

                    {video.duration && (
                      <span>
                        Duration: {Math.round(video.duration)} sec
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}