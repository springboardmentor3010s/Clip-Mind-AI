"use client";

import { FaBrain } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full flex justify-center pt-5">

      <nav className="w-[92%] max-w-7xl bg-white/80 backdrop-blur-xl shadow-lg rounded-full px-8 py-5 flex items-center justify-between border border-slate-200">

        {/* Logo */}

        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => scrollToSection("home")}
        >

          <div className="bg-violet-600 p-3 rounded-full shadow-md">
            <FaBrain className="text-white text-xl" />
          </div>

          <div>

            <h1 className="font-bold text-2xl text-slate-900">
              ClipMind AI
            </h1>

            <p className="text-sm text-slate-500">
              AI Video Intelligence
            </p>

          </div>

        </div>

        {/* Navigation */}

        <ul className="hidden md:flex gap-10 font-medium text-slate-600">

          <li
            onClick={() => scrollToSection("home")}
            className="cursor-pointer hover:text-violet-600 hover:scale-105 transition-all duration-300"
          >
            Home
          </li>

          <li
            onClick={() => scrollToSection("features")}
            className="cursor-pointer hover:text-violet-600 hover:scale-105 transition-all duration-300"
          >
            Features
          </li>

          <li
            onClick={() => scrollToSection("workflow")}
            className="cursor-pointer hover:text-violet-600 hover:scale-105 transition-all duration-300"
          >
            Workflow
          </li>

        </ul>

        {/* Buttons */}

        <div className="flex gap-4">

          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all duration-300"
          >
            Login
          </button>

          <button
            onClick={() => router.push("/register")}
            className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg transition-all duration-300 font-semibold"
          >
            Sign Up
          </button>

        </div>

      </nav>

    </header>
  );
}