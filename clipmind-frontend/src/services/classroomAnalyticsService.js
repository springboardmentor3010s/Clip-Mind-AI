import api from "@/lib/axios";

export const getClassroomAnalytics = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    "/classroom-analytics",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};