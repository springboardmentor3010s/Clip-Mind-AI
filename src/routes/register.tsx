import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { Input } from "../components/TextInput";
import { Button } from "../components/PrimaryButton";
import { AuthShell } from "../components/AuthShell";
import { ROLES, useAuth, type Role } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create an account — ClipMind AI" },
      { name: "description", content: "Register as a Content Creator, Learner, Educator or Administrator on the ClipMind AI video summarization platform." },
      { property: "og:title", content: "Create an account — ClipMind AI" },
      { property: "og:description", content: "Register for the ClipMind AI research workspace." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Content Creator");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, role);
      toast("Account created", "success");
      navigate({ to: "/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Choose the role that matches your work.">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} icon={<FiUser />} placeholder="Ada Lovelace" />
        <Input label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} icon={<FiMail />} placeholder="you@example.com" />
        <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} icon={<FiLock />} placeholder="At least 8 characters" />

        <div>
          <span className="mb-1.5 block text-sm font-medium">Role</span>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`h-11 w-full rounded-xl border px-2 text-sm font-medium transition-colors ${
                  role === r ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
