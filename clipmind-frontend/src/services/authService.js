import api from "@/lib/axios";

export const registerUser = async (userData) => {
  const response = await api.post("/register", userData);
  return response.data;
};

export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

  const response = await api.post("/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

export const getCurrentUser = async () => {
  // Check whether the user is authenticated first
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("access_token");

  // No token means the user is simply not logged in.
  // Do NOT call /me.
  if (!token) {
    return null;
  }

  try {
    const response = await api.get("/me");
    return response.data;
  } catch (error) {
    // An expired/invalid token means the user is no longer authenticated.
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      return null;
    }

    throw error;
  }
};

export const getActivityHistory = async () => {
  const response = await api.get("/activity-history");
  return response.data;
};