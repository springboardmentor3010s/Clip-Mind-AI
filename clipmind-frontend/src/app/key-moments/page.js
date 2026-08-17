"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function KeyMomentsPage() {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Key Moments
        </h1>

        <p className="mt-3 text-slate-500">
          Important moments detected from your uploaded videos.
        </p>

        <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-800">
            Key Moments Detection
          </h2>

          <p className="mt-3 text-slate-500">
            Upload and process a video to identify its most important
            moments.
          </p>

          <div className="mt-6 rounded-2xl bg-violet-50 border border-violet-100 p-6 text-center">
            <div className="text-4xl mb-3">✨</div>

            <p className="font-semibold text-violet-700">
              Key moments will appear here after video analysis.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}