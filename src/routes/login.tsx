import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FiLock, FiMail } from "react-icons/fi";
import { Input } from "../components/TextInput";
import { Button } from "../components/PrimaryButton";
import { AuthShell } from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ClipMind AI" },
      { name: "description", content: "Sign in to the ClipMind AI video summarization research workspace." },
      { property: "og:title", content: "Sign in — ClipMind AI" },
      { property: "og:description", content: "Access transcripts, summaries, key moments and analytics for your recordings." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast(`Signed in as ${u.role}`, "success");
      navigate({ to: "/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Access your video summarization workspace.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} icon={<FiMail />} placeholder="you@example.com" />
        <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} icon={<FiLock />} placeholder="••••••••" />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">Sign in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account yet? <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
      </p>
    </AuthShell>
  );
}
