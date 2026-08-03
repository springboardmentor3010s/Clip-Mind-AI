"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { login as loginService } from "@/services/auth";
import { LoginData, CurrentUser } from "@/types/auth";
import { getCurrentUser } from "@/services/user";

interface AuthContextType {
  token: string | null;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
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

useEffect(() => {
  const loadUser = async () => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) return;

    try {
      setToken(savedToken);

      const currentUser = await getCurrentUser();

      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user:", error);

      localStorage.removeItem("token");

      setToken(null);

      setUser(null);
    }
  };

  loadUser();
}, []);

  const login = async (data: LoginData) => {
    const response = await loginService(data);

    localStorage.setItem(
      "token",
      response.access_token
    );
    

    setToken(response.access_token);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
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