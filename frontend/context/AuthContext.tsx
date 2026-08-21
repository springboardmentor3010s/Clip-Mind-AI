"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { login as loginService } from "@/services/auth";
import { LoginData, CurrentUser, normalizeRole } from "@/types/auth";
import { getCurrentUser } from "@/services/user";

interface AuthContextType {
  token: string | null;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: LoginData) => Promise<CurrentUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem("token");

      // No token means user is not logged in
      if (!savedToken) {
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Set token first
        setToken(savedToken);

        // Get logged-in user's details
        const currentUser = await getCurrentUser();
        const normalizedRole = normalizeRole(currentUser.role);

        if (!normalizedRole) {
          throw new Error(`Unsupported user role: ${currentUser.role}`);
        }

        const normalizedUser: CurrentUser = {
          ...currentUser,
          role: normalizedRole,
        };

        console.log("CURRENT USER:", normalizedUser);
        console.log("CURRENT USER ROLE:", normalizedUser.role);

        setUser(normalizedUser);
      } catch (error) {
        console.error("Failed to load user:", error);

        localStorage.removeItem("token");

        setToken(null);
        setUser(null);
      } finally {
        // User loading is completely finished
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (data: LoginData): Promise<CurrentUser> => {
    try {
      setLoading(true);

      const response = await loginService(data);

      localStorage.setItem(
        "token",
        response.access_token
      );

      setToken(response.access_token);

      // Fetch complete user information after login
      const currentUser = await getCurrentUser();
      const normalizedRole = normalizeRole(currentUser.role);

      if (!normalizedRole) {
        throw new Error(`Unsupported user role: ${currentUser.role}`);
      }

      const normalizedUser: CurrentUser = {
        ...currentUser,
        role: normalizedRole,
      };

      console.log("CURRENT USER:", normalizedUser);
      console.log("CURRENT USER ROLE:", normalizedUser.role);

      setUser(normalizedUser);
      return normalizedUser;
    } catch (error) {
      console.error("Login failed:", error);

      localStorage.removeItem("token");

      setToken(null);
      setUser(null);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}