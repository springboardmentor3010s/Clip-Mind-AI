"use client";

import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import LearnerDashboard from "@/components/Dashboard/LearnerDashboard";

export default function LearnerDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["learner"]}>
      <LearnerDashboard />
    </DashboardLayout>
  );
}