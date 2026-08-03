"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

export default function DashboardPage() {
  const router = useRouter();

  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          background: "#0F172A",
        }}
      >
        Checking Authentication...
      </div>
    );
  }

  return <DashboardLayout />;
}