import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FiUsers,
  FiSearch,
  FiShield,
  FiUser,
  FiBookOpen,
  FiBriefcase,
  FiMoreVertical,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export const Route = createFileRoute("/_authenticated/users")({
  component: UserManagementPage,
});

type UserRole =
  | "Content Creator"
  | "Learner"
  | "Educator"
  | "Administrator";

type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: "Active" | "Inactive";
};

const initialUsers: ManagedUser[] = [
  {
    id: 1,
    name: "chichi",
    email: "chichi@gmail.com",
    role: "Content Creator",
    status: "Active",
  },
  {
    id: 2,
    name: "ada",
    email: "ada@gmail.com",
    role: "Educator",
    status: "Active",
  },
  {
    id: 3,
    name: "Deepu",
    email: "deepu@gmail.com",
    role: "Learner",
    status: "Active",
  },
  {
    id: 4,
    name: "yuiop",
    email: "yuiop@gmail.com",
    role: "Administrator",
    status: "Active",
  },
];

function UserManagementPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | UserRole>("All");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "All" || item.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const counts = {
    total: users.length,
    creators: users.filter((u) => u.role === "Content Creator").length,
    learners: users.filter((u) => u.role === "Learner").length,
    educators: users.filter((u) => u.role === "Educator").length,
    administrators: users.filter((u) => u.role === "Administrator").length,
  };

  const updateRole = (id: number, role: UserRole) => {
    setUsers((current) =>
      current.map((item) =>
        item.id === id ? { ...item, role } : item
      )
    );
  };

  const toggleStatus = (id: number) => {
    setUsers((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Active" ? "Inactive" : "Active",
            }
          : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-7">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Administrator
        </div>

        <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">
              User Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Manage platform users, review assigned roles and monitor account
              status.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
            <FiShield />
            {user?.role || "Administrator"}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FiUsers />}
          label="Total users"
          value={counts.total}
        />

        <StatCard
          icon={<FiBriefcase />}
          label="Content creators"
          value={counts.creators}
        />

        <StatCard
          icon={<FiBookOpen />}
          label="Learners"
          value={counts.learners}
        />

        <StatCard
          icon={<FiUser />}
          label="Educators"
          value={counts.educators}
        />
      </div>

      {/* User table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border/60">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display text-xl">Platform users</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Review users and manage their platform roles.
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              {filteredUsers.length} user
              {filteredUsers.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="mt-4 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="w-full h-10 rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as "All" | UserRole)
              }
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
            >
              <option value="All">All roles</option>
              <option value="Content Creator">Content Creator</option>
              <option value="Learner">Learner</option>
              <option value="Educator">Educator</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-4 font-medium">User</th>
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center font-semibold">
                        {item.name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={item.role}
                      disabled={
                        item.email === user?.email &&
                        item.role === "Administrator"
                      }
                      onChange={(event) =>
                        updateRole(
                          item.id,
                          event.target.value as UserRole
                        )
                      }
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none"
                    >
                      <option value="Content Creator">
                        Content Creator
                      </option>
                      <option value="Learner">Learner</option>
                      <option value="Educator">Educator</option>
                      <option value="Administrator">
                        Administrator
                      </option>
                    </select>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleStatus(item.id)}
                      disabled={
                        item.email === user?.email &&
                        item.role === "Administrator"
                      }
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.status === "Active"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.status}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground"
                      title="More actions"
                    >
                      <FiMoreVertical />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Administrator note */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex gap-3">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FiShield />
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              Administrator access
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Your administrator account cannot be deactivated or reassigned
              from this screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-primary">
        {icon}
      </div>

      <div className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 font-display text-2xl">{value}</div>
    </div>
  );
}