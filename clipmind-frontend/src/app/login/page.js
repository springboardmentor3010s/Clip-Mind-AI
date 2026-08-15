"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  FaBrain,
  FaEnvelope,
  FaLock,
  FaArrowLeft,
} from "react-icons/fa";

import {
  loginUser,
  getCurrentUser,
} from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const loginResponse = await loginUser(email, password);

      const token = loginResponse.access_token;

      localStorage.setItem("access_token", token);

      const userResponse = await getCurrentUser(token);

      localStorage.setItem(
        "user",
        JSON.stringify(userResponse.user)
      );

      localStorage.setItem(
        "role",
        userResponse.user.role
      );

      setMessage("Login successful!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);

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
          setMessage("Login failed.");
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

      <div className="w-full max-w-lg">

        {/* Branding */}

        <div className="text-center mb-8">

          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-2xl ring-8 ring-violet-100">

            <FaBrain className="text-white text-3xl" />

          </div>

          <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-slate-900">
            ClipMind AI
          </h1>

          <p className="mt-2 text-slate-500 text-lg">
            AI Video Intelligence Platform
          </p>

        </div>

        {/* Login Card */}

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-10"
        >

          <h2 className="text-4xl font-bold text-center text-slate-900">
            Welcome Back
          </h2>

          <p className="text-center text-slate-500 mt-3 mb-8">
            Sign in to continue to your dashboard.
          </p>

          {/* Email */}

          <div className="relative mb-5">

            <FaEnvelope className="absolute left-4 top-4 text-slate-400" />

            <input
              type="email"
              placeholder="name@example.com"
              className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </div>

          {/* Password */}

          <div className="relative mb-7">

            <FaLock className="absolute left-4 top-4 text-slate-400" />

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </div>

          {/* Login Button */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-300 text-white py-4 rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Login"}
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

          {/* Register */}

          <div className="mt-8 text-center text-slate-500">

            Don't have an account?{" "}

            <Link
              href="/register"
              className="font-semibold text-violet-600 hover:text-violet-700 transition"
            >
              Create one
            </Link>

          </div>

          {/* Back Home */}

          <div className="mt-5 text-center">

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

        <p className="text-center text-slate-400 text-xs mt-8 tracking-wide">
          © 2026 ClipMind AI • AI Video Intelligence Platform
        </p>

      </div>

    </div>
  );
}