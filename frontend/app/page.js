"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import LandingPage from "../components/landing/LandingPage";

const ROLE_DASHBOARD = {
  content_creator: "/dashboard/content-creator",
  learner: "/dashboard/learner",
  educator: "/dashboard/educator",
  administrator: "/dashboard/admin",
};

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(ROLE_DASHBOARD[user.role] || "/dashboard");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper dark:bg-ink">
        <p className="font-mono text-xs uppercase tracking-wide text-ink/50 dark:text-paper/50">Loading...</p>
      </div>
    );
  }

  return <LandingPage />;
}