"use client";

import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import AdminDashboard from "@/components/Dashboard/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <AdminDashboard />
    </DashboardLayout>
  );
}

