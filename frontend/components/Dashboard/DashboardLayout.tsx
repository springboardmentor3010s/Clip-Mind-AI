"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";
import { useAuth } from "@/context/AuthContext";
import { getRoleHome, normalizeRole, UserRole } from "@/types/auth";

export default function DashboardLayout({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const role = normalizeRole(user.role);

    if (!role) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
      router.replace(getRoleHome(role));
    }
  }, [allowedRoles, loading, user, router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", color: "white", display: "grid", placeItems: "center" }}>
        Loading your dashboard...
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(normalizeRole(user.role) as UserRole)) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", color: "white", display: "grid", placeItems: "center" }}>
        Redirecting...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#111827", color: "white" }}>
      <DashboardSidebar />
      <div style={{ marginLeft: "230px", width: "calc(100% - 230px)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <DashboardNavbar />
        <main style={{ flex: 1, padding: "30px", overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
