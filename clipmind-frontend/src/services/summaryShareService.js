import api from "@/lib/axios";

export const getMySharedSummaries = async () => {
  const response = await api.get("/summary-shares/my");
  return response.data;
};