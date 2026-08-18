"use client";

import {
  FaBrain,
  FaHome,
  FaUpload,
  FaVideo,
  FaFileAlt,
  FaRobot,
  FaChartBar,
  FaHistory,
  FaStar,
} from "react-icons/fa";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleMenu from "../dashboard/RoleMenu";

export default function Sidebar() {
  const pathname = usePathname();

  const [role, setRole] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "";
    setRole(storedRole);
  }, []);

  const menuItems = RoleMenu({ role });

  const getIcon = (name) => {
  switch (name) {
    case "Dashboard":
      return <FaHome />;

    case "Upload Lecture":
    case "Upload Video":
    case "Upload Videos":
      return <FaUpload />;

    case "My Uploads":
    case "Videos":
      return <FaVideo />;

    case "Edit Transcript":
    case "Generate Transcript":
    case "Transcripts":
      return <FaFileAlt />;

    case "Share Summaries":
    case "Generate Summary":
    case "Summaries":
    case "AI Summaries":
      return <FaRobot />;

    case "Key Moments":
      return <FaStar />;

    case "Classroom Analytics":
    case "Analytics":
      return <FaChartBar />;

    case "Activity History":
      return <FaHistory />;

    default:
      return null;
  }
};

  return (
    <aside className="w-72 min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black border-r border-slate-800 text-white shadow-2xl flex flex-col">
      <div className="p-8 border-b border-slate-700">

  <div className="flex items-center gap-4">

    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-2xl shadow-lg">

      <FaBrain />

    </div>

    <div>

      <h1 className="text-2xl font-bold text-white">
        ClipMind AI
      </h1>

      <p className="text-sm text-slate-400">
        AI Video Intelligence Platform
      </p>

    </div>

  </div>

  <div className="mt-6">

    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-semibold">

      {role ? role.replace(/_/g, " ") : ""}

    </span>

  </div>

</div>

      <nav className="mt-8">

        <p className="px-6 mb-4 text-xs uppercase tracking-widest text-slate-500 font-semibold">
          Navigation
        </p>
        {menuItems.map((item) => (
          <Link
  key={item.path}
  href={item.path}
  className={`mx-4 mb-2 flex items-center gap-4 rounded-2xl px-5 py-3 transition-all duration-300 ${
    pathname === item.path
      ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-xl"
      : "text-slate-300 hover:bg-slate-800 hover:text-white hover:translate-x-2"
  }`}
>
  <span className="text-lg">
    {getIcon(item.name)}
  </span>

  <span className="font-medium">
    {item.name}
  </span>
</Link>
        ))}
      </nav>

    </aside>
  );
}