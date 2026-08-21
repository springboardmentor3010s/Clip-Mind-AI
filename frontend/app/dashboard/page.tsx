"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRoleHome } from "@/types/auth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? getRoleHome(user.role) : "/login");
  }, [loading, user, router]);

  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", color: "white", display: "grid", placeItems: "center" }}>
      Redirecting to your dashboard...
    </div>
  );
}
