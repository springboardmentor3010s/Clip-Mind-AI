"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth(); 
  let menu = [];

  if (user?.role === "admin") {
  menu = [
    { name: "🏠 Dashboard", href: "/dashboard" },
    { name: "👥 User Management", href: "/dashboard/users" },
    { name: "🎥 Manage Videos", href: "/dashboard/manage-videos" },
    { name: "📊 System Analytics", href: "/dashboard/analytics" },
    { name: "⚙️ Platform Settings", href: "/dashboard/platform-settings" },
  ];
} else {
  menu = [
    { name: "🏠 Dashboard", href: "/dashboard" },
    { name: "📤 Upload Videos", href: "/dashboard/upload" },
    { name: "🤖 AI Summary", href: "/dashboard/summary" },
    { name: "📝 Transcript", href: "/dashboard/transcript" },
    { name: "⭐ Key Moments", href: "/dashboard/key-moments" },
    { name: "❓ Quiz", href: "/dashboard/quiz" },
    { name: "📜 History", href: "/dashboard/history" },
    { name: "👤 Profile", href: "/dashboard/profile" },
    { name: "⚙️ Settings", href: "/dashboard/settings" },
  ];
}

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  return (
    <aside
      style={{
        width: "230px",
        height: "100vh",
        background: "#0F172A",
        borderRight: "1px solid #1E293B",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        padding: "25px 18px",
      }}
    >
      <h2
        style={{
          color: "#38BDF8",
          marginBottom: "35px",
          fontSize: "26px",
        }}
      >
        🧠 ClipMind AI
      </h2>

      <div style={{ flex: 1 }}>
        {menu.map((item) => (
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
              background:
                pathname === item.href ? "#1E293B" : "transparent",
              transition: "0.3s",
              fontWeight: 500,
            }}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          border: "none",
          background: "#EF4444",
          color: "white",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >
        🚪 Logout
      </button>
    </aside>
  );
}