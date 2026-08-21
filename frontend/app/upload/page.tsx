"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function UploadRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user?.role === "creator") router.replace("/creator/dashboard/upload");
    else if (user?.role === "educator") router.replace("/dashboard/upload");
    else router.replace(user ? "/dashboard" : "/login");
  }, [loading, user, router]);

  return <div style={{ minHeight: "100vh", background: "#0F172A", color: "white", display: "grid", placeItems: "center" }}>Redirecting...</div>;
}
