import api from "@/lib/api";
import { CurrentUser } from "@/types/auth";

export const getCurrentUser = async (): Promise<CurrentUser> => {
  const token = localStorage.getItem("token");

  const response = await api.get("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
