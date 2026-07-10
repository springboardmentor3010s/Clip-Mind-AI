"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

const ROLE_DASHBOARD = {
  content_creator: "/dashboard/content-creator",
  learner: "/dashboard/learner",
  educator: "/dashboard/educator",
  administrator: "/dashboard/admin",
};

export default function DashboardIndex() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(ROLE_DASHBOARD[user.role] || "/login");
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting...</p>
    </div>
  );
}