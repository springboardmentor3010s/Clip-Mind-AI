"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import DashboardLayout from "@/components/layout/DashboardLayout";

import {
  getMyClassrooms,
  getEducatorClassrooms,
  getClassroomLectures,
} from "@/services/classroomService";


export default function ClassroomDetailsPage() {
  const params = useParams();
  const classroomId = params.id;
  const router = useRouter();

  const [role, setRole] = useState("");

  const [classroom, setClassroom] = useState(null);
  const [lectures, setLectures] = useState([]);

  const [loading, setLoading] = useState(true);
  const [lecturesLoading, setLecturesLoading] = useState(false);

  const [error, setError] = useState("");


  // ============================================================
  // LOAD USER ROLE
  // ============================================================

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "";
    setRole(storedRole);
  }, []);


  // ============================================================
  // LOAD CLASSROOM DETAILS
  // ============================================================

  useEffect(() => {
    const loadClassroom = async () => {
      if (!classroomId || !role) return;

      try {
        setLoading(true);
        setError("");

        let classrooms = [];

        // --------------------------------------------------------
        // EDUCATOR
        // --------------------------------------------------------

        if (role === "EDUCATOR") {
          classrooms = await getEducatorClassrooms();
        }

        // --------------------------------------------------------
        // LEARNER
        // --------------------------------------------------------

        if (role === "LEARNER") {
          classrooms = await getMyClassrooms();
        }

        const selectedClassroom = classrooms.find(
          (item) => String(item.id) === String(classroomId)
        );

        if (!selectedClassroom) {
          setError("Classroom not found.");
          return;
        }

        setClassroom(selectedClassroom);

      } catch (err) {
        console.error("Failed to load classroom:", err);

        setError(
          err.response?.data?.detail ||
          "Failed to load classroom."
        );

      } finally {
        setLoading(false);
      }
    };

    loadClassroom();

  }, [classroomId, role]);


  // ============================================================
  // LOAD LECTURES
  // LEARNER ONLY
  // ============================================================

  useEffect(() => {
    const loadLectures = async () => {
      if (
        !classroomId ||
        role !== "LEARNER"
      ) {
        return;
      }

      try {
        setLecturesLoading(true);

        const data = await getClassroomLectures(
          classroomId
        );

        setLectures(data);

      } catch (err) {
        console.error(
          "Failed to load classroom lectures:",
          err
        );

        setError(
          err.response?.data?.detail ||
          "Failed to load classroom lectures."
        );

      } finally {
        setLecturesLoading(false);
      }
    };

    loadLectures();

  }, [classroomId, role]);


  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading || !role) {
    return (
      <DashboardLayout>
        <div className="min-h-screen p-6 md:p-8">

          <p className="text-slate-500">
            Loading classroom...
          </p>

        </div>
      </DashboardLayout>
    );
  }


  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error && !classroom) {
    return (
      <DashboardLayout>
        <div className="min-h-screen p-6 md:p-8">

          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-500">
            {error}
          </div>

        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>

      <div className="min-h-screen p-6 md:p-8">

        {/* ===================================================== */}
        {/* CLASSROOM HEADER */}
        {/* ===================================================== */}

        <div className="mb-8">

          <p className="mb-2 text-sm font-medium text-violet-600">
            Classroom
          </p>

          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            {classroom.name}
          </h1>

          <p className="max-w-2xl text-base text-slate-600">
            {classroom.description ||
              "No description provided for this classroom."}
          </p>

        </div>


        {/* ===================================================== */}
        {/* EDUCATOR VIEW */}
        {/* ===================================================== */}

        {role === "EDUCATOR" && (

          <div className="grid gap-6 md:grid-cols-3">

            {/* LEARNERS */}

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">

              <h2 className="text-xl font-semibold text-white">
                Learners
              </h2>

              <p className="mt-3 text-sm text-slate-400">
                View and manage learners enrolled in this classroom.
              </p>

              <Link
                href={`/classrooms/${classroomId}/learners`}
                className="mt-6 inline-block rounded-xl bg-violet-600 px-5 py-2.5 font-medium text-white transition hover:bg-violet-500"
              >
                Manage Learners
              </Link>

            </div>


            {/* LECTURES */}

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">

              <h2 className="text-xl font-semibold text-white">
                Lectures
              </h2>

              <p className="mt-3 text-sm text-slate-400">
                Upload and organize educational videos for this classroom.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/classrooms/${classroomId}/lectures`
                  )
                }
                className="mt-6 rounded-xl bg-slate-800 px-5 py-2.5 font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Manage Lectures
              </button>

            </div>


            {/* SUMMARIES */}

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">

              <h2 className="text-xl font-semibold text-white">
                Summaries
              </h2>

              <p className="mt-3 text-sm text-slate-400">
                Generate and share AI-powered educational summaries.
              </p>

              <button
                type="button"
                className="mt-6 rounded-xl bg-slate-800 px-5 py-2.5 font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Manage Summaries
              </button>

            </div>

          </div>

        )}


        {/* ===================================================== */}
        {/* LEARNER VIEW */}
        {/* ===================================================== */}

        {role === "LEARNER" && (

          <div>

            <div className="mb-6">

              <h2 className="text-2xl font-bold text-slate-900">
                Classroom Lectures
              </h2>

              <p className="mt-2 text-slate-600">
                Access the lectures assigned to this classroom and
                continue your learning.
              </p>

            </div>


            {lecturesLoading ? (

              <p className="text-slate-500">
                Loading lectures...
              </p>

            ) : lectures.length === 0 ? (

              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

                <h3 className="text-lg font-semibold text-slate-800">
                  No lectures available yet
                </h3>

                <p className="mt-2 text-slate-500">
                  Your educator has not assigned any lectures to this
                  classroom yet.
                </p>

              </div>

            ) : (

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                {lectures.map((lecture) => (

                  <div
                    key={lecture.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-400 hover:shadow-lg"
                  >

                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-600">
                      Lecture
                    </p>

                    <h3 className="break-all text-lg font-bold text-slate-800">
                      {lecture.filename}
                    </h3>


                    <div className="mt-4">

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          lecture.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {lecture.status}
                      </span>

                    </div>


                    {/* TRANSCRIPT INFORMATION */}

                    {lecture.transcript && (

                      <p className="mt-4 text-sm text-slate-500">
                        ✓ Transcript available
                      </p>

                    )}


                    {/* SUMMARY INFORMATION */}

                    {lecture.summaries &&
                      lecture.summaries.length > 0 && (

                      <p className="mt-2 text-sm text-slate-500">
                        ✓ AI summaries available
                      </p>

                    )}


                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/videos/${lecture.id}`
                        )
                      }
                      className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 font-semibold text-white transition hover:opacity-90"
                    >
                      Open Lecture →
                    </button>

                  </div>

                ))}

              </div>

            )}

          </div>

        )}

      </div>

    </DashboardLayout>
  );
}