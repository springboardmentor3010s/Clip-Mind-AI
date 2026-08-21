"use client";

import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import EducatorDashboard from "@/components/Dashboard/EducatorDashboard";

export default function EducatorDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["educator"]}>
      <EducatorDashboard />
    </DashboardLayout>
  );
}