"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUserPlus,
  FaUserShield,
  FaUserCheck,
  FaUserTimes,
  FaCrown,
  FaSyncAlt,
} from "react-icons/fa";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/services/authService";
import {
  getAdminUsers,
  createAdminUser,
  promoteUserToAdmin,
  updateUserStatus,
} from "@/services/adminService";

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
  username: "",
  full_name: "",
  email: "",
  password: "",
  role: "LEARNER",
});

  // --------------------------------------------------
  // Load current admin + users
  // --------------------------------------------------

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const meResponse = await getCurrentUser(token);

      if (meResponse?.user?.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }

      setCurrentUser(meResponse.user);

      const usersResponse = await getAdminUsers();

      setUsers(usersResponse || []);
    } catch (err) {
      console.error("Failed to load users:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // --------------------------------------------------
  // Create user
  // --------------------------------------------------

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await createAdminUser(formData);

      setSuccess("User created successfully.");

      setFormData({
        username: "",
        full_name: "",
        email: "",
        password: "",
        role: "LEARNER",
      });

      setShowCreateForm(false);

      await loadUsers();
    } catch (err) {
      console.error("Failed to create user:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to create user. Please check the entered details."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Promote user to administrator
  // --------------------------------------------------

  const handlePromote = async (user) => {
    if (isCurrentUser(user)) {
      setError("You cannot change your own administrator role.");
      return;
    }

    const confirmed = window.confirm(
      `Promote "${user.username}" to Administrator?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await promoteUserToAdmin(user.id);

      setSuccess(`${user.username} is now an Administrator.`);

      await loadUsers();
    } catch (err) {
      console.error("Failed to promote user:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to promote this user to Administrator."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Activate / deactivate user
  // --------------------------------------------------

  const handleStatusChange = async (user) => {
    if (isCurrentUser(user)) {
      setError("You cannot deactivate your own account.");
      return;
    }

    const newStatus = !user.is_active;

    const action = newStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${user.username}"?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await updateUserStatus(user.id, newStatus);

      setSuccess(
        `${user.username} has been ${newStatus ? "activated" : "deactivated"}.`
      );

      await loadUsers();
    } catch (err) {
      console.error("Failed to update user status:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to update the user's status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const isCurrentUser = (user) => {
    if (!currentUser || !user) return false;

    return String(currentUser.id) === String(user.id);
  };

  const getRoleBadge = (role) => {
    const styles = {
      ADMIN: "bg-purple-100 text-purple-700",
      EDUCATOR: "bg-blue-100 text-blue-700",
      CONTENT_CREATOR: "bg-orange-100 text-orange-700",
      LEARNER: "bg-green-100 text-green-700",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[role] || "bg-gray-100 text-gray-700"
        }`}
      >
        {role?.replace("_", " ")}
      </span>
    );
  };

  const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString();
};

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Manage Users & Roles
            </h1>

            <p className="mt-1 text-slate-500">
              Manage user accounts, roles, and account status across ClipMind
              AI.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadUsers}
              disabled={loading || actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              <FaSyncAlt />
              Refresh
            </button>

            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setError("");
                setSuccess("");
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              <FaUserPlus />
              Create User
            </button>
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <FaUserPlus />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Create New User
                </h2>

                <p className="text-sm text-slate-500">
                  Create a user account and assign an initial role.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>

                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      username: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter username"
                />
              </div>

              {/* Full Name */}
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                </label>

                <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                    setFormData({
                        ...formData,
                        full_name: e.target.value,
                    })
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter full name"
                />
                </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>

                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter password"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role
                </label>

                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="LEARNER">Learner</option>
                  <option value="EDUCATOR">Educator</option>
                  <option value="CONTENT_CREATOR">
                    Content Creator
                  </option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-500">Total Users</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {users.length}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-500">Active Users</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {users.filter((user) => user.is_active).length}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-500">Administrators</p>
            <p className="mt-2 text-3xl font-bold text-purple-600">
              {users.filter((user) => user.role === "ADMIN").length}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm text-slate-500">Inactive Users</p>
            <p className="mt-2 text-3xl font-bold text-red-500">
              {users.filter((user) => !user.is_active).length}
            </p>
          </div>

        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              Platform Users
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              View and manage all registered ClipMind AI users.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      User
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Role
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Status
                    </th>

                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Created
                    </th>

                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {users.map((user) => {
                    const self = isCurrentUser(user);

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50 transition"
                      >

                        {/* User */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                              {user.role === "ADMIN" ? (
                                <FaUserShield />
                              ) : (
                                <FaUserCheck />
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {user.username}
                                {self && (
                                  <span className="ml-2 text-xs text-purple-600 font-medium">
                                    (You)
                                  </span>
                                )}
                              </p>

                              <p className="text-sm text-slate-500">
                                {user.email}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          {getRoleBadge(user.role)}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">

                          {user.is_active ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              Inactive
                            </span>
                          )}

                        </td>

                        {/* Created */}
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(user.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">

                          {self ? (
                            <span className="text-xs text-slate-400">
                              Current account
                            </span>
                          ) : (
                            <div className="flex justify-end gap-2">

                              {/* Promote */}
                              {user.role !== "ADMIN" && (
                                <button
                                  onClick={() => handlePromote(user)}
                                  disabled={actionLoading}
                                  title="Promote to Administrator"
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-medium disabled:opacity-50"
                                >
                                  <FaCrown />
                                  Promote
                                </button>
                              )}

                              {/* Activate / deactivate */}
                              <button
                                onClick={() => handleStatusChange(user)}
                                disabled={actionLoading}
                                title={
                                  user.is_active
                                    ? "Deactivate user"
                                    : "Activate user"
                                }
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 ${
                                  user.is_active
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-green-50 text-green-700 hover:bg-green-100"
                                }`}
                              >
                                {user.is_active ? (
                                  <>
                                    <FaUserTimes />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <FaUserCheck />
                                    Activate
                                  </>
                                )}
                              </button>

                            </div>
                          )}

                        </td>

                      </tr>
                    );
                  })}

                </tbody>
              </table>

            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}