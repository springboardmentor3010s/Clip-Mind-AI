import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Role =
  | "Content Creator"
  | "Learner"
  | "Educator"
  | "Administrator";

export const ROLES: Role[] = [
  "Content Creator",
  "Learner",
  "Educator",
  "Administrator",
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  institution?: string;
  avatar?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, role?: Role) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: Role,
  ) => Promise<User>;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
  currentUser: () => User | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "clipmind_user";
const TOKEN_KEY = "clipmind_token";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8002/api";

type BackendUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  institution?: string | null;
};

type AuthResponse = {
  token: string;
  user: BackendUser;
};

function mapBackendRole(role: string): Role {
  switch (role) {
    case "Content Creator":
      return "Content Creator";

    case "Learner":
      return "Learner";

    case "Educator":
      return "Educator";

    case "Administrator":
      return "Administrator";

    default:
      return "Learner";
  }
}

function toFrontendUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapBackendRole(user.role),
    institution: user.institution ?? undefined,
  };
}

function saveSession(response: AuthResponse) {
  const frontendUser = toFrontendUser(response.user);

  localStorage.setItem(TOKEN_KEY, response.token);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(frontendUser));

  return frontendUser;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      data &&
      typeof data === "object" &&
      "detail" in data &&
      typeof data.detail === "string"
        ? data.detail
        : "Authentication request failed.";

    throw new Error(detail);
  }

  return data as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => parseResponse<BackendUser>(response))
      .then((backendUser) => {
        const frontendUser = toFrontendUser(backendUser);

        setUser(frontendUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(frontendUser));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const persist = (u: User | null, token?: string) => {
    setUser(u);

    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));

      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const login = async (
    email: string,
    password: string,
    _role?: Role,
  ): Promise<User> => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await parseResponse<AuthResponse>(response);
    const frontendUser = saveSession(data);

    setUser(frontendUser);

    return frontendUser;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: Role,
  ): Promise<User> => {
    /*
     * The existing frontend calls the user role "Researcher".
     * The backend role used for that workflow is "Content Creator".
     */
    const backendRole = role;

    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role: backendRole,
      }),
    });

    const data = await parseResponse<AuthResponse>(response);
    const frontendUser = saveSession(data);

    setUser(frontendUser);

    return frontendUser;
  };

  const updateUser = (patch: Partial<User>) => {
    if (!user) return;

    const updated = {
      ...user,
      ...patch,
    };

    persist(updated);
  };

  const logout = () => {
    persist(null);
  };

  const currentUser = () => user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        updateUser,
        logout,
        currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}

export function roleHomePath(_role: Role): string {
  return "/dashboard";
}