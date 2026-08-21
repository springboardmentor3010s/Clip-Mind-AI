import React, { useEffect, useState } from "react";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platformName: "ClipMind AI",
    allowRegistration: true,
    allowLearnerUpload: false,
    autoProcessing: true,
    maintenanceMode: false,
    maxUploadSize: "500",
    processingEngine: "Whisper + BART",
  });

  useEffect(() => {
    const saved = localStorage.getItem("adminSettings");

    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        console.log("Unable to load saved settings");
      }
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = () => {
    localStorage.setItem(
      "adminSettings",
      JSON.stringify(settings)
    );

    alert("Platform settings saved successfully!");
  };

  const resetSettings = () => {
    const defaults = {
      platformName: "ClipMind AI",
      allowRegistration: true,
      allowLearnerUpload: false,
      autoProcessing: true,
      maintenanceMode: false,
      maxUploadSize: "500",
      processingEngine: "Whisper + BART",
    };

    setSettings(defaults);

    localStorage.setItem(
      "adminSettings",
      JSON.stringify(defaults)
    );

    alert("Settings restored to default.");
  };

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>⚙️ Platform Settings</h1>

          <p style={styles.subtitle}>
            Configure ClipMind AI platform behavior and system preferences.
          </p>
        </div>

        <div style={styles.adminBadge}>
          Administrator
        </div>
      </div>

      <div style={styles.grid}>

        {/* GENERAL */}

        <div style={styles.card}>
          <h2>🏢 General Settings</h2>

          <label style={styles.label}>
            Platform Name
          </label>

          <input
            style={styles.input}
            value={settings.platformName}
            onChange={(e) =>
              updateSetting(
                "platformName",
                e.target.value
              )
            }
          />

          <label style={styles.label}>
            Maximum Upload Size (MB)
          </label>

          <input
            type="number"
            style={styles.input}
            value={settings.maxUploadSize}
            onChange={(e) =>
              updateSetting(
                "maxUploadSize",
                e.target.value
              )
            }
          />
        </div>

        {/* USER ACCESS */}

        <div style={styles.card}>
          <h2>👥 User Access</h2>

          <SettingToggle
            label="Allow New User Registration"
            value={settings.allowRegistration}
            onChange={(value) =>
              updateSetting(
                "allowRegistration",
                value
              )
            }
          />

          <SettingToggle
            label="Allow Learners to Upload Videos"
            value={settings.allowLearnerUpload}
            onChange={(value) =>
              updateSetting(
                "allowLearnerUpload",
                value
              )
            }
          />
        </div>

        {/* AI */}

        <div style={styles.card}>
          <h2>🤖 AI Processing</h2>

          <label style={styles.label}>
            Processing Engine
          </label>

          <select
            style={styles.input}
            value={settings.processingEngine}
            onChange={(e) =>
              updateSetting(
                "processingEngine",
                e.target.value
              )
            }
          >
            <option>Whisper + BART</option>
            <option>Whisper + T5</option>
            <option>Whisper + BART + Key Moments</option>
          </select>

          <SettingToggle
            label="Automatic AI Processing"
            value={settings.autoProcessing}
            onChange={(value) =>
              updateSetting(
                "autoProcessing",
                value
              )
            }
          />
        </div>

        {/* SYSTEM */}

        <div style={styles.card}>
          <h2>🖥️ System</h2>

          <SettingToggle
            label="Maintenance Mode"
            value={settings.maintenanceMode}
            onChange={(value) =>
              updateSetting(
                "maintenanceMode",
                value
              )
            }
          />

          <div style={styles.status}>
            <span style={styles.statusDot}></span>
            System Operational
          </div>
        </div>

      </div>

      <div style={styles.actions}>

        <button
          style={styles.save}
          onClick={saveSettings}
        >
          💾 Save Settings
        </button>

        <button
          style={styles.reset}
          onClick={resetSettings}
        >
          ↻ Reset Defaults
        </button>

      </div>

    </div>
  );
};


const SettingToggle = ({
  label,
  value,
  onChange,
}) => {
  return (
    <div style={styles.toggleRow}>

      <span>{label}</span>

      <button
        onClick={() => onChange(!value)}
        style={{
          ...styles.toggle,
          background: value
            ? "#16a34a"
            : "#9ca3af",
        }}
      >
        <span
          style={{
            ...styles.toggleCircle,
            transform: value
              ? "translateX(20px)"
              : "translateX(0)",
          }}
        />
      </button>

    </div>
  );
};


const styles = {

  page: {
    minHeight: "100vh",
    padding: "35px",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#111827",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
  },

  adminBadge: {
    background: "#111827",
    color: "white",
    padding: "10px 18px",
    borderRadius: "20px",
    fontSize: "14px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "22px",
  },

  card: {
    background: "white",
    padding: "25px",
    borderRadius: "16px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.06)",
  },

  label: {
    display: "block",
    marginTop: "20px",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#374151",
  },

  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "14px",
  },

  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 0",
    borderBottom: "1px solid #eee",
    gap: "15px",
  },

  toggle: {
    width: "44px",
    height: "24px",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    padding: "2px",
    transition: "0.2s",
  },

  toggleCircle: {
    display: "block",
    width: "20px",
    height: "20px",
    background: "white",
    borderRadius: "50%",
    transition: "0.2s",
  },

  status: {
    marginTop: "25px",
    padding: "12px",
    background: "#ecfdf5",
    color: "#166534",
    borderRadius: "8px",
  },

  statusDot: {
    display: "inline-block",
    width: "9px",
    height: "9px",
    background: "#16a34a",
    borderRadius: "50%",
    marginRight: "8px",
  },

  actions: {
    display: "flex",
    gap: "15px",
    marginTop: "25px",
  },

  save: {
    border: "none",
    background: "#111827",
    color: "white",
    padding: "13px 22px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  reset: {
    border: "1px solid #d1d5db",
    background: "white",
    padding: "13px 22px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};

export default AdminSettings;
