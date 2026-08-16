"use client";

import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Sparkles,
  Clock,
  BarChart3,
  History,
  LogOut,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  ChevronUp,
  Search,
  Bookmark,
  GraduationCap,
  Users,
  Flame,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import SettingsModal from "@/components/SettingsModal";
import HelpModal from "@/components/HelpModal";

const allNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, roles: ["creator", "learner", "educator", "admin"] },
  { name: "Upload Video", icon: Upload, roles: ["creator", "educator"] },
  { name: "Transcripts", icon: FileText, roles: ["creator", "learner", "educator"] },
  { name: "Summaries", icon: Sparkles, roles: ["creator", "learner", "educator"] },
  { name: "Key Moments", icon: Clock, roles: ["creator", "learner", "educator"] },
  { name: "Learning Materials", icon: GraduationCap, roles: ["educator", "learner"] },
  { name: "Classroom Analytics", icon: Users, roles: ["educator"] },
  { name: "Trending Topics", icon: Flame, roles: ["creator", "learner", "educator", "admin"] },
  { name: "Bookmarks", icon: Bookmark, roles: ["learner"] },
  { name: "Search", icon: Search, roles: ["creator", "learner", "educator"] },
  { name: "Analytics", icon: BarChart3, roles: ["creator", "educator"] },
  { name: "History", icon: History, roles: ["creator", "learner", "educator"] },
];

const roleLabels = {
  creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  admin: "Administrator",
};

export default function Sidebar({ active, onSelect, username = "Guest", role = "learner", email }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const menuRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();

  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  useEffect(() => {
    const hc = localStorage.getItem("clipmind_high_contrast") === "true";
    const lt = localStorage.getItem("clipmind_large_text") === "true";
    document.documentElement.style.filter = hc ? "contrast(1.15) saturate(1.15)" : "";
    document.documentElement.style.fontSize = lt ? "112%" : "";
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSignOut() {
    localStorage.removeItem("clipmind_token");
    localStorage.removeItem("clipmind_user");
    window.location.href = "/login";
  }

  const displayEmail = email || `${username?.toLowerCase().replace(/\s+/g, "")}@clipmind.ai`;

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-white flex flex-col py-6 px-4 relative">
      <h1 className="text-2xl font-bold px-2 mb-8">ClipMind AI</h1>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.name === active;
          return (
            <div
              key={item.name}
              onClick={() => onSelect(item.name)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                isActive ? "bg-blue text-white" : "text-gray-300 hover:bg-white/10"
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
          );
        })}
      </nav>

      <div className="relative border-t border-white/10 pt-4 mt-4" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-full bg-white text-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 z-20">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-2">
                {isDark ? <Moon size={16} /> : <Sun size={16} />}
                Dark mode
              </span>
              <span
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                  isDark ? "bg-blue justify-end" : "bg-gray-300 justify-start"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow" />
              </span>
            </button>
            <button
              onClick={() => {
                setShowSettings(true);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition text-left"
            >
              <Settings size={16} />
              Settings
            </button>
            <button
              onClick={() => {
                setShowHelp(true);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition text-left"
            >
              <HelpCircle size={16} />
              Help & Support
            </button>
            <div className="h-px bg-gray-100" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition text-left"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        )}

        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 transition"
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-blue flex items-center justify-center text-sm font-bold uppercase">
              {username?.charAt(0) || "G"}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-teal rounded-full border-2 border-sidebar" />
          </div>
          <div className="min-w-0 text-left flex-1">
            <p className="text-sm font-semibold truncate">{username}</p>
            <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
          </div>
          <ChevronUp
            size={16}
            className={`text-gray-400 transition-transform shrink-0 ${menuOpen ? "" : "rotate-180"}`}
          />
        </button>
        <p className="text-[10px] text-gray-500 mt-1.5 ml-2">{roleLabels[role] || "Learner"} · Online</p>
      </div>

      {showSettings && (
        <SettingsModal
          username={username}
          email={displayEmail}
          role={role}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </aside>
  );
}