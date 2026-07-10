"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import ThemeToggle from "../../components/ui/ThemeToggle";
import Waveform from "../../components/ui/Waveform";
import { getPasswordStrength, STRENGTH_COLORS } from "../../lib/passwordStrength";

const ROLES = [
  { value: "content_creator", label: "Content creator" },
  { value: "learner", label: "Learner" },
  { value: "educator", label: "Educator" },
];

const ROLE_DASHBOARD = {
  content_creator: "/dashboard/content-creator",
  learner: "/dashboard/learner",
  educator: "/dashboard/educator",
  administrator: "/dashboard/admin",
};

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("content_creator");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const strength = getPasswordStrength(password);
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await register({ full_name: fullName, email, password, role });
      router.push(ROLE_DASHBOARD[user.role] || "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen bg-paper dark:bg-ink">
      <div className="absolute right-6 top-6 z-10"><ThemeToggle /></div>

      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal-dark" />
          <span className="font-display text-lg font-semibold tracking-tight">ClipMind AI</span>
        </div>
        <div>
          <h2 className="max-w-sm font-display text-3xl font-semibold leading-tight tracking-tight">
            Create your account and start transforming your videos with AI.
          </h2>
          <Waveform className="mt-8 h-8 w-48 text-signal-dark/50" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-paper/30">AI-powered video intelligence</p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Create account</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">Join ClipMind AI today</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Full name</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name"
                className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password"
                className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper" />
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? STRENGTH_COLORS[strength.score] : "bg-line dark:bg-line-dark"}`} />
                    ))}
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink/50 dark:text-paper/50">{strength.label}</p>
                </div>
              )}
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Confirm password</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password"
                className={`mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm text-ink focus:outline-none dark:text-paper ${passwordsMismatch ? "border-danger" : "border-line focus:border-signal dark:border-line-dark"}`} />
              {passwordsMismatch && <p className="mt-1 text-xs text-danger">Passwords do not match.</p>}
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-cloud text-ink dark:bg-graphite dark:text-paper">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button type="submit" disabled={submitting} className="w-full rounded-md bg-signal py-2.5 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-50">
              {submitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/50 dark:text-paper/50">
            Already have an account? <Link href="/login" className="font-medium text-signal">Login</Link>
          </p>
        </div>
      </div>
    </main>
  );
}