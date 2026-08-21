import { Link, useRouterState } from "@tanstack/react-router";
import {
  FiHome,
  FiUpload,
  FiFileText,
  FiZap,
  FiClock,
  FiBarChart2,
  FiSettings,
  FiUser,
  FiLayers,
FiActivity,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/dashboard", label: "Home", icon: FiHome },
  { to: "/upload", label: "Upload", icon: FiUpload },
  { to: "/transcript", label: "Transcript", icon: FiFileText },
  { to: "/summary", label: "AI Summary", icon: FiZap },
  { to: "/moments", label: "Key Moments", icon: FiLayers },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/history", label: "History", icon: FiClock },
  { to: "/activity", label: "Activity", icon: FiActivity },
];

const bottomNav = [
  { to: "/profile", label: "Profile", icon: FiUser },
  { to: "/settings", label: "Settings", icon: FiSettings },
];

export function Sidebar() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-[calc(100vh-1.5rem)] sticky top-3 ml-3 mb-3 glass-strong rounded-3xl p-4">
      <Link to="/" className="flex items-center gap-2 px-3 py-2 mb-4">
        <div className="h-9 w-9 rounded-xl bg-gradient-primary shadow-glow flex items-center justify-center">
          <FiZap className="text-white" />
        </div>

        <span className="font-display text-xl">
          ClipMind
        </span>
      </Link>

      <div className="px-3 mb-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {user?.role ?? "Workspace"}
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
  {nav
    .filter((item) => {
      if (item.label === "Upload") {
        return user?.role === "Content Creator";
      }
      return true;
    })
    .map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative"
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-gradient-primary rounded-2xl shadow-glow"
                  transition={{
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.5,
                  }}
                />
              )}

              <div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                  active
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="text-base" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 pt-3 flex flex-col gap-1">
        {bottomNav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="text-base" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}