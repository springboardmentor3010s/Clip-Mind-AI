"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    router.replace("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center">

      {/* Left Side */}

      <div>

        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-1 text-slate-500">
          Welcome back,
          <span className="font-semibold text-slate-700">
            {" "}
            {user?.full_name || ""}
          </span>
          ! Manage your videos, transcripts and AI summaries.
        </p>

      </div>

      {/* Right Side */}

      <div className="flex items-center gap-5">

        {/* Role Badge */}

        {user?.role && (
          <span className="px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold">
            {user.role.replace("_", " ")}
          </span>
        )}

        {/* Avatar */}

        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center text-lg font-bold shadow-lg">

          {user?.full_name
            ? user.full_name.charAt(0).toUpperCase()
            : "U"}

        </div>

        {/* Logout */}

        <button
          onClick={handleLogout}
          className="px-5 py-2 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-500 transition-all duration-300"
        >
          Logout
        </button>

      </div>

    </header>
  );
}