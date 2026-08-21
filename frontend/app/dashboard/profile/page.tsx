"use client";

import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

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
          My Profile 👤
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          View your account information and profile details.
        </p>
      </div>

      {/* Profile Card */}

      <div
        style={{
          maxWidth: "700px",
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "30px",
        }}
      >
        {/* Avatar */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "75px",
              height: "75px",
              borderRadius: "50%",
              background: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "700",
            }}
          >
            {user?.username
              ? user.username.charAt(0).toUpperCase()
              : "U"}
          </div>

          <div>
            <h2
              style={{
                fontSize: "25px",
                fontWeight: "700",
                marginBottom: "5px",
              }}
            >
              {user?.username || "User"}
            </h2>

            <p
              style={{
                color: "#94A3B8",
              }}
            >
              Content Creator
            </p>
          </div>
        </div>

        {/* Account Information */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <ProfileRow
            label="Username"
            value={user?.username || "Not available"}
          />

          <ProfileRow
            label="Email"
            value={user?.email || "Not available"}
          />

          <ProfileRow
            label="Role"
            value={user?.role || "creator"}
          />

          <ProfileRow
            label="User ID"
            value={
              user?.id !== undefined
                ? String(user.id)
                : "Not available"
            }
          />
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        padding: "16px",
        background: "#0F172A",
        borderRadius: "10px",
        border: "1px solid #334155",
      }}
    >
      <span
        style={{
          color: "#94A3B8",
          fontSize: "15px",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: "#F8FAFC",
          fontWeight: "600",
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}