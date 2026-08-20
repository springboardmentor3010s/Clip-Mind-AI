"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMyClassrooms } from "@/services/classroomService";
import Link from "next/link";

export default function MyClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyClassrooms();

        setClassrooms(data);
      } catch (err) {
        console.error("Failed to load classrooms:", err);

        setError(
          err.response?.data?.detail ||
          "Failed to load your classrooms."
        );
      } finally {
        setLoading(false);
      }
    };

    loadClassrooms();
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen">

        {/* Page Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-violet-600">
            Learning Space
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            My Classrooms
          </h1>

          <p className="mt-3 text-slate-600">
            View the classrooms you have been enrolled in.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-slate-500">
            Loading your classrooms...
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && classrooms.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">
              No Classrooms Yet
            </h2>

            <p className="mt-2 text-slate-500">
              You have not been added to any classrooms yet.
            </p>
          </div>
        )}

        {!loading && !error && classrooms.length > 0 && (
  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    {classrooms.map((classroom) => (
      <Link
        key={classroom.id}
        href={`/classrooms/${classroom.id}`}
        className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-400 hover:shadow-lg"
      >
        <p className="text-sm font-medium text-violet-600">
          Classroom
        </p>

        <div className="mt-2 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">
            {classroom.name}
          </h2>

          <span className="text-sm font-medium text-violet-600">
            Open →
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {classroom.description ||
            "No description available for this classroom."}
        </p>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-400">
            Educator ID: {classroom.educator_id}
          </p>
        </div>
      </Link>
    ))}
  </div>
)}

      </div>
    </DashboardLayout>
  );
}