import api from "@/lib/axios";

// ============================================================
// CREATE CLASSROOM
// Educator
// ============================================================

export const createClassroom = async (data) => {
  const response = await api.post("/classrooms", data);
  return response.data;
};

// ============================================================
// GET EDUCATOR'S CLASSROOMS
// Educator
// ============================================================

export const getEducatorClassrooms = async () => {
  const response = await api.get("/classrooms");
  return response.data;
};

// ============================================================
// GET ENROLLED CLASSROOMS
// Learner
// ============================================================

export const getMyClassrooms = async () => {
  const response = await api.get("/classrooms/my");
  return response.data;
};

// ============================================================
// GET CLASSROOM LEARNERS
// Educator
// ============================================================

export const getClassroomLearners = async (classroomId) => {
  const response = await api.get(
    `/classrooms/${classroomId}/learners`
  );

  return response.data;
};

// ============================================================
// ADD LEARNER TO CLASSROOM
// Educator
// ============================================================

export const addLearnerToClassroom = async (
  classroomId,
  learnerIdentifier
) => {
  const response = await api.post(
    `/classrooms/${classroomId}/learners`,
    {
      learner_identifier: learnerIdentifier,
    }
  );

  return response.data;
};

// ============================================================
// REMOVE LEARNER FROM CLASSROOM
// Educator
// ============================================================

export const removeLearnerFromClassroom = async (
  classroomId,
  learnerId
) => {
  const response = await api.delete(
    `/classrooms/${classroomId}/learners/${learnerId}`
  );

  return response.data;
};

// ============================================================
// GET CLASSROOM VIDEOS
// Educator
// ============================================================

export const getClassroomVideos = async (classroomId) => {
  const response = await api.get(
    `/classrooms/${classroomId}/videos`
  );

  return response.data;
};


// ============================================================
// GET CLASSROOM LECTURES
// Learner
// ============================================================

export const getClassroomLectures = async (classroomId) => {
  const response = await api.get(
    `/classrooms/${classroomId}/lectures`
  );

  return response.data;
};