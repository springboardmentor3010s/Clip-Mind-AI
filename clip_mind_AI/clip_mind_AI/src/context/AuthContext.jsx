/**
 * AuthContext — global authentication state for ClipMind AI.
 *
 * Provides: user, loading, login, register, logout, forgotPassword, resetPassword.
 *
 * Token strategy:
 *  - access_token  → localStorage (short-lived, 60 min)
 *  - refresh_token → localStorage (rotated, 7 days)
 *
 * On mount the context tries to restore the session by fetching /auth/profile
 * with the stored access token. The Axios interceptor in api.js handles silent
 * refresh if the access token is expired.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  /** true while the initial session-restore check is running */
  const [loading, setLoading] = useState(true);

  // ── Restore session on page load ────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const hasTokens =
        localStorage.getItem("access_token") ||
        localStorage.getItem("refresh_token");

      if (!hasTokens) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/profile");
        if (res.data.success) {
          setUser(res.data.data);
        }
      } catch {
        // Tokens invalid / expired and refresh failed — user stays logged out.
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { user: userData, tokens } = res.data.data;

    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    setUser(userData);

    return userData;
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(
    async (firstName, lastName, email, password, confirmPassword, role = "learner") => {
      const res = await api.post("/auth/register", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        confirm_password: confirmPassword,
        role,
      });
      return res.data;
    },
    []
  );

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refresh: refreshToken });
      }
    } catch {
      // Ignore network errors — tokens will be cleared locally regardless.
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  }, []);

  // ── Forgot Password ──────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  }, []);

  // ── Reset Password ───────────────────────────────────────────────────────
  const resetPassword = useCallback(async (token, password, confirmPassword) => {
    const res = await api.post("/auth/reset-password", {
      token,
      password,
      confirm_password: confirmPassword,
    });
    return res.data;
  }, []);

  // ── Change Password ──────────────────────────────────────────────────────
  const changePassword = useCallback(async (oldPassword, newPassword, confirmPassword) => {
    const res = await api.post("/auth/change-password", {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return res.data;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}
