export interface SignupData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginData {
  login: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export type UserRole = "admin" | "creator" | "educator" | "learner";

export function normalizeRole(role?: string | null): UserRole | null {
  const value = role?.trim().toLowerCase().replace(/[-\s]+/g, "_");

  if (value === "admin") return "admin";
  if (value === "educator") return "educator";
  if (value === "learner") return "learner";
  if (value === "creator" || value === "content_creator") return "creator";

  return null;
}

export function getRoleHome(role?: string | null): string {
  switch (normalizeRole(role)) {
    case "admin":
      return "/admin/dashboard";
    case "educator":
      return "/educator/dashboard";
    case "learner":
      return "/learner/dashboard";
    case "creator":
      return "/creator/dashboard";
    default:
      return "/login";
  }
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}