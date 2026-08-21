import { api } from "./api";

export const authService = {
  login: (email: string, password: string) => api.post("/login", { email, password }),
  register: (payload: { name: string; email: string; password: string; role: string }) =>
    api.post("/register", payload),
  forgotPassword: (email: string) => api.post("/forgot-password", { email }),
  me: () => api.get("/me"),
};
