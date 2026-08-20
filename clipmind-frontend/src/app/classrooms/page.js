"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  createClassroom,
  getEducatorClassrooms,
} from "@/services/classroomService";

export default function ClassroomsPage() {
  const [classroomName, setClassroomName] = useState("");
  const [description, setDescription] = useState("");

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load educator's classrooms
  const loadClassrooms = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getEducatorClassrooms();
      setClassrooms(data);
    } catch (err) {
      console.error("Failed to load classrooms:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to load classrooms."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  // Create a new classroom
  const handleCreateClassroom = async (e) => {
    e.preventDefault();

    if (!classroomName.trim()) {
      setError("Classroom name is required.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const newClassroom = await createClassroom({
        name: classroomName.trim(),
        description: description.trim(),
      });

      // Add the newly created classroom immediately
      setClassrooms((prev) => [...prev, newClassroom]);

      // Clear form
      setClassroomName("");
      setDescription("");

      setSuccess("Classroom created successfully.");
    } catch (err) {
      console.error("Failed to create classroom:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to create classroom."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 md:p-8">

        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            My Classrooms
          </h1>

          <p className="mt-2 text-slate-400">
            Create and manage classrooms, add learners, and organize
            educational content.
          </p>
        </div>

        {/* Create Classroom Form */}
        <div className="max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">

          <h2 className="mb-6 text-xl font-semibold text-white">
            Create New Classroom
          </h2>

          <form
            onSubmit={handleCreateClassroom}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Classroom Name
              </label>

              <input
                type="text"
                value={classroomName}
                onChange={(e) =>
                  setClassroomName(e.target.value)
                }
                placeholder="Enter classroom name"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Enter a short description"
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating
                ? "Creating..."
                : "Create Classroom"}
            </button>
          </form>
        </div>

        {/* Classroom List */}
        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold text-white">
            Your Classrooms
          </h2>

          {loading ? (
            <p className="mt-4 text-slate-400">
              Loading classrooms...
            </p>
          ) : classrooms.length === 0 ? (
            <p className="mt-4 text-slate-400">
              You have not created any classrooms yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {classrooms.map((classroom) => (
  <Link
    key={classroom.id}
    href={`/classrooms/${classroom.id}`}
    className="block rounded-xl border border-slate-700 bg-slate-800 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-violet-500 hover:bg-slate-750 hover:shadow-lg"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {classroom.name}
        </h3>

        <p className="mt-2 text-sm text-slate-400">
          {classroom.description ||
            "No description provided."}
        </p>
      </div>

      <span className="text-sm font-medium text-violet-400">
        Open →
      </span>
    </div>
  </Link>
))}
            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}