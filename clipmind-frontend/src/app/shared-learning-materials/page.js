"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";

import {
  getSharedLearningMaterials,
} from "@/services/videoService";

export default function SharedLearningMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSharedLearningMaterials();
  }, []);

  const loadSharedLearningMaterials = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getSharedLearningMaterials();

      setMaterials(data);
    } catch (error) {
      console.error(
        "Failed to load shared learning materials:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Unable to load shared learning materials."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-xl font-semibold text-slate-500">
            Loading learning materials...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div>
          <p className="text-sm font-semibold text-violet-600">
            Classroom Learning Resources
          </p>

          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
            Learning Materials
          </h1>

          <p className="mt-3 max-w-3xl text-lg text-slate-500">
            View structured learning materials shared with you
            by your educators.
          </p>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* ====================================================
            NO MATERIALS
        ==================================================== */}

        {!error && materials.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-lg">

            <h2 className="text-2xl font-bold text-slate-800">
              No Learning Materials Yet
            </h2>

            <p className="mt-3 text-slate-500">
              Your educators have not shared any learning
              materials with your classrooms yet.
            </p>

          </div>
        )}

        {/* ====================================================
            LEARNING MATERIALS
        ==================================================== */}

        {materials.length > 0 && (
          <div className="space-y-8">

            {materials.map((material) => (
              <div
                key={`${material.id}-${material.classroom_id}`}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
              >

                {/* ====================================================
                    MATERIAL HEADER
                ==================================================== */}

                <div className="border-b border-violet-100 bg-violet-50 p-8">

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div>
                      <p className="text-sm font-semibold text-violet-600">
                        Shared Learning Material
                      </p>

                      <h2 className="mt-2 text-2xl font-bold text-slate-900">
                        {material.video_filename}
                      </h2>
                    </div>

                    <span className="w-fit rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
                      {material.classroom_name}
                    </span>

                  </div>

                  <p className="mt-4 text-sm text-slate-500">
                    Shared on{" "}
                    {new Date(
                      material.shared_at
                    ).toLocaleString()}
                  </p>

                </div>

                {/* ====================================================
                    OVERVIEW
                ==================================================== */}

                <div className="p-8">

                  <h3 className="text-xl font-bold text-slate-900">
                    Overview
                  </h3>

                  <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-700">
                    {material.overview}
                  </p>

                </div>

                {/* ====================================================
                    KEY LEARNING POINTS
                ==================================================== */}

                <div className="border-t border-slate-100 p-8">

                  <h3 className="text-xl font-bold text-slate-900">
                    Key Learning Points
                  </h3>

                  {material.key_learning_points?.length > 0 ? (
                    <div className="mt-5 space-y-4">

                      {material.key_learning_points.map(
                        (point, index) => (
                          <div
                            key={index}
                            className="flex gap-4 rounded-2xl bg-violet-50 p-5"
                          >

                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
                              {index + 1}
                            </div>

                            <p className="leading-7 text-slate-700">
                              {point}
                            </p>

                          </div>
                        )
                      )}

                    </div>
                  ) : (
                    <p className="mt-4 text-slate-500">
                      No key learning points available.
                    </p>
                  )}

                </div>

                {/* ====================================================
                    STUDY NOTES
                ==================================================== */}

                <div className="border-t border-slate-100 p-8">

                  <h3 className="text-xl font-bold text-slate-900">
                    Study Notes
                  </h3>

                  <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-700">
                    {material.study_notes}
                  </p>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}