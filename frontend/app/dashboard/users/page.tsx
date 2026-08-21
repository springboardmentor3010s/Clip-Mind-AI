"use client";

import { useEffect, useState } from "react";
import {
  getAdminUsers,
  makeUserAdmin,
} from "@/services/admin";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async (userId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to make this user an admin?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdating(userId);
      setError("");
      setSuccess("");

      await makeUserAdmin(userId);

      setSuccess(
        "User has been successfully promoted to admin."
      );

      await loadUsers();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to promote user."
      );
    } finally {
      setUpdating(null);
    }
  };

  return (
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
            marginBottom: "20px",
            padding: "15px",
            borderRadius: "10px",
            background: "#451A1A",
            border: "1px solid #7F1D1D",
            color: "#FCA5A5",
          }}
        >
          {error}
        </div>
      )}

      {/* Success */}

      {success && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            borderRadius: "10px",
            background: "#064E3B",
            border: "1px solid #047857",
            color: "#A7F3D0",
          }}
        >
          {success}
        </div>
      )}

      {/* Users */}

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
              padding: "20px",
            }}
          >
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p
            style={{
              color: "#94A3B8",
              padding: "20px",
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
                        fontSize: "14px",
                      }}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    {user.role === "admin" ? (
                      <span
                        style={{
                          color: "#86EFAC",
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
                          updating === user.id
                        }
                        style={{
                          padding: "9px 14px",
                          borderRadius: "8px",
                          border: "none",
                          background:
                            updating === user.id
                              ? "#475569"
                              : "#2563EB",
                          color: "white",
                          cursor:
                            updating === user.id
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: "600",
                        }}
                      >
                        {updating === user.id
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
  );
}

const thStyle = {
  textAlign: "left" as const,
  padding: "14px",
  borderBottom: "1px solid #475569",
  color: "#CBD5E1",
};

const tdStyle = {
  padding: "16px 14px",
  borderBottom: "1px solid #334155",
  color: "#E2E8F0",
};