import api from "@/lib/axios";

/**
 * Upload a video file
 */
export const uploadVideo = async (
  file,
  classroomId,
  onUploadProgress
) => {
  const formData = new FormData();

  formData.append("file", file);

  // Add classroom only when one is selected
  if (classroomId) {
    formData.append(
      "classroom_id",
      classroomId
    );
  }

  const response = await api.post(
    "/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },

      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) /
          progressEvent.total
        );

        onUploadProgress(progress);
      },
    }
  );

  return response.data;
};


/**
 * Get all uploaded videos of the logged-in user
 */
export const getMyVideos = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get("/videos", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


/**
 * Get a single video by ID
 */
export const getVideoById = async (videoId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(`/videos/${videoId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


/**
 * Get transcript of a video
 */
export const getTranscript = async (videoId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    `/videos/${videoId}/transcript`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/**
 * Update transcript of a video
 * Educator only
 */
export const updateTranscript = async (
  videoId,
  transcriptText
) => {
  const token = localStorage.getItem("access_token");

  const response = await api.put(
    `/videos/${videoId}/transcript`,
    {
      transcript_text: transcriptText,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/**
 * Download transcript of a video
 */
export const downloadTranscript = async (videoId) => {
  const response = await api.get(
    `/videos/${videoId}/transcript/download`,
    {
      responseType: "blob",
    }
  );

  return response;
};




/**
 * Get summary of a video
 */
export const getSummary = async (videoId, summaryType) => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    `/videos/${videoId}/summary?type=${summaryType}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};



/**
 * Generate educational summary for a video
 * Educator only
 */
export const generateEducationalSummary = async (videoId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.post(
    `/videos/${videoId}/summary/educational`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/**
 * Download summary of a video
 *
 * summaryType can be:
 * "short" or "detailed"
 */
export const downloadSummary = async (videoId, summaryType) => {
  const response = await api.get(
    `/videos/${videoId}/summary/download?type=${summaryType}`,
    {
      responseType: "blob",
    }
  );

  return response;
};


/**
 * Generate key moments for a video
 */
export const generateKeyMoments = async (
  videoId,
  maxMoments = 5
) => {
  const token = localStorage.getItem("access_token");

  const response = await api.post(
    `/videos/${videoId}/key-moments/generate?max_moments=${maxMoments}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/**
 * Get key moments for a video
 */
export const getKeyMoments = async (videoId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    `/videos/${videoId}/key-moments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/**
 * Get highlight report of a video
 */
export const getHighlightReport = async (videoId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    `/videos/${videoId}/highlight-report`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/**
 * Get keywords of a video
 */
export const getKeywords = async (videoId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    `/videos/${videoId}/keywords`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/**
 * Generate keywords for a video
 */
export const generateKeywords = async (
  videoId,
  maxKeywords = 15
) => {
  const token = localStorage.getItem("access_token");

  const response = await api.post(
    `/videos/${videoId}/keywords/generate?max_keywords=${maxKeywords}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/**
 * Generate highlight report for a video
 */
export const generateHighlightReport = async (videoId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.post(
    `/videos/${videoId}/highlight-report/generate`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/**
 * Get transcript segments of a video
 */
export const getTranscriptSegments = async (videoId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    `/videos/${videoId}/transcript/segments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/**
 * Add a bookmark
 * Learner only
 *
 * contentType:
 * "SUMMARY" or "HIGHLIGHT"
 */
export const createBookmark = async (
  contentType,
  contentId
) => {
  const token = localStorage.getItem("access_token");

  const response = await api.post(
    "/bookmarks",
    {
      content_type: contentType,
      content_id: contentId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/**
 * Get all bookmarks of the logged-in learner
 */
export const getBookmarks = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    "/bookmarks",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


/**
 * Remove a bookmark
 */
export const deleteBookmark = async (bookmarkId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.delete(
    `/bookmarks/${bookmarkId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/**
 * Get all summaries belonging to a video
 */
export const getSummariesByVideo = async (videoId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    `/videos/${videoId}/summaries`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ============================================================
// LEARNING MATERIALS
// ============================================================

// Generate learning material
// Educator only
export const generateLearningMaterial = async (videoId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.post(
    `/videos/${videoId}/learning-material`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// Get educator's generated learning materials
// Educator only
export const getMyLearningMaterials = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    "/learning-materials/my",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// Share learning material
// Educator only
export const shareLearningMaterial = async (
  learningMaterialId,
  classroomId
) => {

  const token = localStorage.getItem("access_token");

  const response = await api.post(
    "/learning-materials/share",
    {
      learning_material_id: learningMaterialId,
      classroom_id: Number(classroomId),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// Get learning materials shared with learner
// Learner only
export const getSharedLearningMaterials = async () => {

  const token = localStorage.getItem("access_token");

  const response = await api.get(
    "/learning-materials/shared",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

