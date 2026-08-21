import api from "@/lib/api";

// Share summary with classroom
export const shareSummary = async (
  videoId: number,
  classroomId: number
) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/summary-shares/",
    {
      video_id: videoId,
      classroom_id: classroomId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Get summaries shared with a classroom
export const getClassroomSharedSummaries = async (
  classroomId: number
) => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    `/summary-shares/classroom/${classroomId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};