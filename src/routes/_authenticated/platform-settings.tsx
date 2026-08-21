import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  FiSettings,
  FiSave,
  FiShield,
  FiDatabase,
  FiCpu,
} from "react-icons/fi";

export const Route = createFileRoute(
  "/_authenticated/platform-settings"
)({
  component: PlatformSettingsPage,
});

function PlatformSettingsPage() {
  const [processingEnabled, setProcessingEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-7">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center">
            <FiSettings className="text-white text-xl" />
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Administrator
            </div>

            <h1 className="mt-1 font-display text-3xl font-semibold">
              Platform Settings
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Configure ClipMind platform behaviour and system controls.
            </p>
          </div>
        </div>
      </div>

      {/* System controls */}
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <FiCpu className="text-primary" />
            <div>
              <h2 className="font-display text-lg font-semibold">
                Processing & AI
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Control platform processing services.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          <SettingRow
            title="Video processing"
            description="Allow uploaded recordings to enter the processing pipeline."
            enabled={processingEnabled}
            onChange={setProcessingEnabled}
          />

          <SettingRow
            title="AI services"
            description="Enable transcript, summary, key moment and analytics generation."
            enabled={aiEnabled}
            onChange={setAiEnabled}
          />
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <FiShield className="text-primary" />
            <div>
              <h2 className="font-display text-lg font-semibold">
                Security & Access
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Platform-level access configuration.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-medium">
              Role-based access control
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Administrator, Content Creator, Educator and Learner roles are
              enforced across the platform.
            </p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Active
            </div>
          </div>
        </div>
      </section>

      {/* Storage */}
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <FiDatabase className="text-primary" />
            <div>
              <h2 className="font-display text-lg font-semibold">
                Storage & System
              </h2>

              <p className="text-xs text-muted-foreground mt-1">
                Platform storage and maintenance controls.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          <SettingRow
            title="Maintenance mode"
            description="Temporarily restrict normal platform operations."
            enabled={maintenanceMode}
            onChange={setMaintenanceMode}
          />

          <div className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm font-medium">Database status</p>
              <p className="text-xs text-muted-foreground mt-1">
                Current platform database connection.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Connected
            </span>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-primary px-5 text-sm font-medium text-white shadow-glow"
        >
          <FiSave />

          {saved ? "Settings saved" : "Save settings"}
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
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 p-6">
      <div>
        <p className="text-sm font-medium">{title}</p>

        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
        aria-label={`Toggle ${title}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}