"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";

import {
  getMySharedSummaries,
} from "@/services/summaryShareService";


export default function SharedSummariesPage() {

  const [summaries, setSummaries] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  useEffect(() => {

    const loadSharedSummaries = async () => {

      try {

        setLoading(true);

        setError("");

        const data =
          await getMySharedSummaries();

        setSummaries(data);

      } catch (error) {

        console.error(
          "Failed to load shared summaries:",
          error
        );

        setError(
          error.response?.data?.detail ||
          "Unable to load shared summaries."
        );

      } finally {

        setLoading(false);

      }

    };


    loadSharedSummaries();

  }, []);


  return (

    <DashboardLayout>

      <div className="min-h-screen p-6 md:p-8">

        {/* HEADER */}

        <div className="mb-8">

          <p className="text-sm font-semibold text-violet-600">
            Learning Resources
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Shared Summaries
          </h1>

          <p className="mt-2 text-slate-600">
            Summaries shared with you by your educators.
          </p>

        </div>


        {/* LOADING */}

        {loading && (

          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">

            Loading shared summaries...

          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">

            {error}

          </div>

        )}


        {/* EMPTY STATE */}

        {!loading &&
          !error &&
          summaries.length === 0 && (

            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

              <h2 className="text-xl font-bold text-slate-800">
                No shared summaries yet
              </h2>

              <p className="mt-2 text-slate-500">
                Your educators have not shared any summaries with you yet.
              </p>

            </div>

          )}


        {/* SUMMARY LIST */}

        {!loading &&
          !error &&
          summaries.length > 0 && (

            <div className="grid gap-6">

              {summaries.map((summary) => (

                <div
                  key={summary.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <p className="text-xs font-bold uppercase tracking-wide text-violet-600">

                        {summary.summary_type} Summary

                      </p>

                      <h2 className="mt-1 text-lg font-bold text-slate-900">

                        Video ID: {summary.video_id}

                      </h2>

                    </div>


                    <span className="inline-flex w-fit rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">

                      Shared Learning Resource

                    </span>

                  </div>


                  <div className="mt-5 rounded-xl bg-slate-50 p-5">

                    <p className="whitespace-pre-wrap leading-8 text-slate-700">

                      {summary.summary_text}

                    </p>

                  </div>


                  {summary.created_at && (

                    <p className="mt-4 text-sm text-slate-400">

                      Created:{" "}

                      {new Date(
                        summary.created_at
                      ).toLocaleString()}

                    </p>

                  )}

                </div>

              ))}

            </div>

          )}

      </div>

    </DashboardLayout>

  );

}