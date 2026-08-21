import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../../components/PrimaryButton";
import { FiBell, FiLock, FiGlobe, FiChevronRight, FiX } from "react-icons/fi";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
        on ? "bg-gradient-primary" : "bg-muted"
      }`}
    >
      <div
        className={`h-5 w-5 rounded-full bg-white shadow-soft transition-transform ${
          on ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function SettingsPage() {
  const [notif, setNotif] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [autoSum, setAutoSum] = useState(true);

  const [activePanel, setActivePanel] = useState<
    "security" | "language" | null
  >(null);

  const [language, setLanguage] = useState("English");
  const [region, setRegion] = useState("India");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="text-muted-foreground">
          Configure processing and workspace preferences.
        </p>
      </div>

      <section className="rounded-3xl bg-card border border-border/60 divide-y divide-border/60">
        <div className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <FiBell />
          </div>

          <div className="flex-1">
            <div className="font-medium">Email notifications</div>
            <div className="text-xs text-muted-foreground">
              Get notified when processing completes.
            </div>
          </div>

          <Toggle on={notif} onChange={setNotif} />
        </div>

        <div className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <FiGlobe />
          </div>

          <div className="flex-1">
            <div className="font-medium">Research digest</div>
            <div className="text-xs text-muted-foreground">
              Weekly digest of processed recordings.
            </div>
          </div>

          <Toggle on={marketing} onChange={setMarketing} />
        </div>

        <div className="p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            ⚡
          </div>

          <div className="flex-1">
            <div className="font-medium">Auto-summarize on upload</div>
            <div className="text-xs text-muted-foreground">
              Generate summaries the moment a video finishes processing.
            </div>
          </div>

          <Toggle on={autoSum} onChange={setAutoSum} />
        </div>
      </section>

      <section className="rounded-3xl bg-card border border-border/60 divide-y divide-border/60">
        <button
          onClick={() => setActivePanel("security")}
          className="w-full p-5 flex items-center gap-4 hover:bg-muted/40 transition-colors"
        >
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <FiLock />
          </div>

          <div className="flex-1 text-left font-medium">
            Security & password
          </div>

          <FiChevronRight className="text-muted-foreground" />
        </button>

        <button
          onClick={() => setActivePanel("language")}
          className="w-full p-5 flex items-center gap-4 hover:bg-muted/40 transition-colors"
        >
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <FiGlobe />
          </div>

          <div className="flex-1 text-left font-medium">
            Language & region
          </div>

          <FiChevronRight className="text-muted-foreground" />
        </button>
      </section>

      {activePanel && (
        <div className="rounded-3xl bg-card border border-border/60 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl">
              {activePanel === "security"
                ? "Security & password"
                : "Language & region"}
            </h2>

            <button
              onClick={() => setActivePanel(null)}
              className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <FiX />
            </button>
          </div>

          {activePanel === "security" ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current password</label>
                <input
                  type="password"
                  className="mt-2 w-full h-11 rounded-xl border border-border bg-background px-3"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="text-sm font-medium">New password</label>
                <input
                  type="password"
                  className="mt-2 w-full h-11 rounded-xl border border-border bg-background px-3"
                  placeholder="Enter new password"
                />
              </div>

              <Button className="mt-2">Update password</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-2 w-full h-11 rounded-xl border border-border bg-background px-3"
                >
                  <option>English</option>
                  <option>Hindi</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="mt-2 w-full h-11 rounded-xl border border-border bg-background px-3"
                >
                  <option>India</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                </select>
              </div>

              <Button>Save preferences</Button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-destructive/30 p-6 bg-destructive/5">
        <h3 className="font-semibold text-destructive">Danger zone</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Deleting your account is permanent and can't be undone.
        </p>

        <Button
          variant="outline"
          className="mt-4 !border-destructive !text-destructive hover:!bg-destructive hover:!text-white"
        >
          Delete account
        </Button>
      </div>
    </div>
  );
}