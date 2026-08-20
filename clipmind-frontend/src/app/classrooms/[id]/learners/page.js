"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  getClassroomLearners,
  addLearnerToClassroom,
  removeLearnerFromClassroom,
} from "@/services/classroomService";

export default function ClassroomLearnersPage() {
  const params = useParams();
  const classroomId = params.id;

  const [learnerIdentifier, setLearnerIdentifier] = useState("");
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load learners already enrolled in this classroom
  const loadLearners = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getClassroomLearners(classroomId);
      setLearners(data);
    } catch (err) {
      console.error("Failed to load learners:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to load learners."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classroomId) {
      loadLearners();
    }
  }, [classroomId]);

  // Add learner to this classroom
  const handleAddLearner = async (e) => {
  e.preventDefault();

  if (!learnerIdentifier.trim()) {
    setError("Learner ID, username, or email is required.");
    setSuccess("");
    return;
  }

  try {
    setAdding(true);
    setError("");
    setSuccess("");

    await addLearnerToClassroom(
      classroomId,
      learnerIdentifier.trim()
    );

    setLearnerIdentifier("");
    setSuccess("Learner added successfully.");

    // Reload the enrolled learners list
    await loadLearners();
  } catch (err) {
    console.error("Failed to add learner:", err);

    setError(
      err.response?.data?.detail ||
        "Failed to add learner."
    );
  } finally {
    setAdding(false);
  }
};

const handleRemoveLearner = async (learnerId) => {
  const confirmed = window.confirm(
    "Are you sure you want to remove this learner from the classroom?"
  );

  if (!confirmed) {
    return;
  }

  try {
    setRemovingId(learnerId);
    setError("");
    setSuccess("");

    await removeLearnerFromClassroom(
      classroomId,
      learnerId
    );

    setSuccess("Learner removed successfully.");

    // Reload the enrolled learners list
    await loadLearners();
  } catch (err) {
    console.error("Failed to remove learner:", err);

    setError(
      err.response?.data?.detail ||
        "Failed to remove learner."
    );
  } finally {
    setRemovingId(null);
  }
};

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 md:p-8">

        {/* Page Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-violet-600">
            Classroom Management
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Manage Learners
          </h1>

          <p className="mt-3 text-slate-600">
            Add learners to this classroom and view currently enrolled learners.
          </p>
        </div>

        {/* Add Learner */}
        <div className="max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white">
            Add Learner
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Enter the learner ID, username, or email to add them to this classroom.
          </p>

          <form
            onSubmit={handleAddLearner}
            className="mt-5 flex gap-3"
          >
            <input
                type="text"
                value={learnerIdentifier}
                onChange={(e) => setLearnerIdentifier(e.target.value)}
                placeholder="Enter learner ID, username, or email"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
            />

            <button
              type="submit"
              disabled={adding}
              className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add Learner"}
            </button>
          </form>

          {/* Success Message */}
          {success && (
            <div className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Learners List */}
        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-white">
            Enrolled Learners
          </h2>

          {loading ? (
            <p className="mt-4 text-slate-400">
              Loading learners...
            </p>
          ) : learners.length === 0 ? (
            <p className="mt-4 text-slate-400">
              No learners have been added to this classroom yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {learners.map((learner) => (
  <div
    key={learner.id}
    className="flex items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4"
  >
    <div>
      <p className="font-semibold text-white">
        {learner.full_name}
      </p>

      <p className="mt-1 text-sm text-slate-400">
        @{learner.username}
      </p>

      <p className="mt-1 text-sm text-slate-400">
        {learner.email}
      </p>
    </div>

    <button
      type="button"
      onClick={() =>
        handleRemoveLearner(learner.learner_id)
      }
      disabled={removingId === learner.learner_id}
      className="shrink-0 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {removingId === learner.learner_id
        ? "Removing..."
        : "Remove"}
    </button>
  </div>
))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}