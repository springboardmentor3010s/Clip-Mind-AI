"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "../../lib/api";
import { PlayIcon } from "../../components/ui/icons";
import { getPasswordStrength, STRENGTH_COLORS } from "../../lib/passwordStrength";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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
      await api.post("/api/v1/auth/reset-password", { token, new_password: password });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "This reset link is invalid or has expired.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Invalid link</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
          This password reset link is missing or malformed. Request a new one below.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm font-medium text-signal">
          &larr; Request a new link
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Password updated</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
          Your password has been reset. You can now log in with your new password.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-6 w-full rounded-lg bg-signal py-2.5 text-sm font-medium text-white shadow-sm hover:bg-signal/90"
        >
          Go to login
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Reset your password</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label className="text-xs font-medium text-ink/60 dark:text-paper/60">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a new password"
            className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30"
          />
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i <= strength.score ? STRENGTH_COLORS[strength.score] : "bg-line dark:bg-line-dark"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-ink/50 dark:text-paper/50">{strength.label}</p>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Confirm new password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            className={`mt-1.5 w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 dark:text-paper dark:placeholder:text-paper/30 ${
              passwordsMismatch ? "border-danger focus:ring-danger/15" : "border-line focus:border-signal focus:ring-signal/15 dark:border-line-dark"
            }`}
          />
          {passwordsMismatch && <p className="mt-1 text-xs text-danger">Passwords do not match.</p>}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-signal py-2.5 text-sm font-medium text-white shadow-sm hover:bg-signal/90 disabled:opacity-50"
        >
          {submitting ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6 dark:bg-ink">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-cloud p-8 shadow-sm dark:border-line-dark dark:bg-graphite sm:p-10">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal text-white">
            <PlayIcon width={15} height={15} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-paper">ClipMind AI</span>
        </div>

        <Suspense fallback={<p className="text-sm text-ink/50 dark:text-paper/50">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}