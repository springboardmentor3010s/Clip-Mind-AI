'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as api from './api';

interface User { id: string; email: string; name: string; role: string; avatar?: string; }
interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role: string }) => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('cm_token');
    const u = localStorage.getItem('cm_user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: u, accessToken, refreshToken } = res.data;
    localStorage.setItem('cm_token', accessToken);
    localStorage.setItem('cm_user', JSON.stringify(u));
    if (refreshToken) localStorage.setItem('cm_refresh_token', refreshToken);
    setToken(accessToken);
    setUser(u);
    router.push('/dashboard');
  };

  const register = async (data: { email: string; password: string; name: string; role: string }) => {
    const res = await api.post('/auth/register', data);
    const { user: u, accessToken, refreshToken } = res.data;
    localStorage.setItem('cm_token', accessToken);
    localStorage.setItem('cm_user', JSON.stringify(u));
    if (refreshToken) localStorage.setItem('cm_refresh_token', refreshToken);
    setToken(accessToken);
    setUser(u);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('cm_token');
    localStorage.removeItem('cm_refresh_token');
    localStorage.removeItem('cm_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
