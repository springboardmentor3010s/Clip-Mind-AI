import api from "@/lib/axios";

export const getStudentEngagement = async () => {

  const token =
    localStorage.getItem("access_token");

  const response = await api.get(
    "/student-engagement",
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return response.data;
};