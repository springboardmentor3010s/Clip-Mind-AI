import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { User, UserRole } from '../types';
import { api } from '../services/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    email: string,
    pass: string
  ) => Promise<User>;

  register: (
    email: string,
    pass: string,
    fullName: string,
    role: string
  ) => Promise<void>;

  logout: () => void;

  switchRole: (
    newRole: UserRole
  ) => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('clipmind_token');
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  /*
   * =========================================================
   * RESTORE EXISTING SESSION
   * =========================================================
   */

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const storedToken =
        localStorage.getItem('clipmind_token');

      if (!storedToken) {
        if (mounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await api.getMe();

        if (!mounted) return;

        setUser(currentUser);
        setToken(storedToken);

      } catch (error) {

        console.error(
          '[AUTH] Failed to restore session:',
          error
        );

        localStorage.removeItem('clipmind_token');

        if (mounted) {
          setUser(null);
          setToken(null);
        }

      } finally {

        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   */

  const login = async (
    email: string,
    pass: string
  ): Promise<User> => {

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !pass) {
      throw new Error(
        'Please enter both email and password.'
      );
    }

    try {

      console.log(
        '[AUTH] Attempting login:',
        cleanEmail
      );

      const response = await api.login({
        email: cleanEmail,
        password: pass,
      });

      if (!response?.access_token) {
        throw new Error(
          'Login succeeded but no access token was returned.'
        );
      }

      /*
       * Save token FIRST.
       */
      localStorage.setItem(
        'clipmind_token',
        response.access_token
      );

      setToken(response.access_token);

      /*
       * Prefer user returned directly by backend.
       */
      let loggedInUser: User;

      if (response.user) {
        loggedInUser = response.user;
      } else {
        loggedInUser = await api.getMe();
      }

      if (!loggedInUser) {
        throw new Error(
          'Unable to retrieve your user profile.'
        );
      }

      console.log(
        '[AUTH] Login successful:',
        loggedInUser
      );

      setUser(loggedInUser);

      return loggedInUser;

    } catch (error: any) {

      console.error(
        '[AUTH] Login failed:',
        error
      );

      /*
       * Do not leave a broken token behind.
       */
      localStorage.removeItem('clipmind_token');
      setToken(null);
      setUser(null);

      throw new Error(
        error?.message ||
        'Invalid email or password.'
      );
    }
  };

  /*
   * =========================================================
   * REGISTER
   * =========================================================
   */

  const register = async (
    email: string,
    pass: string,
    fullName: string,
    role: string
  ) => {

    await api.register({
      email: email.trim().toLowerCase(),
      password: pass,
      full_name: fullName,
      role: role.toLowerCase(),
    });
  };

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  const logout = () => {

    console.log('[AUTH] Logging out');

    localStorage.removeItem('clipmind_token');

    setToken(null);
    setUser(null);
  };

  /*
   * =========================================================
   * ROLE SWITCH
   * =========================================================
   *
   * This only changes the UI role locally.
   * Backend authorization still uses the real JWT role.
   */

  const switchRole = (newRole: UserRole) => {

    if (!user) return;

    setUser({
      ...user,
      role: newRole,
    });
  };

  const isAuthenticated =
    Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {

  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};