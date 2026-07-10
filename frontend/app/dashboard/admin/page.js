"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    api.get("/api/v1/users").then((res) => setUsers(res.data)).catch(() => setError("Failed to load users.")).finally(() => setLoading(false));
  }, []);

  const active = users.filter((u) => u.is_active).length;
  const inactive = users.length - active;

  async function toggleActive(user) {
    setUpdatingId(user.id);
    try {
      const endpoint = user.is_active ? "deactivate" : "activate";
      const res = await api.patch(`/api/v1/users/${user.id}/${endpoint}`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update user.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-8 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">User Management</h1>

      {!loading && !error && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Total users</p>
            <p className="mt-2 font-mono text-2xl tabular-nums text-ink dark:text-paper">{users.length}</p>
          </div>
          <div className="rounded-lg border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Active</p>
            <p className="mt-2 font-mono text-2xl tabular-nums text-ok">{active}</p>
          </div>
          <div className="rounded-lg border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Inactive</p>
            <p className="mt-2 font-mono text-2xl tabular-nums text-danger">{inactive}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line dark:border-line-dark">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:bg-ink dark:text-paper/50">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-cloud dark:divide-line-dark dark:bg-graphite">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-ink dark:text-paper">{u.full_name}</td>
                  <td className="px-4 py-3 text-ink/60 dark:text-paper/60">{u.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60 dark:text-paper/60">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide">
                      <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-ok" : "bg-danger"}`} />
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={updatingId === u.id}
                      className={`rounded-md border px-3 py-1 font-mono text-[11px] uppercase tracking-wide disabled:opacity-50 ${
                        u.is_active
                          ? "border-danger text-danger hover:bg-danger/10"
                          : "border-ok text-ok hover:bg-ok/10"
                      }`}
                    >
                      {updatingId === u.id ? "..." : u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}