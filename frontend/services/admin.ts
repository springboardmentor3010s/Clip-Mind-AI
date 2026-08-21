import api from "@/lib/api";

// =========================================================
// GET ADMIN STATISTICS
// =========================================================

export const getAdminStats = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get("/admin/stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


// =========================================================
// GET ALL USERS
// =========================================================

export const getAdminUsers = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get("/admin/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


// =========================================================
// MAKE USER ADMIN
// =========================================================

export const makeUserAdmin = async (userId: number) => {
  const token = localStorage.getItem("token");

  const response = await api.put(
    `/admin/users/${userId}/make-admin`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// =========================================================
// GET ALL VIDEOS
// =========================================================

export const getAdminVideos = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get("/admin/videos", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


// =========================================================
// DELETE VIDEO
// =========================================================

export const deleteAdminVideo = async (videoId: number) => {
  const token = localStorage.getItem("token");

  const response = await api.delete(
    `/admin/videos/${videoId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};