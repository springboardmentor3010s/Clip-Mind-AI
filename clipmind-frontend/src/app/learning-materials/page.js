"use client";

import { useEffect, useRef, useState } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";



import {
  getMyVideos,
  generateLearningMaterial,
  getMyLearningMaterials,
  shareLearningMaterial,
} from "@/services/videoService";

import {
  getEducatorClassrooms,
} from "@/services/classroomService";

export default function LearningMaterialsPage() {

  const [videos, setVideos] = useState([]);

  const [selectedVideoId, setSelectedVideoId] =
    useState("");

  const [learningMaterial, setLearningMaterial] =
    useState(null);

  const materialDetailsRef = useRef(null);

    const [learningMaterials, setLearningMaterials] =
    useState([]);

    const [materialsLoading, setMaterialsLoading] =
    useState(true);

    const [materialsError, setMaterialsError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

    const [classrooms, setClassrooms] = useState([]);
    const [selectedClassroomId, setSelectedClassroomId] = useState("");
    const [sharing, setSharing] = useState(false);
    const [shareMessage, setShareMessage] = useState("");
    const [shareError, setShareError] = useState("");

  // ============================================================
  // LOAD EDUCATOR VIDEOS
  // ============================================================

  useEffect(() => {

    const loadVideos = async () => {

        

      try {

        setLoading(true);
        setError("");

        const data = await getMyVideos();

        setVideos(data);

      } catch (error) {

        console.error(
          "Failed to load videos:",
          error
        );

        setError(
          error.response?.data?.detail ||
          "Unable to load your videos."
        );

      } finally {

        setLoading(false);

      }

    };

    loadVideos();

  }, []);

    // ============================================================
  // LOAD PREVIOUSLY GENERATED LEARNING MATERIALS
  // ============================================================

  useEffect(() => {

    const loadLearningMaterials = async () => {

      try {

        setMaterialsLoading(true);
        setMaterialsError("");

        const data = await getMyLearningMaterials();

        setLearningMaterials(data);

      } catch (error) {

        console.error(
          "Failed to load learning materials:",
          error
        );

        setMaterialsError(
          error.response?.data?.detail ||
          "Unable to load your learning materials."
        );

      } finally {

        setMaterialsLoading(false);

      }

    };

    loadLearningMaterials();

  }, []);

  useEffect(() => {
  const loadClassrooms = async () => {
    try {
      const data = await getEducatorClassrooms();
      setClassrooms(data);
    } catch (error) {
      console.error(
        "Failed to load classrooms:",
        error
      );
    }
  };

  loadClassrooms();
}, []);

  // ============================================================
  // GENERATE LEARNING MATERIAL
  // ============================================================

  const handleGenerate = async () => {

    if (!selectedVideoId) {

      setError(
        "Please select a video first."
      );

      setSuccess("");

      return;
    }

    try {

      setGenerating(true);
        setError("");
        setSuccess("");
        setLearningMaterial(null);

        setSelectedClassroomId("");
        setShareMessage("");
        setShareError("");

      const data =
  await generateLearningMaterial(
    selectedVideoId
  );

setLearningMaterial(data);

setLearningMaterials((previousMaterials) => [
  data,
  ...previousMaterials,
]);

setSuccess(
  "Learning material generated successfully."
);

    } catch (error) {

      console.error(
        "Failed to generate learning material:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Unable to generate learning material."
      );

    } finally {

      setGenerating(false);

    }

  };

    // ============================================================
  // SHARE LEARNING MATERIAL WITH CLASSROOM
  // Educator only
  // ============================================================

  const handleShareLearningMaterial = async () => {

    if (!learningMaterial?.id) {
      setShareError(
        "Generate learning material first."
      );
      setShareMessage("");
      return;
    }

    if (!selectedClassroomId) {
      setShareError(
        "Please select a classroom."
      );
      setShareMessage("");
      return;
    }

    try {

      setSharing(true);
      setShareError("");
      setShareMessage("");

      await shareLearningMaterial(
        learningMaterial.id,
        Number(selectedClassroomId)
      );

      setShareMessage(
        "Learning material shared successfully with the classroom."
      );

    } catch (error) {

      console.error(
        "Failed to share learning material:",
        error
      );

      setShareError(
        error.response?.data?.detail ||
        "Failed to share learning material."
      );

    } finally {

      setSharing(false);

    }
  };

    // ============================================================
  // GET VIDEO FILENAME FOR LEARNING MATERIAL
  // ============================================================

  const getMaterialVideoFilename = (material) => {

    const video = videos.find(
      (video) =>
        Number(video.id) === Number(material.video_id)
    );

    return (
      material.video_filename ||
      video?.filename ||
      "Unknown Video"
    );

  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <DashboardLayout>

        <div className="flex min-h-[60vh] items-center justify-center">

          <p className="text-xl font-semibold text-slate-500">
            Loading your videos...
          </p>

        </div>

      </DashboardLayout>

    );

  }

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (

    <DashboardLayout>

      <div className="space-y-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div>

          <p className="text-sm font-semibold text-violet-600">
            Educator Tools
          </p>

          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
            Learning Materials
          </h1>

          <p className="mt-3 max-w-3xl text-lg text-slate-500">
            Create structured learning material from
            your lecture transcripts.
          </p>

        </div>

        {/* ====================================================
            GENERATOR
        ==================================================== */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

          <h2 className="text-2xl font-bold text-slate-900">
            Create Learning Material
          </h2>

          <p className="mt-2 text-slate-500">
            Select one of your uploaded lectures to
            generate structured study material from
            its transcript.
          </p>

          {/* VIDEO SELECT */}

          <div className="mt-6">

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Lecture Video
            </label>

            <select
              value={selectedVideoId}
              onChange={(e) =>
                setSelectedVideoId(e.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >

              <option value="">
                Select one of your videos
              </option>

              {videos.map((video) => (

                <option
                  key={video.id}
                  value={video.id}
                >
                  {video.filename}
                </option>

              ))}

            </select>

          </div>

          {/* ERROR */}

          {error && (

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

              {error}

            </div>

          )}

          {/* SUCCESS */}

          {success && (

            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">

              {success}

            </div>

          )}

          {/* GENERATE BUTTON */}

          <button
            onClick={handleGenerate}
            disabled={
              generating ||
              !selectedVideoId
            }
            className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {generating
              ? "Generating Learning Material..."
              : "Generate Learning Material"}

          </button>

        </div>

                {/* ====================================================
            PREVIOUSLY GENERATED LEARNING MATERIALS
        ==================================================== */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Your Learning Materials
              </h2>

              <p className="mt-2 text-slate-500">
                View learning materials you have already generated.
              </p>

            </div>

            <span className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
              {learningMaterials.length} Materials
            </span>

          </div>

          {/* ERROR */}

          {materialsError && (

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {materialsError}
            </div>

          )}

          {/* LOADING */}

          {materialsLoading ? (

            <div className="mt-6 text-slate-500">
              Loading learning materials...
            </div>

          ) : learningMaterials.length === 0 ? (

            /* NO MATERIALS */

            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">

              <p className="font-semibold text-slate-700">
                No learning materials generated yet.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Generate your first learning material using
                the form above.
              </p>

            </div>

          ) : (

            /* MATERIAL LIST */

            <div className="mt-6 space-y-4">

              {learningMaterials.map((material) => (

                <div
                  key={material.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between"
                >

                  {/* MATERIAL INFORMATION */}

                  <div className="min-w-0">

                    <h3 className="text-lg font-bold text-slate-900">
                      {getMaterialVideoFilename(material)}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Created{" "}
                      {material.created_at
                        ? new Date(
                            material.created_at
                          ).toLocaleString()
                        : "Unknown date"}
                    </p>

                    {material.overview && (

                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                        {material.overview}
                      </p>

                    )}

                  </div>

                  {/* VIEW BUTTON */}

                  <button
                    type="button"
                    onClick={() => {

                      setLearningMaterial({
                        ...material,
                        video_filename:
                          getMaterialVideoFilename(material),
                      });

                      setSelectedClassroomId("");
                      setShareMessage("");
                      setShareError("");

                      setTimeout(() => {
  materialDetailsRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}, 100);

                    }}
                    className="flex-shrink-0 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
                  >
                    View Material
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* ====================================================
            GENERATED MATERIAL
        ==================================================== */}

        {learningMaterial && (

  <div
    ref={materialDetailsRef}
    className="space-y-6"
  >

            {/* TITLE */}

            <div className="rounded-3xl border border-violet-200 bg-violet-50 p-8">

              <p className="text-sm font-semibold text-violet-600">
                Generated Learning Material
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {learningMaterial.video_filename}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Created from the lecture transcript
              </p>

            </div>

            {/* ====================================================
    SHARE LEARNING MATERIAL
==================================================== */}

<div className="rounded-3xl border border-violet-200 bg-violet-50 p-8">

  <h3 className="text-xl font-bold text-violet-900">
    Share with Learners
  </h3>

  <p className="mt-2 text-sm leading-6 text-violet-700">
    Select one of your classrooms to share this learning
    material with the learners enrolled in that classroom.
  </p>

  {/* CLASSROOM SELECT */}

  <div className="mt-5">

    <label className="mb-2 block text-sm font-semibold text-slate-700">
      Select Classroom
    </label>

    <select
      value={selectedClassroomId}
      onChange={(e) => {
        setSelectedClassroomId(e.target.value);
        setShareError("");
        setShareMessage("");
      }}
      className="w-full rounded-xl border border-violet-300 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
    >

      <option value="">
        Select a classroom
      </option>

      {classrooms.map((classroom) => (

        <option
          key={classroom.id}
          value={classroom.id}
        >
          {classroom.name}
        </option>

      ))}

    </select>

  </div>

  {/* NO CLASSROOMS */}

  {classrooms.length === 0 && (

    <p className="mt-3 text-sm text-red-600">
      You have not created any classrooms yet.
    </p>

  )}

  {/* SHARE ERROR */}

  {shareError && (

    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {shareError}
    </div>

  )}

  {/* SHARE SUCCESS */}

  {shareMessage && (

    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
      {shareMessage}
    </div>

  )}

  {/* SHARE BUTTON */}

  <button
    onClick={handleShareLearningMaterial}
    disabled={
      sharing ||
      !selectedClassroomId ||
      !learningMaterial?.id
    }
    className="mt-5 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
  >

    {sharing
      ? "Sharing..."
      : "📤 Share Learning Material"}

  </button>

</div>

            {/* OVERVIEW */}

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

              <h3 className="text-2xl font-bold text-slate-900">
                Overview
              </h3>

              <p className="mt-4 leading-8 text-slate-700">
                {learningMaterial.overview}
              </p>

            </div>

            {/* KEY LEARNING POINTS */}

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

              <h3 className="text-2xl font-bold text-slate-900">
                Key Learning Points
              </h3>

              {learningMaterial.key_learning_points?.length >
              0 ? (

                <div className="mt-5 space-y-4">

                  {learningMaterial.key_learning_points.map(
                    (point, index) => (

                      <div
                        key={index}
                        className="flex gap-4 rounded-2xl bg-violet-50 p-5"
                      >

                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 font-bold text-white">
                          {index + 1}
                        </div>

                        <p className="leading-7 text-slate-700">
                          {point}.
                        </p>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <p className="mt-4 text-slate-500">
                  No key learning points were extracted.
                </p>

              )}

            </div>

            {/* STUDY NOTES */}

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

              <h3 className="text-2xl font-bold text-slate-900">
                Study Notes
              </h3>

              <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-700">
                {learningMaterial.study_notes}
              </p>

            </div>

          </div>

        )}

      </div>

    </DashboardLayout>

  );

}