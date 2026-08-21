import api from "@/lib/api";

// Upload Video
export const uploadVideo = async (
  file: File,
  classroomId?: number
) => {
  const token = localStorage.getItem("token");

  console.log("Upload Token:", token);

  const formData = new FormData();
  formData.append("file", file);
  if (classroomId !== undefined && classroomId !== null) {
    formData.append("classroom_id", classroomId.toString());
  }

  console.log("API Base URL:", api.defaults.baseURL);
  console.log("Upload Token:", token);
  console.log("File:", file);
  const response = await api.post(
    "/videos/upload",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};
// Get My Videos
export const getMyVideos = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get("/videos/my-videos", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// Get Transcript
export const getTranscript = async (videoId: number) => {
  const token = localStorage.getItem("token");

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

export const updateTranscript = async (
  videoId: number,
  transcript: string
) => {
  const token = localStorage.getItem("token");

  const response = await api.put(
    `/videos/${videoId}/transcript`,
    {
      transcript,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Get Summary
export const getSummary = async (videoId: number) => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    `/videos/${videoId}/summary`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  

  return response.data;
};

// Get Key Moments
export const getKeyMoments = async (videoId: number) => {
  const token = localStorage.getItem("token");

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

// Get Keywords
export const getKeywords = async (videoId: number) => {
  const token = localStorage.getItem("token");

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

// Get Report
export const getReport = async (videoId: number) => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    `/videos/${videoId}/report`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Get Highlight Report
export const getHighlightReport = async (videoId: number) => {
  const token = localStorage.getItem("token");

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

// Get Video Details
export const getVideo = async (videoId: number) => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    `/videos/${videoId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getAvailableVideos = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    "/videos/available",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getVideoStats = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    "/videos/stats",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

