import api from "./api";

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);

  localStorage.setItem("token", response.data.access_token);

  return response.data;
};

// Exchanges a verified Firebase ID token (email/password or Google) for our
// own backend session JWT. Omitting `role` asks the backend "does this
// email already have an account?" — it replies { needs_role: true } for a
// brand-new account instead of creating one, so the caller can prompt for
// a role first and retry with it set.
export const firebaseLogin = async (idToken, role, username) => {
  const response = await api.post("/auth/firebase-login", {
    id_token: idToken,
    role: role || undefined,
    username: username || undefined,
  });

  if (response.data.access_token) {
    localStorage.setItem("token", response.data.access_token);
  }

  return response.data;
};