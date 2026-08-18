import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Search,
  RefreshCw,
  User,
  ShieldCheck,
  Video,
  UserPlus,
  LogIn,
  Trash2,
  Settings,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';

interface ActivityItem {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  details?: string;
  timestamp?: string;
}

export const AdminActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const loadLogs = async () => {
    setLoading(true);

    try {
      const data = await api.getAdminActivity();
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const actions = useMemo(() => {
    return [
      'ALL',
      ...Array.from(
        new Set(logs.map((log) => log.action))
      ),
    ];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.toLowerCase().trim();

    return logs.filter((log) => {
      const matchesAction =
        actionFilter === 'ALL' ||
        log.action === actionFilter;

      const searchable = [
        log.action,
        log.details,
        log.userName,
        log.userEmail,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesAction &&
        (!query || searchable.includes(query))
      );
    });
  }, [logs, search, actionFilter]);

  const getIcon = (action: string) => {
    const value = action.toUpperCase();

    if (value.includes('LOGIN')) {
      return LogIn;
    }

    if (value.includes('REGISTER')) {
      return UserPlus;
    }

    if (value.includes('VIDEO')) {
      return Video;
    }

    if (value.includes('ROLE')) {
      return ShieldCheck;
    }

    if (
      value.includes('DELETE') ||
      value.includes('REMOVE')
    ) {
      return Trash2;
    }

    if (
      value.includes('SETTING') ||
      value.includes('SYSTEM')
    ) {
      return Settings;
    }

    return Activity;
  };

  const getIconStyle = (action: string) => {
    const value = action.toUpperCase();

    if (value.includes('LOGIN')) {
      return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    }

    if (value.includes('REGISTER')) {
      return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }

    if (value.includes('VIDEO')) {
      return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
    }

    if (value.includes('ROLE')) {
      return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    }

    if (
      value.includes('DELETE') ||
      value.includes('REMOVE')
    ) {
      return 'bg-red-500/10 border-red-500/20 text-red-400';
    }

    return 'bg-slate-800 border-slate-700 text-slate-400';
  };

  return (
    <div className="space-y-7 pb-16">

      {/* HEADER */}
      <section>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">

          <div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 text-[10px] font-black uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              Audit Trail
            </div>

            <h1 className="mt-4 text-3xl font-black text-white">
              Activity Logs
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Review important events and actions performed
              across the ClipMind platform.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/70">
              <p className="text-[9px] uppercase tracking-wider text-slate-600">
                Events
              </p>

              <p className="text-lg font-black text-white">
                {logs.length}
              </p>
            </div>

            <button
              type="button"
              onClick={loadLogs}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/70 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </button>

          </div>

        </div>
      </section>

      {/* FILTER BAR */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">

        <div className="flex flex-col lg:flex-row gap-3">

          <div className="relative flex-1">

            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search user, email, action or details..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none focus:border-purple-500"
            />

          </div>

          <div className="relative">

            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />

            <select
              value={actionFilter}
              onChange={(e) =>
                setActionFilter(e.target.value)
              }
              className="min-w-[190px] appearance-none rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-8 text-xs font-semibold text-slate-300 outline-none focus:border-purple-500"
            >
              {actions.map((action) => (
                <option
                  key={action}
                  value={action}
                >
                  {action === 'ALL'
                    ? 'All Activities'
                    : action}
                </option>
              ))}
            </select>

          </div>

        </div>

      </section>

      {/* LOGS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-800">

          <h2 className="text-sm font-bold text-white">
            Platform Audit Trail
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Showing {filteredLogs.length} of {logs.length} events
          </p>

        </div>

        {loading ? (

          <div className="py-20 text-center">

            <RefreshCw className="w-7 h-7 text-purple-400 animate-spin mx-auto" />

            <p className="mt-4 text-sm text-slate-500">
              Loading activity...
            </p>

          </div>

        ) : filteredLogs.length === 0 ? (

          <div className="py-20 text-center">

            <Activity className="w-9 h-9 text-slate-700 mx-auto" />

            <p className="mt-4 text-sm font-semibold text-slate-400">
              No activity found
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Try changing your search or filter.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-800/70">

            {filteredLogs.map((log) => {

              const Icon = getIcon(log.action);

              return (
                <div
                  key={log.id}
                  className="px-6 py-5 hover:bg-slate-950/40 transition-colors"
                >

                  <div className="flex items-start gap-4">

                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${getIconStyle(
                        log.action
                      )}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                        <div className="flex items-center gap-2 flex-wrap">

                          <span className="text-xs font-black text-white">
                            {log.action}
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[9px] text-slate-400">
                            AUDIT
                          </span>

                        </div>

                        <span className="text-[10px] text-slate-600">
                          {formatDate(log.timestamp)}
                        </span>

                      </div>

                      <p className="mt-2 text-xs text-slate-400 leading-5">
                        {log.details || 'System event recorded.'}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">

                        <div className="flex items-center gap-1.5">

                          <User className="w-3.5 h-3.5 text-slate-600" />

                          <span className="text-[10px] font-semibold text-slate-500">
                            {log.userName || 'System'}
                          </span>

                        </div>

                        {log.userEmail && (
                          <span className="text-[10px] text-slate-600">
                            {log.userEmail}
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </section>

    </div>
  );
};

const formatDate = (value?: string) => {
  if (!value) {
    return 'Unknown time';
  }

  try {
    return new Date(value).toLocaleString(
      undefined,
      {
        dateStyle: 'medium',
        timeStyle: 'short',
      }
    );
  } catch {
    return value;
  }
};
