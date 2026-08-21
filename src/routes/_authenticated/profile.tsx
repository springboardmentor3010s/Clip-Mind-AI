import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../../components/TextInput";
import { Button } from "../../components/PrimaryButton";
import { FiUser, FiMail, FiAward, FiEdit3 } from "react-icons/fi";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useAuth();
  const initials = user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl glass-strong p-8 flex items-center gap-6 flex-wrap">
        <div className="h-24 w-24 rounded-3xl bg-gradient-primary text-white flex items-center justify-center text-3xl font-display shadow-glow">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl">{user?.name}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
            <FiAward /> {user?.role}
          </div>
        </div>
        <Button variant="outline" icon={<FiEdit3 />}>Edit profile</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Videos processed", value: "24" },
          { label: "Watch time saved", value: "18h 42m" },
          { label: "AI actions", value: "1,204" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl bg-card border border-border/60 p-6">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="font-display text-3xl mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-card border border-border/60 p-6 space-y-4">
        <h2 className="font-display text-xl">Account details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Full name" defaultValue={user?.name} icon={<FiUser />} />
          <Input label="Email" defaultValue={user?.email} icon={<FiMail />} />
        </div>
        <div className="flex justify-end">
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
