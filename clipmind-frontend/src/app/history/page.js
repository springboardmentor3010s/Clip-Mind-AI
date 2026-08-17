"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ActivityHistoryPage() {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Activity History
        </h1>

        <p className="mt-3 text-slate-500">
          View your recent activity on ClipMind AI.
        </p>

        <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-800">
            Recent Activity
          </h2>

          <p className="mt-3 text-slate-500">
            Your account activity and actions will be displayed here.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
              <p className="font-semibold text-slate-800">
                🔑 Login
              </p>

              <p className="mt-1 text-slate-500">
                User logged into ClipMind AI.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
              <p className="font-semibold text-slate-800">
                👤 Register
              </p>

              <p className="mt-1 text-slate-500">
                User account was created.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}