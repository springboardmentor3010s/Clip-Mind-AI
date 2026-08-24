"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMyKeyMoments } from "@/services/videoService";

export default function KeyMomentsPage() {

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    const loadKeyMoments = async () => {

      try {

        setLoading(true);
        setError("");

        const data = await getMyKeyMoments();

        setVideos(data);

      } catch (error) {

        console.error(
          "Failed to load key moments:",
          error
        );

        setError(
          error.response?.data?.detail ||
          "Unable to load key moments."
        );

      } finally {

        setLoading(false);

      }

    };

    loadKeyMoments();

  }, []);

  const totalKeyMoments = videos.reduce(
    (total, video) =>
      total + (video.key_moments?.length || 0),
    0
  );

  const analyzedVideos = videos.filter(
    (video) =>
      video.key_moments &&
      video.key_moments.length > 0
  ).length;

  return (

    <DashboardLayout>

      <div className="space-y-8">

        {/* HEADER */}

        <div>

          <p className="text-sm font-semibold text-violet-600">
            Content Creator Tools
          </p>

          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
            Key Moments
          </h1>

          <p className="mt-3 max-w-3xl text-lg text-slate-500">
            Explore important moments detected across
            your uploaded videos.
          </p>

        </div>


        {/* STATISTICS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg">

            <p className="text-sm font-semibold text-slate-500">
              Uploaded Videos
            </p>

            <p className="mt-3 text-4xl font-extrabold text-violet-600">
              {videos.length}
            </p>

          </div>


          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg">

            <p className="text-sm font-semibold text-slate-500">
              Videos Analyzed
            </p>

            <p className="mt-3 text-4xl font-extrabold text-emerald-600">
              {analyzedVideos}
            </p>

          </div>


          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg">

            <p className="text-sm font-semibold text-slate-500">
              Total Key Moments
            </p>

            <p className="mt-3 text-4xl font-extrabold text-amber-600">
              {totalKeyMoments}
            </p>

          </div>

        </div>


        {/* CONTENT */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                Your Videos
              </h2>

              <p className="mt-2 text-slate-500">
                Select a video to explore its detected key moments.
              </p>

            </div>

            <Link
              href="/videos"
              className="rounded-xl bg-violet-100 px-5 py-3 font-semibold text-violet-700 transition hover:bg-violet-200"
            >
              View All Videos
            </Link>

          </div>


          {/* LOADING */}

          {loading && (

            <div className="py-16 text-center text-slate-500">
              Loading key moments...
            </div>

          )}


          {/* ERROR */}

          {!loading && error && (

            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
              {error}
            </div>

          )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            videos.length === 0 && (

              <div className="mt-8 rounded-2xl bg-slate-50 p-10 text-center">

                <div className="text-4xl">
                  🎬
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-800">
                  No videos uploaded yet
                </h3>

                <p className="mt-2 text-slate-500">
                  Upload a video to start detecting important moments.
                </p>

                <Link
                  href="/upload"
                  className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700"
                >
                  Upload Video
                </Link>

              </div>

          )}


          {/* VIDEO LIST */}

          {!loading &&
            !error &&
            videos.length > 0 && (

              <div className="mt-8 space-y-5">

                {videos.map((video) => {

                  const moments =
                    video.key_moments || [];

                  return (

                    <div
                      key={video.video_id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:shadow-md"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                          <h3 className="text-xl font-bold text-slate-900">
                            {video.video_filename}
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            Status: {video.video_status}
                          </p>

                          <div className="mt-3">

                            {moments.length > 0 ? (

                              <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
                                ⭐ {moments.length} key moment
                                {moments.length !== 1
                                  ? "s"
                                  : ""}
                              </span>

                            ) : (

                              <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-600">
                                No key moments generated yet
                              </span>

                            )}

                          </div>

                        </div>


                        <Link
                          href={`/videos/${video.video_id}`}
                          className="inline-flex w-fit rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
                        >
                          {moments.length > 0
                            ? "View Key Moments →"
                            : "Open Video →"}
                        </Link>

                      </div>


                      {/* PREVIEW */}

                      {moments.length > 0 && (

                        <div className="mt-5 border-t border-slate-200 pt-5">

                          <p className="mb-3 text-sm font-semibold text-slate-600">
                            Detected moments
                          </p>

                          <div className="space-y-3">

                            {moments.slice(0, 3).map(
                              (moment) => (

                                <div
                                  key={moment.id}
                                  className="rounded-xl bg-white p-4"
                                >

                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                                    <p className="font-semibold text-slate-800">
                                      {moment.title}
                                    </p>

                                    <span className="text-sm font-semibold text-violet-600">
                                      {Number(
                                        moment.start_time
                                      ).toFixed(1)}
                                      s
                                    </span>

                                  </div>

                                  <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {moment.segment_text}
                                  </p>

                                </div>

                              )
                            )}

                          </div>


                          {moments.length > 3 && (

                            <p className="mt-3 text-sm text-slate-500">
                              + {moments.length - 3} more
                              key moments available in
                              video analysis.
                            </p>

                          )}

                        </div>

                      )}

                    </div>

                  );

                })}

              </div>

          )}

        </div>

      </div>

    </DashboardLayout>

  );
}