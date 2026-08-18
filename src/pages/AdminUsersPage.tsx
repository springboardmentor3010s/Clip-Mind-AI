import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  UserCog,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Video,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const loadUsers = async () => {
    setLoading(true);

    try {
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (
    userId: string,
    role: UserRole
  ) => {
    try {
      await api.updateUserRole(userId, role);

      setUsers((current) =>
        current.map((user) =>
          user.id === userId
            ? { ...user, role }
            : user
        )
      );
    } catch (error: any) {
      alert(
        error?.message ||
          'Failed to update user role.'
      );
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'ALL' ||
        user.role === roleFilter;

      const matchesSearch =
        !query ||
        user.name
          ?.toLowerCase()
          .includes(query) ||
        user.email
          ?.toLowerCase()
          .includes(query);

      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const roleCounts = useMemo(() => {
    return {
      total: users.length,
      creators: users.filter(
        (u) => u.role === 'CONTENT_CREATOR'
      ).length,
      learners: users.filter(
        (u) => u.role === 'LEARNER'
      ).length,
      educators: users.filter(
        (u) => u.role === 'EDUCATOR'
      ).length,
      admins: users.filter(
        (u) => u.role === 'ADMINISTRATOR'
      ).length,
    };
  }, [users]);

  return (
    <div className="space-y-7 pb-16">

      {/* HEADER */}
      <section>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">

          <div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-[10px] font-black uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Identity Management
            </div>

            <h1 className="mt-4 text-3xl font-black text-white">
              User Management
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage platform accounts, roles and access levels.
            </p>

          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/70 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            Refresh Users
          </button>

        </div>
      </section>

      {/* STAT CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">

        <StatCard
          label="Total"
          value={roleCounts.total}
          icon={Users}
        />

        <StatCard
          label="Creators"
          value={roleCounts.creators}
          icon={Video}
        />

        <StatCard
          label="Learners"
          value={roleCounts.learners}
          icon={BookOpen}
        />

        <StatCard
          label="Educators"
          value={roleCounts.educators}
          icon={GraduationCap}
        />

        <StatCard
          label="Admins"
          value={roleCounts.admins}
          icon={ShieldCheck}
        />

      </section>

      {/* SEARCH / FILTER */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">

        <div className="flex flex-col lg:flex-row gap-3">

          <div className="relative flex-1">

            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
            />

          </div>

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
            className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-semibold text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="ALL">
              All Roles
            </option>

            <option value="CONTENT_CREATOR">
              Content Creators
            </option>

            <option value="LEARNER">
              Learners
            </option>

            <option value="EDUCATOR">
              Educators
            </option>

            <option value="ADMINISTRATOR">
              Administrators
            </option>
          </select>

        </div>

      </section>

      {/* USER TABLE */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-800">

          <h2 className="text-sm font-bold text-white">
            Platform Accounts
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Showing {filteredUsers.length} of {users.length} users
          </p>

        </div>

        {loading ? (

          <div className="py-20 text-center">

            <RefreshCw className="w-7 h-7 text-blue-400 animate-spin mx-auto" />

            <p className="mt-4 text-sm text-slate-500">
              Loading users...
            </p>

          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="py-20 text-center">

            <Users className="w-9 h-9 text-slate-700 mx-auto" />

            <p className="mt-4 text-sm font-semibold text-slate-400">
              No users found
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-slate-950/70 border-b border-slate-800">

                <tr>

                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500">
                    Change Access
                  </th>

                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500">
                    Joined
                  </th>

                  <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-slate-500">
                    Last Login
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-800/70">

                {filteredUsers.map((user) => (

                  <tr
                    key={user.id}
                    className="hover:bg-slate-950/40 transition-colors"
                  >

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500/30 to-purple-500/30 border border-slate-700 flex items-center justify-center text-sm font-black text-white">
                          {user.name
                            ?.charAt(0)
                            .toUpperCase() || 'U'}
                        </div>

                        <div>

                          <p className="text-xs font-bold text-white">
                            {user.name}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-500">
                            {user.email}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-6 py-5">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-2">

                        <UserCog className="w-4 h-4 text-slate-600" />

                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value as UserRole
                            )
                          }
                          className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] font-semibold text-slate-300 outline-none focus:border-blue-500"
                        >

                          <option value="CONTENT_CREATOR">
                            CONTENT CREATOR
                          </option>

                          <option value="LEARNER">
                            LEARNER
                          </option>

                          <option value="EDUCATOR">
                            EDUCATOR
                          </option>

                          <option value="ADMINISTRATOR">
                            ADMINISTRATOR
                          </option>

                        </select>

                      </div>

                    </td>

                    <td className="px-6 py-5 text-[10px] text-slate-500 font-mono">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-6 py-5 text-[10px] text-slate-500">
                      {formatDate(
                        (user as any).lastLogin
                      )}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
}> = ({
  label,
  value,
  icon: Icon,
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-[9px] uppercase tracking-wider text-slate-600">
          {label}
        </p>

        <p className="mt-1 text-xl font-black text-white">
          {value}
        </p>

      </div>

      <Icon className="w-4 h-4 text-blue-400" />

    </div>

  </div>
);

const RoleBadge: React.FC<{
  role: UserRole;
}> = ({ role }) => {

  const styles: Record<string, string> = {
    ADMINISTRATOR:
      'bg-red-500/10 border-red-500/20 text-red-300',

    CONTENT_CREATOR:
      'bg-blue-500/10 border-blue-500/20 text-blue-300',

    EDUCATOR:
      'bg-purple-500/10 border-purple-500/20 text-purple-300',

    LEARNER:
      'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${
        styles[role] ||
        'bg-slate-800 border-slate-700 text-slate-400'
      }`}
    >
      {role.replace('_', ' ')}
    </span>
  );
};

const formatDate = (value?: string) => {
  if (!value) {
    return 'Never';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Never';
  }

  return date.toLocaleDateString();
};
