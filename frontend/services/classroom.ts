import api from "@/lib/api";

// -----------------------------------------
// Create Classroom
// Educator only
// -----------------------------------------
export const createClassroom = async (name: string) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/classrooms/create",
    { name },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// -----------------------------------------
// Get Educator's Classrooms
// Educator only
// -----------------------------------------
export const getMyClassrooms = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    "/classrooms/my-classrooms",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// -----------------------------------------
// Join Classroom
// Learner only
// -----------------------------------------
export const joinClassroom = async (code: string) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/classrooms/join",
    { code },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// -----------------------------------------
// Get Learner's Joined Classrooms
// Learner only
// -----------------------------------------
export const getMyJoinedClassrooms = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    "/classrooms/my-joined-classrooms",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// -----------------------------------------
// Get Students in Classroom
// Educator only
// -----------------------------------------
export const getClassroomStudents = async (
  classroomId: number
) => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    `/classrooms/${classroomId}/students`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// -----------------------------------------
// Get Videos in Classroom
// Educator + Learner
// -----------------------------------------
export const getClassroomVideos = async (
  classroomId: number
) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication token not found.");
  }

  const response = await api.get(
    `/classrooms/${classroomId}/videos`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// -----------------------------------------
// Get Shared Summaries in Classroom
// Educator + Learner
// -----------------------------------------
export const getClassroomSharedSummaries = async (
  classroomId: number
) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication token not found.");
  }

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

// -----------------------------------------
// Share Summary with Classroom
// Educator only
// -----------------------------------------
export const shareSummary = async (
  videoId: number,
  classroomId: number
) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication token not found.");
  }

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