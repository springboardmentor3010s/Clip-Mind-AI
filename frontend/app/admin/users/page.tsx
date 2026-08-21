"use client";

import { useEffect, useState } from "react";
import {
  getAdminUsers,
  makeUserAdmin,
} from "@/services/admin";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error loading users:", error);

      setError(
        error?.response?.data?.detail ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleMakeAdmin = async (userId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to make this user an admin?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(userId);
      setError("");

      await makeUserAdmin(userId);

      await loadUsers();
    } catch (error: any) {
      console.error("Error making user admin:", error);

      setError(
        error?.response?.data?.detail ||
          "Unable to make user admin."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div
      style={{
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          User Management 👥
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          View registered users and manage administrator access.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: "25px",
            padding: "16px",
            borderRadius: "10px",
            background: "#451A1A",
            border: "1px solid #7F1D1D",
            color: "#FCA5A5",
          }}
        >
          {error}
        </div>
      )}

      {/* Users Card */}
      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
          overflowX: "auto",
        }}
      >
        {loading ? (
          <p
            style={{
              color: "#94A3B8",
              fontSize: "17px",
            }}
          >
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p
            style={{
              color: "#94A3B8",
              fontSize: "17px",
            }}
          >
            No users found.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Current Role</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={tdStyle}>
                    {user.id}
                  </td>

                  <td style={tdStyle}>
                    {user.username}
                  </td>

                  <td style={tdStyle}>
                    {user.email}
                  </td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "7px 12px",
                        borderRadius: "8px",
                        background:
                          user.role === "admin"
                            ? "#4C1D95"
                            : "#334155",
                        color: "white",
                        fontWeight: "600",
                      }}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    {user.role === "admin" ? (
                      <span
                        style={{
                          color: "#34D399",
                          fontWeight: "600",
                        }}
                      >
                        Admin
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          handleMakeAdmin(user.id)
                        }
                        disabled={
                          updatingId === user.id
                        }
                        style={{
                          padding: "9px 15px",
                          border: "none",
                          borderRadius: "8px",
                          background:
                            updatingId === user.id
                              ? "#475569"
                              : "#7C3AED",
                          color: "white",
                          cursor:
                            updatingId === user.id
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: "600",
                        }}
                      >
                        {updatingId === user.id
                          ? "Updating..."
                          : "Make Admin"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}

const thStyle = {
  textAlign: "left" as const,
  padding: "14px 12px",
  borderBottom: "1px solid #475569",
  color: "#CBD5E1",
  fontSize: "16px",
};

const tdStyle = {
  padding: "16px 12px",
  borderBottom: "1px solid #334155",
  color: "#E2E8F0",
};