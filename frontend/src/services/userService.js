import api from "./api";

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getProfile = async (token) => {
  const response = await api.get("/users/me", authHeader(token));
  return response.data;
};

export const updateProfile = async (token, data) => {
  const response = await api.put("/users/me", data, authHeader(token));
  return response.data;
};

export const changePassword = async (token, data) => {
  const response = await api.put("/users/me/password", data, authHeader(token));
  return response.data;
};

export const getActivity = async (token) => {
  const response = await api.get("/users/me/activity", authHeader(token));
  return response.data;
};

export const listUsers = async (token) => {
  const response = await api.get("/users", authHeader(token));
  return response.data;
};

export const updateUserRole = async (token, userId, role) => {
  const response = await api.patch(
    `/users/${userId}/role`,
    { role },
    authHeader(token)
  );
  return response.data;
};
