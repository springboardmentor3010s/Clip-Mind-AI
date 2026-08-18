"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";


export default function AuthPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  // Tab toggle state: 'login' or 'register'
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Learner"); // Matches default model enum
  const [message, setMessage] = useState({ text: "", type: "" }); // Handles error/success alerts
  const [loading, setLoading] = useState(false);
  
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    try {
      if (isLoginTab) {
        // --- LOGIN WORKFLOW ---
        // FastAPI OAuth2PasswordRequestForm expects x-www-form-urlencoded data
        const formData = new URLSearchParams();
        formData.append("username", email); 
        formData.append("password", password);

        const response = await fetch("http://localhost:8000/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Authentication validation failed.");

        
        localStorage.setItem("token", data.access_token || "");
        localStorage.setItem("role", (data.role || "learner").toLowerCase());
        // =========================================================

        login(data.access_token, data.email, data.role);
        router.push("/dashboard");

      } else {
        // --- REGISTRATION WORKFLOW ---
        const response = await fetch("http://localhost:8000/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Registration failed.");

        // Automatically log the user in following a successful registration
        setMessage({ text: "Account created! Authenticating session...", type: "success" });
        
        const loginFormData = new URLSearchParams();
        loginFormData.append("username", email);
        loginFormData.append("password", password);

        const loginResponse = await fetch("http://localhost:8000/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: loginFormData.toString(),
        });

        const loginData = await loginResponse.json();
        if (!loginResponse.ok) throw new Error(loginData.detail || "Auto-login failed.");

        localStorage.setItem("token", loginData.access_token || "");
        localStorage.setItem("role", (loginData.role || role || "learner").toLowerCase());
        // =========================================================

        login(loginData.access_token, loginData.email, loginData.role);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setMessage({ text: err.message || "An unexpected system error occurred.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Save token and role to localStorage
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role || "learner");
        localStorage.setItem("user_email", data.email || email);

        // Navigate to dashboard
        router.push("/dashboard");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login connection error:", err);
      alert("Failed to connect to backend server.");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        
        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setIsLoginTab(true); setMessage({ text: "", type: "" }); }}
            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${isLoginTab ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginTab(false); setMessage({ text: "", type: "" }); }}
            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${!isLoginTab ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            Register Account
          </button>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            {isLoginTab ? "Welcome to ClipMind AI" : "Create Your Account"}
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            {isLoginTab ? "Sign in to access video analytics intelligence" : "Sign up to start parsing long-form video content"}
          </p>
        </div>

        {/* Dynamic Context Messages */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg border text-xs font-medium ${
            message.type === "success" 
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" 
              : "bg-rose-950/40 border-rose-800 text-rose-400"
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              placeholder="name@university.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>

          {/* Role selection dropdown applies to both views for testing convenience */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Platform Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm cursor-pointer"
            >
              <option value="Learner">Learner (Student View)</option>
              <option value="Content Creator">Content Creator</option>
              <option value="Educator">Educator (Professor View)</option>
              <option value="Administrator">Platform Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 font-semibold text-sm rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? (isLoginTab ? "Authenticating Session..." : "Creating Account...") 
              : (isLoginTab ? "Sign In to Engine" : "Register Platform Access")}
          </button>
        </form>
      </div>
    </div>
  );
}
