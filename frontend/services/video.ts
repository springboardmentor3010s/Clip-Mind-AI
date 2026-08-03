import api from "@/lib/api";

// Upload Video
export const uploadVideo = async (file: File) => {
  const token = localStorage.getItem("token");

  console.log("Upload Token:", token);

  const formData = new FormData();
  formData.append("file", file);

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