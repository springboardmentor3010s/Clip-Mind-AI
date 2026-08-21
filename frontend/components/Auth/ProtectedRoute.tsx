"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRoleHome, normalizeRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
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

    if (allowedRoles && !allowedRoles.some((item) => normalizeRole(item) === role)) {
      router.replace(getRoleHome(role));
    }
  }, [allowedRoles, loading, user, router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0F172A", color: "white" }}>
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}
