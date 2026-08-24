"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";

import {
  getClassroomAnalytics,
} from "@/services/classroomAnalyticsService";


export default function ClassroomAnalyticsPage() {

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    loadAnalytics();

  }, []);


  async function loadAnalytics() {

    try {

      setLoading(true);
      setError("");

      const data =
        await getClassroomAnalytics();

      setAnalytics(data);

    } catch (error) {

      console.error(
        "Failed to load classroom analytics:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Unable to load classroom analytics."
      );

    } finally {

      setLoading(false);

    }

  }


  if (loading) {

    return (

      <DashboardLayout>

        <div className="flex min-h-[60vh] items-center justify-center">

          <p className="text-xl font-semibold text-slate-600">
            Loading classroom analytics...
          </p>

        </div>

      </DashboardLayout>

    );

  }


  if (error) {

    return (

      <DashboardLayout>

        <div className="flex min-h-[60vh] items-center justify-center">

          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-red-700">

            {error}

          </div>

        </div>

      </DashboardLayout>

    );

  }


  return (

    <DashboardLayout>

      <div className="space-y-8">

        {/* HEADER */}

        <div>

          <p className="text-sm font-semibold text-violet-600">
            Educator Insights
          </p>

          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
            Classroom Analytics
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            Monitor classroom content and learner distribution
            across your classrooms.
          </p>

        </div>


        {/* OVERVIEW CARDS */}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">

          <AnalyticsCard
            title="Classrooms"
            value={analytics.total_classrooms}
          />

          <AnalyticsCard
            title="Learners"
            value={analytics.total_learners}
          />

          <AnalyticsCard
            title="Lecture Videos"
            value={analytics.total_videos}
          />

          <AnalyticsCard
            title="Shared Summaries"
            value={analytics.total_summary_shares}
          />

          <AnalyticsCard
            title="Learning Materials"
            value={
              analytics.total_learning_material_shares
            }
          />

        </div>


        {/* CLASSROOM BREAKDOWN */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

          <h2 className="text-2xl font-bold text-slate-900">
            Classroom Breakdown
          </h2>

          <p className="mt-2 text-slate-500">
            Content distribution across your classrooms.
          </p>


          {analytics.classrooms.length === 0 ? (

            <div className="mt-8 rounded-2xl bg-slate-50 p-8 text-center">

              <p className="text-slate-500">
                You have not created any classrooms yet.
              </p>

            </div>

          ) : (

            <div className="mt-8 grid gap-6 lg:grid-cols-2">

              {analytics.classrooms.map(
                (classroom) => (

                  <div
                    key={classroom.classroom_id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                  >

                    <div className="flex items-start justify-between">

                      <div>

                        <h3 className="text-xl font-bold text-slate-900">
                          {classroom.classroom_name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Classroom ID:{" "}
                          {classroom.classroom_id}
                        </p>

                      </div>

                    </div>


                    <div className="mt-6 grid grid-cols-2 gap-4">

                      <Metric
                        label="Learners"
                        value={
                          classroom.learner_count
                        }
                      />

                      <Metric
                        label="Videos"
                        value={
                          classroom.video_count
                        }
                      />

                      <Metric
                        label="Shared Summaries"
                        value={
                          classroom.summary_share_count
                        }
                      />

                      <Metric
                        label="Learning Materials"
                        value={
                          classroom.learning_material_share_count
                        }
                      />

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </DashboardLayout>

  );

}


function AnalyticsCard({
  title,
  value,
}) {

  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-4xl font-extrabold text-slate-900">
        {value}
      </p>

    </div>

  );

}


function Metric({
  label,
  value,
}) {

  return (

    <div className="rounded-xl bg-white p-4">

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>

    </div>

  );

}