import api from "@/lib/axios";

export const getUsageAnalytics = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get("/analytics/usage", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};