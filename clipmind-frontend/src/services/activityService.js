import api from "@/lib/axios";

export const getActivityHistory = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get("/activity-history", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};