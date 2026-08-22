import api from "@/lib/axios";

// ============================================================
// SHARE SUMMARY
// Educator only
// ============================================================

export const shareSummary = async (
  summaryId,
  classroomId
) => {
  const response = await api.post(
    "/summary-shares",
    {
      summary_id: summaryId,
      classroom_id: classroomId,
    }
  );

  return response.data;
};

// ============================================================
// GET MY SHARED SUMMARIES
// Learner only
// ============================================================

export const getMySharedSummaries = async () => {
  const response = await api.get(
    "/summary-shares/my"
  );

  return response.data;
};