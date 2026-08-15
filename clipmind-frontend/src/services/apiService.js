import api from "@/lib/axios";

export const healthCheck = async () => {
  const response = await api.get("/health");
  return response.data;
};

export const getWelcomeMessage = async () => {
  const response = await api.get("/");
  return response.data;
};