import React, { useEffect, useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  UserCircle,
  Mail,
  CalendarDays,
  Users,
  Video,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const STORAGE_KEY = 'clipmind_admin_settings';

interface AdminSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  aiProcessing: boolean;
  autoProcessing: boolean;
}

const DEFAULT_SETTINGS: AdminSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  aiProcessing: true,
  autoProcessing: true,
};

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState<any>(null);

  const [maintenanceMode, setMaintenanceMode] = useState(
    DEFAULT_SETTINGS.maintenanceMode
  );
  const [registrationEnabled, setRegistrationEnabled] = useState(
    DEFAULT_SETTINGS.registrationEnabled
  );
  const [aiProcessing, setAiProcessing] = useState(
    DEFAULT_SETTINGS.aiProcessing
  );
  const [autoProcessing, setAutoProcessing] = useState(
    DEFAULT_SETTINGS.autoProcessing
  );
  const [saved, setSaved] = useState(false);

  // Load administrator platform statistics.
  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch((error) => {
        console.error('[ADMIN PROFILE] Failed to load analytics:', error);
      });
  }, []);

  // Load previously saved settings when the page opens.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return;
      }

      const settings = JSON.parse(stored) as Partial<AdminSettings>;

      setMaintenanceMode(
        settings.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode
      );

      setRegistrationEnabled(
        settings.registrationEnabled ??
          DEFAULT_SETTINGS.registrationEnabled
      );

      setAiProcessing(
        settings.aiProcessing ?? DEFAULT_SETTINGS.aiProcessing
      );

      setAutoProcessing(
        settings.autoProcessing ?? DEFAULT_SETTINGS.autoProcessing
      );
    } catch (error) {
      console.error(
        '[ADMIN SETTINGS] Failed to load saved settings:',
        error
      );

      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const getCurrentSettings = (): AdminSettings => ({
    maintenanceMode,
    registrationEnabled,
    aiProcessing,
    autoProcessing,
  });

  const handleSave = () => {
    const settings = getCurrentSettings();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const handleReset = () => {
    setMaintenanceMode(DEFAULT_SETTINGS.maintenanceMode);
    setRegistrationEnabled(DEFAULT_SETTINGS.registrationEnabled);
    setAiProcessing(DEFAULT_SETTINGS.aiProcessing);
    setAutoProcessing(DEFAULT_SETTINGS.autoProcessing);

    localStorage.removeItem(STORAGE_KEY);

    setSaved(false);
  };

  return (
    <div className="space-y-8 pb-16">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-red-400" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">
              System Settings
            </h1>

            <p className="text-xs text-slate-400 mt-1">
              Configure ClipMind AI platform behavior and administration controls.
            </p>
          </div>
        </div>
      </div>

      {/* Administrator Profile */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-purple-500/5 to-transparent" />

        <div className="relative p-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-500 via-purple-500 to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-red-500/20">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] font-black uppercase tracking-wide">
                <ShieldCheck className="w-3 h-3" />
                Administrator
              </div>

              <h2 className="text-2xl font-black text-white mt-3">
                {user?.name || 'Platform Administrator'}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email || 'Not available'}
                </span>

                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {user?.createdAt
                    ? `Joined ${new Date(user.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        year: 'numeric',
                      })}`
                    : 'Account date unavailable'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Administrator Account Details */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <AdminInfoCard
          icon={<UserCircle className="w-4 h-4" />}
          label="Full Name"
          value={user?.name || 'Not available'}
        />

        <AdminInfoCard
          icon={<Mail className="w-4 h-4" />}
          label="Email Address"
          value={user?.email || 'Not available'}
        />

        <AdminInfoCard
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Access Level"
          value="Administrator"
        />

      </section>

      {/* Platform Statistics */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-black text-white">
            Platform Overview
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Live platform statistics available to the administrator.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <AdminStatCard
            icon={<Users className="w-4 h-4" />}
            label="Users"
            value={analytics?.totalUsers ?? 0}
          />

          <AdminStatCard
            icon={<Video className="w-4 h-4" />}
            label="Videos"
            value={analytics?.totalVideos ?? 0}
          />

          <AdminStatCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Completed"
            value={analytics?.completedVideos ?? 0}
          />

          <AdminStatCard
            icon={<Activity className="w-4 h-4" />}
            label="Processing"
            value={analytics?.processingVideos ?? 0}
          />

        </div>
      </section>

      {/* Save notification */}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          Settings saved successfully.
        </div>
      )}

      {/* Platform Configuration */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-red-400" />

            <div>
              <h2 className="text-sm font-bold text-white">
                Platform Configuration
              </h2>

              <p className="text-[11px] text-slate-500 mt-1">
                Control access and platform availability.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-800/70">

          <SettingRow
            title="Maintenance Mode"
            description="Temporarily restrict normal platform access while maintenance is performed."
            enabled={maintenanceMode}
            onChange={setMaintenanceMode}
            danger
          />

          <SettingRow
            title="Public Registration"
            description="Allow new users to create Content Creator, Learner, or Educator accounts."
            enabled={registrationEnabled}
            onChange={setRegistrationEnabled}
          />

        </div>
      </section>

      {/* AI Processing */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-purple-400" />

            <div>
              <h2 className="text-sm font-bold text-white">
                AI Processing
              </h2>

              <p className="text-[11px] text-slate-500 mt-1">
                Manage video intelligence processing services.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-800/70">

          <SettingRow
            title="AI Processing Service"
            description="Enable Whisper transcription, BART summarization, and key moment detection."
            enabled={aiProcessing}
            onChange={setAiProcessing}
          />

          <SettingRow
            title="Automatic Video Processing"
            description="Automatically start the AI pipeline when a video upload is completed."
            enabled={autoProcessing}
            onChange={setAutoProcessing}
          />

        </div>
      </section>

      {/* Infrastructure */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-blue-400" />

            <div>
              <h2 className="text-sm font-bold text-white">
                Infrastructure
              </h2>

              <p className="text-[11px] text-slate-500 mt-1">
                Current ClipMind AI service configuration.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">

          <InfoCard
            icon={<Server className="w-4 h-4" />}
            title="Backend"
            value="FastAPI"
            detail="Port 8001"
          />

          <InfoCard
            icon={<Database className="w-4 h-4" />}
            title="Database"
            value="SQLAlchemy"
            detail="Database connected"
          />

          <InfoCard
            icon={<Cpu className="w-4 h-4" />}
            title="AI Pipeline"
            value="Enabled"
            detail="Whisper + BART"
          />

        </div>
      </section>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">

        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />

        <div>
          <p className="text-xs font-bold text-amber-300">
            Administrator controls
          </p>

          <p className="text-[11px] text-slate-500 mt-1 leading-5">
            These settings affect the platform experience. Backend authorization
            remains the source of truth for administrator permissions.
          </p>
        </div>

      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-red-500/20 hover:opacity-90 transition-all"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>

      </div>

    </div>
  );
};


/* =========================================================
   SETTING ROW
========================================================= */

interface SettingRowProps {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  danger?: boolean;
}

const AdminInfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
      {icon}
    </div>

    <p className="text-[9px] uppercase tracking-wider font-black text-slate-500 mt-4">
      {label}
    </p>

    <p className="text-sm font-bold text-white mt-1 truncate">
      {value}
    </p>
  </div>
);

const AdminStatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
}> = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
    <div className="flex items-center justify-between">
      <div className="w-8 h-8 rounded-lg bg-slate-800 text-red-400 flex items-center justify-center">
        {icon}
      </div>

      <span className="text-2xl font-black text-white">
        {value}
      </span>
    </div>

    <p className="text-[10px] uppercase tracking-wider font-black text-slate-500 mt-4">
      {label}
    </p>
  </div>
);

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  description,
  enabled,
  onChange,
  danger = false,
}) => {
  return (
    <div className="p-5 flex items-center justify-between gap-6">

      <div className="min-w-0">
        <h3 className="text-xs font-bold text-white">
          {title}
        </h3>

        <p className="text-[11px] text-slate-500 mt-1 leading-5 max-w-2xl">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-label={`${title} ${enabled ? 'enabled' : 'disabled'}`}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-all ${
          enabled
            ? danger
              ? 'bg-red-500'
              : 'bg-emerald-500'
            : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </button>

    </div>
  );
};


/* =========================================================
   INFO CARD
========================================================= */

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  title,
  value,
  detail,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">

      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-[10px] uppercase tracking-wider font-bold">
          {title}
        </span>
      </div>

      <p className="mt-4 text-sm font-black text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-emerald-400">
        ● {detail}
      </p>

    </div>
  );
};
