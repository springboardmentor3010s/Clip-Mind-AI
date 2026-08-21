import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FiMail, FiCheckCircle } from "react-icons/fi";
import { Input } from "../components/TextInput";
import { Button } from "../components/PrimaryButton";
import { AuthShell } from "../components/AuthShell";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8001/api";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to process the request.",
        );
      }

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process the request.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll help you reset your password securely."
    >
      {sent ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <FiCheckCircle className="text-2xl" />
          </div>

          <h3 className="mb-1 text-lg font-semibold">
            Request received
          </h3>

          <p className="text-sm text-muted-foreground">
            If{" "}
            <span className="text-foreground">{email}</span>{" "}
            is registered, password-reset instructions will be provided.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<FiMail />}
            placeholder="you@company.com"
          />

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remember it?{" "}
        <Link
          to="/login"
          className="font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}