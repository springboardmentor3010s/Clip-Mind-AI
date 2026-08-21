import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FiSearch, FiBell, FiChevronDown, FiLogOut, FiUser, FiSettings, FiMenu, FiZap } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar({ onOpenMobile }: { onOpenMobile?: () => void }) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  const initials = user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

  return (
    <header className="sticky top-3 z-30 mx-3 mb-4 glass-strong rounded-3xl px-4 py-2.5 flex items-center gap-3">
      <button className="lg:hidden p-2 rounded-xl hover:bg-muted" onClick={onOpenMobile}>
        <FiMenu />
      </button>

      <Link to="/dashboard" className="lg:hidden flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center">
          <FiZap className="text-white text-sm" />
        </div>
      </Link>

      <div className="flex-1 max-w-xl relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
        <input
          className="w-full h-10 bg-muted/60 rounded-2xl pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:bg-card focus:ring-focus outline-none transition"
          placeholder="Search recordings, transcripts and moments…"
        />
        <kbd className="hidden md:inline absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
      </div>

      <ThemeToggle />

      <div className="relative">
        <button
          className="relative h-10 w-10 rounded-2xl hover:bg-muted flex items-center justify-center"
          onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
        >
          <FiBell />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
        </button>
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 mt-2 w-80 glass-strong rounded-2xl p-3 shadow-glow"
            >
              <div className="text-sm font-semibold px-2 pb-2">Notifications</div>
              {["Processing pipeline idle", "No new notifications"].map((n) => (
                <div key={n} className="p-2.5 rounded-xl hover:bg-muted/60 text-sm text-foreground">{n}</div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative">
        <button
          className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl hover:bg-muted"
          onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-xs font-semibold shadow-glow">
            {initials}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-[11px] text-muted-foreground">{user?.role}</div>
          </div>
          <FiChevronDown className="text-muted-foreground text-sm" />
        </button>
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl p-2 shadow-glow"
            >
              <div className="px-3 py-2 border-b border-border/60">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted text-sm"><FiUser /> Profile</Link>
              <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted text-sm"><FiSettings /> Settings</Link>
              <button
                onClick={() => { logout(); navigate({ to: "/login" }); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted text-sm text-destructive"
              >
                <FiLogOut /> Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
