"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean; // <-- 1. Added back to the contract interface
  login: (token: string, email: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // <-- 2. Added back to state tracking

  // 3. Read session status from browser cookies immediately on mount 
  useEffect(() => {
    const token = Cookies.get('token');
    const storedEmail = Cookies.get('user_email');
    const storedRole = Cookies.get('user_role');

    if (token && storedEmail && storedRole) {
      setUser({ email: storedEmail, role: storedRole });
    }
    setLoading(false); // Finished loading current session state
  }, []);

  const login = (token: string, email: string, role: string) => {
    Cookies.set('token', token, { expires: 1, secure: true, sameSite: 'strict' });
    Cookies.set('user_email', email, { expires: 1 });
    Cookies.set('user_role', role, { expires: 1 });
    setUser({ email, role });
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('user_email');
    Cookies.remove('user_role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}