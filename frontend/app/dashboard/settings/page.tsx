"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(true);
  const [message, setMessage] = useState("");

  const handleSave = () => {
    localStorage.setItem(
      "creator_settings",
      JSON.stringify({
        notifications,
        aiProcessing,
      })
    );

    setMessage("Settings saved successfully.");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
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
          Settings ⚙️
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          Manage your content creator preferences.
        </p>
      </div>

      {/* Success Message */}

      {message && (
        <div
          style={{
            maxWidth: "700px",
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "10px",
            background: "#064E3B",
            border: "1px solid #047857",
            color: "#A7F3D0",
          }}
        >
          {message}
        </div>
      )}

      {/* Preferences */}

      <div
        style={{
          maxWidth: "700px",
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "30px",
          marginBottom: "25px",
        }}
      >
        <h2
          style={{
            fontSize: "23px",
            fontWeight: "700",
            marginBottom: "20px",
          }}
        >
          Preferences
        </h2>

        {/* Notifications */}

        <SettingRow
          title="Notifications"
          description="Receive notifications about video processing and AI results."
          enabled={notifications}
          onChange={() => setNotifications(!notifications)}
        />

        {/* AI Processing */}

        <SettingRow
          title="AI Processing"
          description="Allow uploaded videos to be processed by AI services."
          enabled={aiProcessing}
          onChange={() => setAiProcessing(!aiProcessing)}
        />

        {/* Save */}

        <button
          onClick={handleSave}
          style={{
            marginTop: "25px",
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#2563EB",
            color: "white",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "600",
          }}
        >
          Save Settings
        </button>
      </div>

      {/* Account */}

      <div
        style={{
          maxWidth: "700px",
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "30px",
        }}
      >
        <h2
          style={{
            fontSize: "23px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Account
        </h2>

        <p
          style={{
            color: "#94A3B8",
            lineHeight: "1.6",
            marginBottom: "20px",
          }}
        >
          Sign out of your ClipMind AI account from this
          device.
        </p>

        <button
          onClick={handleLogout}
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            background: "#EF4444",
            color: "white",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "600",
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        padding: "18px 0",
        borderBottom: "1px solid #334155",
      }}
    >
      <div>
        <h3
          style={{
            fontSize: "17px",
            fontWeight: "600",
            marginBottom: "5px",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          {description}
        </p>
      </div>

      <button
        onClick={onChange}
        aria-label={`Toggle ${title}`}
        style={{
          width: "50px",
          height: "28px",
          borderRadius: "20px",
          border: "none",
          background: enabled ? "#2563EB" : "#475569",
          cursor: "pointer",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "4px",
            left: enabled ? "26px" : "4px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "white",
            transition: "0.2s",
          }}
        />
      </button>
    </div>
  );
}