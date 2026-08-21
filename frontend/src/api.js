import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================
// Register User
// =====================
export const registerUser = (userData) => {
  return api.post("/register", userData);
};

// =====================
// Login User
// =====================
export const loginUser = (loginData) => {
  return api.post("/login", loginData);
};

// =====================
// Delete User Account
// =====================
export const deleteUser = (userId) => {
  return api.delete(`/users/${userId}`);
};

// =====================
// Admin Management API
// =====================
export const getAllUsers = () => {
  return api.get("/users");
};

export const updateUserRole = (userId, role) => {
  return api.put(`/admin/users/${userId}/role`, { role });
};

// =====================
// Upload Video
// =====================
export const uploadVideo = (userId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(`/upload?user_id=${userId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// =====================
// Upload Video via URL (ADDED FUNCTION)
// =====================
export const uploadVideoUrl = (userId, url) => {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("url", url);

  return api.post("/upload-url", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// =====================
// Get All Uploaded Videos for Learners (ADDED FUNCTION)
// =====================
export const getAllVideos = () => {
  return api.get("/videos/all");
};

// =====================
// Transcript SSE Streaming URL
// =====================
export const transcriptStreamURL = (filename, language = "en") => {
  return `${API_BASE_URL}/transcript/stream?filename=${encodeURIComponent(
    filename
  )}&language=${encodeURIComponent(language)}`;
};

// =====================
// Summary Generator
// =====================
export const generateSummary = (transcript, language = "en") => {
  return api.post("/summary", {
    transcript,
    language,
  });
};

// =====================
// Key Moments Detection
// =====================
export const generateKeyMoments = (
  transcript,
  language = "en",
  durationSeconds = 0
) => {
  return api.post("/keymoments", {
    transcript,
    language,
    duration_seconds: Number(durationSeconds) || 0,
  });
};

// =====================
// Analytics Data
// =====================
export const getAnalytics = (userId) => {
  return api.get(`/analytics?user_id=${userId}`);
};

// =====================
// Explain Keyword (Multilingual)
// =====================
export const explainKeyword = (transcript, keyword, language = "en") => {
  return api.post("/explain-keyword", {
    transcript,
    keyword,
    language,
  });
};

// =========================================================
// 🟢 NEWLY ADDED FUNCTIONS: Fetch Pre-Generated Video Data
// =========================================================

// Get Complete Pre-Saved Video Details (Transcript, Summary, Key Moments)
export const getVideoDetails = (filename) => {
  return api.get(`/videos/details?filename=${encodeURIComponent(filename)}`);
};

// Get Pre-Generated Transcript for a Specific Video
export const getSavedTranscript = (filename) => {
  return api.get(`/transcript/get?filename=${encodeURIComponent(filename)}`);
};

// Get Pre-Generated Summary for a Specific Video
export const getSavedSummary = (filename, language = "en") => {
  return api.get(
    `/summary/get?filename=${encodeURIComponent(
      filename
    )}&language=${encodeURIComponent(language)}`
  );
};

// Get Pre-Generated Key Moments for a Specific Video
export const getSavedKeyMoments = (filename, language = "en") => {
  return api.get(
    `/keymoments/get?filename=${encodeURIComponent(
      filename
    )}&language=${encodeURIComponent(language)}`
  );
};

// =========================================================
// 👩‍🏫 EDUCATOR ROLE API FUNCTIONS (Requirements 3, 4 & 5)
// =========================================================

// Requirement 3: Update/Edit Transcript
export const updateTranscript = (filename, updatedTranscript) => {
  return api.put("/transcript/update", {
    filename,
    transcript: updatedTranscript,
  });
};

// Requirement 4: Share Summary with Students
export const shareSummaryWithStudents = (filename, isShared = true) => {
  return api.post("/summary/share", {
    filename,
    is_shared: isShared,
  });
};

// Requirement 5: Create AI Learning Materials from Transcript
export const generateLearningMaterials = (transcript, language = "en") => {
  return api.post("/learning-materials/generate", {
    transcript,
    language,
  });
};

// =========================================================
// 📚 LEARNING MATERIALS STORE & FETCH (Educator -> Learner)
// =========================================================

// Save & Share Learning Material (Educator)
export const saveAndShareMaterial = (materialData) => {
  return api.post("/learning-materials/save", materialData);
};

// Get All Shared Learning Materials for Students (Learner)
export const getSharedMaterialsForLearner = () => {
  return api.get("/learning-materials/shared");
};

export default api;