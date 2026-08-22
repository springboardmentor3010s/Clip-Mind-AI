import axios from "axios";

export const api = axios.create({
  baseURL:
    (import.meta as any).env?.VITE_API_URL ||
    "http://127.0.0.1:8002/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("clipmind_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore localStorage errors.
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);