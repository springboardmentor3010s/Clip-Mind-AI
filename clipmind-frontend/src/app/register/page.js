"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  FaBrain,
  FaUser,
  FaIdBadge,
  FaEnvelope,
  FaLock,
  FaArrowLeft,
} from "react-icons/fa";

import { registerUser } from "@/services/authService";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    role: "LEARNER",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      await registerUser(formData);

      setMessage(
        "Registration successful! Redirecting to Login..."
      );

      setFormData({
        username: "",
        full_name: "",
        email: "",
        password: "",
        role: "LEARNER",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500);

    } catch (error) {

      if (error.response) {

        const detail = error.response.data.detail;

        if (typeof detail === "string") {
          setMessage(detail);
        } else if (Array.isArray(detail)) {
          setMessage(
            detail.map((err) => err.msg).join(", ")
          );
        } else {
          setMessage("Registration failed.");
        }

      } else {

        setMessage("Unable to connect to the server.");

      }

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-violet-50 to-sky-50 flex items-center justify-center px-6">

      <div className="w-full max-w-xl">

        {/* Branding */}

        <div className="text-center mb-5">

          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-2xl ring-8 ring-violet-100">

            <FaBrain className="text-white text-3xl" />

          </div>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
          </h1>

          <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-slate-900">
            ClipMind AI
          </h1>

          <p className="mt-1 text-slate-500">
            AI Video Intelligence Platform
          </p>

        </div>

        {/* Register Card */}

        <form
          onSubmit={handleRegister}
          className="bg-white rounded-[28px] border border-slate-200 shadow-2xl p-10"
        >

          <h2 className="text-4xl font-bold text-center text-slate-900">
            Create My Account
          </h2>

          <p className="text-center text-slate-500 mt-3 mb-8">
            Join ClipMind AI and start transforming videos with AI.
          </p>

          <label className="block mb-2 font-semibold text-slate-700">
            Username
          </label>

          {/* Username */}

          <div className="relative mb-4">

            <FaUser className="absolute left-4 top-4 text-slate-400" />

            <input
              type="text"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              required
            />

          </div>

          <label className="block mb-2 font-semibold text-slate-700">
            Full Name
          </label>

          {/* Full Name */}

          <div className="relative mb-4">

            <FaIdBadge className="absolute left-4 top-4 text-slate-400" />

            <input
              type="text"
              name="full_name"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              required
            />

          </div>

          <label className="block mb-2 font-semibold text-slate-700">
            Email Address
          </label>

          {/* Email */}

          <div className="relative mb-4">

            <FaEnvelope className="absolute left-4 top-4 text-slate-400" />

            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              required
            />

          </div>

          <label className="block mb-2 font-semibold text-slate-700">
            Select Your Role
          </label>

           {/* Role */}

          <div className="relative mb-4">

            <FaUser className="absolute left-4 top-4 text-slate-400" />

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 bg-white text-slate-700 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              required
            >
              <option value="LEARNER">Learner</option>
              <option value="CONTENT_CREATOR">Content Creator</option>
              <option value="EDUCATOR">Educator</option>
            </select>

          </div>

          <label className="block mb-2 font-semibold text-slate-700">
            Password
          </label>

          {/* Password */}

          <div className="relative mb-5">

            <FaLock className="absolute left-4 top-4 text-slate-400" />

            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              required
            />

          </div>

          {/* Register Button */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-300 text-white py-4 rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Message */}

          {message && (
            <p
              className={`mt-5 text-center font-medium ${
                message.toLowerCase().includes("success")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          {/* Login Link */}

          <div className="mt-8 text-center text-slate-500">

            <div className="flex items-center my-8">

            <hr className="flex-1"/>

            <span className="mx-4 text-slate-400 text-sm">
            OR
            </span>

            <hr className="flex-1"/>

            </div>

            Already have an account?{" "}

            <Link
              href="/login"
              className="font-semibold text-violet-600 hover:text-violet-700 transition"
            >
              Login
            </Link>

          </div>

          {/* Back Home */}

          <div className="mt-4 text-center">

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-violet-600 transition-all duration-300 hover:-translate-x-1"
            >
              <FaArrowLeft />
              Return to Homepage
            </Link>

          </div>

        </form>

        {/* Footer */}

        <p className="text-center text-slate-400 text-xs mt-8">
        © 2026 ClipMind AI. All Rights Reserved.
        </p>

      </div>

    </div>
  );
}