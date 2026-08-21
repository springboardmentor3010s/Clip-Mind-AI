"use client";

import { useEffect, useState } from "react";

export default function PlatformSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(
      "clipmind_platform_settings"
    );

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);

      setMaintenanceMode(
        settings.maintenanceMode ?? false
      );

      setAllowRegistration(
        settings.allowRegistration ?? true
      );

      setAiProcessing(
        settings.aiProcessing ?? true
      );
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      maintenanceMode,
      allowRegistration,
      aiProcessing,
    };

    localStorage.setItem(
      "clipmind_platform_settings",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
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
          Platform Settings ⚙️
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          Configure basic ClipMind AI platform settings.
        </p>
      </div>

      {/* Success */}
      {saved && (
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
          Settings saved successfully.
        </div>
      )}

      {/* Settings Card */}
      <div
        style={{
          maxWidth: "850px",
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
        }}
      >
        <SettingRow
          title="Allow New Registrations"
          description="Allow new users to create accounts on ClipMind AI."
          enabled={allowRegistration}
          onChange={setAllowRegistration}
        />

        <SettingRow
          title="AI Processing"
          description="Enable video transcription, summaries and AI processing."
          enabled={aiProcessing}
          onChange={setAiProcessing}
        />

        <SettingRow
          title="Maintenance Mode"
          description="Temporarily place the platform in maintenance mode."
          enabled={maintenanceMode}
          onChange={setMaintenanceMode}
        />

        {/* Save Button */}
        <div
          style={{
            marginTop: "25px",
            paddingTop: "25px",
            borderTop: "1px solid #334155",
          }}
        >
          <button
            onClick={saveSettings}
            style={{
              padding: "12px 22px",
              borderRadius: "10px",
              border: "none",
              background: "#2563EB",
              color: "white",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Platform Information */}
      <div
        style={{
          maxWidth: "850px",
          marginTop: "25px",
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
        }}
      >
        <h2
          style={{
            fontSize: "23px",
            marginBottom: "20px",
          }}
        >
          Platform Information
        </h2>

        <InfoRow
          label="Platform"
          value="ClipMind AI"
        />

        <InfoRow
          label="Environment"
          value="Development"
        />

        <InfoRow
          label="AI Features"
          value="Enabled"
        />

        <InfoRow
          label="Platform Status"
          value={
            maintenanceMode
              ? "Maintenance"
              : "Operational"
          }
        />
      </div>
    </div>
  );
}

/* =========================================
   SETTING ROW
========================================= */

function SettingRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        padding: "20px 0",
        borderBottom: "1px solid #334155",
      }}
    >
      <div>
        <h3
          style={{
            fontSize: "18px",
            marginBottom: "7px",
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
        onClick={() => onChange(!enabled)}
        style={{
          minWidth: "70px",
          padding: "8px 14px",
          borderRadius: "20px",
          border: "none",
          background: enabled
            ? "#10B981"
            : "#475569",
          color: "white",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        {enabled ? "ON" : "OFF"}
      </button>
    </div>
  );
}

/* =========================================
   INFORMATION ROW
========================================= */

function InfoRow({
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
        padding: "14px 0",
        borderBottom: "1px solid #334155",
      }}
    >
      <span
        style={{
          color: "#94A3B8",
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontWeight: "600",
        }}
      >
        {value}
      </span>
    </div>
  );
}