"use client";

import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#111827",
      }}
    >
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Right Side */}
      <div
        style={{
          marginLeft: "230px",
          width: "calc(100% - 230px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DashboardNavbar />

        <main
          style={{
            flex: 1,
            padding: "30px",
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}