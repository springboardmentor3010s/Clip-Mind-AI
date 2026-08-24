"use client";

import { useEffect, useState } from "react";

import DashboardLayout
  from "@/components/layout/DashboardLayout";

import {
  getStudentEngagement,
} from "@/services/studentEngagementService";


export default function StudentEngagementPage() {

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    loadEngagement();

  }, []);


  async function loadEngagement() {

    try {

      setLoading(true);
      setError("");

      const result =
        await getStudentEngagement();

      setData(result);

    } catch (error) {

      console.error(
        "Failed to load student engagement:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Unable to load student engagement."
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
            Loading student engagement...
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
            Student Engagement
          </h1>

          <p className="mt-3 max-w-3xl text-lg text-slate-500">
            Monitor how learners interact with your
            educational content.
          </p>

        </div>


        {/* OVERVIEW */}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            title="Total Learners"
            value={
              data.total_learners
            }
          />

          <MetricCard
            title="Active Learners"
            value={
              data.active_learners
            }
          />

          <MetricCard
            title="Inactive Learners"
            value={
              data.inactive_learners
            }
          />

          <MetricCard
            title="Total Engagement Actions"
            value={
              data.total_engagement_actions
            }
          />

        </div>


        {/* CONTENT INTERACTIONS */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

          <h2 className="text-2xl font-bold text-slate-900">
            Content Engagement
          </h2>

          <p className="mt-2 text-slate-500">
            Learner interactions with ClipMind AI
            learning resources.
          </p>


          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            <InteractionCard
              title="Summary Views"
              value={
                data.summary_views
              }
            />

            <InteractionCard
              title="Transcript Views"
              value={
                data.transcript_views
              }
            />

            <InteractionCard
              title="Transcript Segment Views"
              value={
                data.transcript_segment_views
              }
            />

            <InteractionCard
              title="Key Moment Views"
              value={
                data.key_moment_views
              }
            />

            <InteractionCard
              title="Highlight Views"
              value={
                data.highlight_views
              }
            />

            <InteractionCard
              title="Bookmarks Added"
              value={
                data.bookmarks_added
              }
            />

          </div>


          <div className="mt-6 rounded-2xl bg-violet-50 p-5">

            <p className="text-sm text-violet-700">
              Average actions per active learner
            </p>

            <p className="mt-1 text-3xl font-bold text-violet-900">
              {
                data.average_actions_per_active_learner
              }
            </p>

          </div>

        </div>


        {/* STUDENT BREAKDOWN */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

          <h2 className="text-2xl font-bold text-slate-900">
            Learner Engagement Breakdown
          </h2>

          <p className="mt-2 text-slate-500">
            Engagement activity for learners enrolled
            in your classrooms.
          </p>


          {data.students.length === 0 ? (

            <div className="mt-8 rounded-2xl bg-slate-50 p-8 text-center">

              <p className="text-slate-500">
                No learners are enrolled in your
                classrooms yet.
              </p>

            </div>

          ) : (

            <div className="mt-8 overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>

                  <tr className="border-b border-slate-200 text-left">

                    <th className="px-4 py-4 text-sm font-semibold text-slate-500">
                      Learner
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-slate-500">
                      Status
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-slate-500">
                      Actions
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-slate-500">
                      Summaries
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-slate-500">
                      Transcripts
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-slate-500">
                      Key Moments
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-slate-500">
                      Highlights
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-slate-500">
                      Bookmarks
                    </th>

                    <th className="px-4 py-4 text-sm font-semibold text-slate-500">
                      Last Active
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {data.students.map(
                    (student) => (

                      <tr
                        key={student.learner_id}
                        className="border-b border-slate-100"
                      >

                        <td className="px-4 py-5">

                          <p className="font-semibold text-slate-900">
                            {
                              student.full_name
                            }
                          </p>

                          <p className="text-sm text-slate-500">
                            @
                            {
                              student.username
                            }
                          </p>

                        </td>


                        <td className="px-4 py-5">

                          <span
                            className={
                              student.engagement_status ===
                              "ACTIVE"
                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                                : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                            }
                          >

                            {
                              student.engagement_status
                            }

                          </span>

                        </td>


                        <td className="px-4 py-5 font-bold text-slate-900">
                          {
                            student.total_actions
                          }
                        </td>

                        <td className="px-4 py-5">
                          {
                            student.summary_views
                          }
                        </td>

                        <td className="px-4 py-5">
                          {
                            student.transcript_views
                          }
                        </td>

                        <td className="px-4 py-5">
                          {
                            student.key_moment_views
                          }
                        </td>

                        <td className="px-4 py-5">
                          {
                            student.highlight_views
                          }
                        </td>

                        <td className="px-4 py-5">
                          {
                            student.bookmarks_added
                          }
                        </td>

                        <td className="px-4 py-5 text-sm text-slate-500">

                          {
                            student.last_active_at
                              ? new Date(
                                  student.last_active_at
                                ).toLocaleString()
                              : "Never"
                          }

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </DashboardLayout>

  );

}


function MetricCard({
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


function InteractionCard({
  title,
  value,
}) {

  return (

    <div className="rounded-2xl bg-slate-50 p-6">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

    </div>

  );

}