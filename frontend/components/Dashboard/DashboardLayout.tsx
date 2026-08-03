"use client";

import DashboardSidebar from "./DashboardSidebar";
import DashboardNavbar from "./DashboardNavbar";
import WelcomeBanner from "./WelcomeBanner";
import StatsGrid from "./StatsGrid";
import UploadWidget from "./UploadWidget";
import RecentUploads from "./RecentUploads";
import RecentActivity from "./RecentActivity";

export default function DashboardLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0F172A",
      }}
    >
      <DashboardSidebar />

      <div
        style={{
          flex: 1,
          marginLeft: "230px",
        }}
      >
        <DashboardNavbar />
        <div style ={{
            padding: "30px",
        }}>
            <WelcomeBanner />

            <StatsGrid />

            <UploadWidget />
             <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <RecentUploads />

            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}