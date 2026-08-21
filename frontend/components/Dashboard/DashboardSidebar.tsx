"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const menus = {
  admin: [
    { name: "🏠 Dashboard", href: "/admin/dashboard" },
    { name: "👥 User Management", href: "/dashboard/users" },
    { name: "🎥 Manage Videos", href: "/dashboard/manage-videos" },
    { name: "📊 System Analytics", href: "/dashboard/admin-analytics" },
    { name: "⚙️ Platform Settings", href: "/dashboard/platform-settings" },
    { name: "👤 Profile", href: "/dashboard/profile" },
  ],
  learner: [
    { name: "🏠 Dashboard", href: "/learner/dashboard" },
    { name: "🏫 My Classrooms", href: "/learner/classrooms" },
    { name: "📚 Learning History", href: "/dashboard/history" },
    { name: "🔖 Bookmarks", href: "/dashboard/bookmarks" },
    { name: "👤 Profile", href: "/dashboard/profile" },
    { name: "⚙️ Settings", href: "/dashboard/settings" },
  ],
  educator: [
    { name: "🏠 Dashboard", href: "/educator/dashboard" },
    { name: "📤 Upload Lectures", href: "/dashboard/upload" },
    { name: "📝 Transcripts", href: "/dashboard/videos" },
    { name: "🤖 Summaries", href: "/dashboard/summaries" },
    { name: "📢 Share with Students", href: "/dashboard/sharing" },
    { name: "👥 Student Engagement", href: "/dashboard/engagement" },
    { name: "👤 Profile", href: "/dashboard/profile" },
    { name: "⚙️ Settings", href: "/dashboard/settings" },
  ],
  creator: [
    { name: "🏠 Dashboard", href: "/creator/dashboard" },
    { name: "📤 Upload Videos", href: "/creator/dashboard/upload" },
    { name: "🎥 My Videos", href: "/dashboard/my-videos" },
    { name: "📊 Analytics", href: "/dashboard/analytics" },
    { name: "🔖 Bookmarks", href: "/dashboard/bookmarks" },
    { name: "👤 Profile", href: "/dashboard/profile" },
    { name: "⚙️ Settings", href: "/dashboard/settings" },
  ],
} as const;

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <SidebarShell><p style={{ color: "#94A3B8" }}>Loading account...</p></SidebarShell>;
  }

  if (!user) {
    return null;
  }

  const menu = menus[user.role] ?? [];

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <SidebarShell>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {menu.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "14px 18px",
                marginBottom: "10px",
                borderRadius: "12px",
                textDecoration: "none",
                color: "white",
                background: active ? "#1E293B" : "transparent",
                transition: "0.2s",
                fontWeight: 500,
              }}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          padding: "14px",
          marginTop: "15px",
          borderRadius: "12px",
          border: "none",
          background: "#EF4444",
          color: "white",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        🚪 Logout
      </button>
    </SidebarShell>
  );
}

function SidebarShell({ children }: { children: React.ReactNode }) {
  return (
    <aside
      style={{
        width: "230px",
        height: "100vh",
        boxSizing: "border-box",
        background: "#0F172A",
        borderRight: "1px solid #1E293B",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        padding: "25px 18px",
        zIndex: 100,
      }}
    >
      <h2
        style={{
          color: "#38BDF8",
          margin: "0 0 35px",
          fontSize: "26px",
          flexShrink: 0,
        }}
      >
        🧠 ClipMind AI
      </h2>
      {children}
    </aside>
  );
}
