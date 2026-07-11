"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import { PlayIcon, ChevronDownIcon } from "../../components/ui/icons";
import { getPasswordStrength, STRENGTH_COLORS } from "../../lib/passwordStrength";

const ROLES = [
  { value: "content_creator", label: "Content Creator" },
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
  const [agreed, setAgreed] = useState(false);
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
    if (!agreed) {
      setError("Please agree to the Terms & Conditions to continue.");
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
    <main className="flex min-h-screen items-center justify-center bg-paper p-6 dark:bg-ink">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-cloud shadow-sm dark:border-line-dark dark:bg-graphite md:grid-cols-2">
        {/* Form panel */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal text-white">
              <PlayIcon width={15} height={15} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-paper">ClipMind AI</span>
          </div>

          <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Create Account</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">Join ClipMind AI today</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Full Name</label>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name"
                className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password"
                className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30" />
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? STRENGTH_COLORS[strength.score] : "bg-line dark:bg-line-dark"}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-ink/50 dark:text-paper/50">{strength.label}</p>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Confirm Password</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password"
                className={`mt-1.5 w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 dark:text-paper dark:placeholder:text-paper/30 ${passwordsMismatch ? "border-danger focus:ring-danger/15" : "border-line focus:border-signal focus:ring-signal/15 dark:border-line-dark"}`} />
              {passwordsMismatch && <p className="mt-1 text-xs text-danger">Passwords do not match.</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Role</label>
              <div className="relative mt-1.5">
                <select value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper">
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="bg-cloud text-ink dark:bg-graphite dark:text-paper">
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon width={15} height={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 dark:text-paper/40" />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-ink/60 dark:text-paper/60">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-line text-signal focus:ring-signal/30 dark:border-line-dark" />
              <span>
                I agree to the <Link href="#" className="font-medium text-signal">Terms &amp; Conditions</Link> and{" "}
                <Link href="#" className="font-medium text-signal">Privacy Policy</Link>
              </span>
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-signal py-2.5 text-sm font-medium text-white shadow-sm hover:bg-signal/90 disabled:opacity-50">
              {submitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/50 dark:text-paper/50">
            Already have an account? <Link href="/login" className="font-medium text-signal">Login</Link>
          </p>
        </div>

        {/* Illustration panel */}
        <div className="hidden flex-col justify-between border-l border-line p-10 dark:border-line-dark md:flex">
          <div className="flex items-center gap-2 self-end">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal text-white">
              <PlayIcon width={15} height={15} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-paper">ClipMind AI</span>
          </div>

          <div>
            <h2 className="max-w-xs font-display text-2xl font-semibold leading-snug tracking-tight text-ink dark:text-paper">
              Create your account and start transforming your videos with AI.
            </h2>
          </div>

          <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl bg-paper dark:bg-graphite-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
              </svg>
            </span>
            <div className="mt-4 h-2 w-28 rounded-full bg-line dark:bg-line-dark" />
            <div className="mt-2 h-2 w-16 rounded-full bg-line dark:bg-line-dark" />
          </div>
        </div>
      </div>
    </main>
  );
}
