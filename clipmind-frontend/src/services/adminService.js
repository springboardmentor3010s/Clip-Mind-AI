import api from "@/lib/axios";

// ============================================================
// ADMIN USER MANAGEMENT
// ============================================================

export const getAdminUsers = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get("/admin/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


export const createAdminUser = async (userData) => {
  const token = localStorage.getItem("access_token");

  const response = await api.post(
    "/admin/users",
    userData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


export const promoteUserToAdmin = async (userId) => {
  const token = localStorage.getItem("access_token");

  const response = await api.put(
    `/admin/users/${userId}/role`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


export const updateUserStatus = async (
  userId,
  isActive
) => {
  const token = localStorage.getItem("access_token");

  const response = await api.put(
    `/admin/users/${userId}/status`,
    null,
    {
      params: {
        is_active: isActive,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// ============================================================
// PLATFORM ACTIVITY
// ============================================================

export const getAdminActivity = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get("/admin/activity", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


// ============================================================
// CONTENT MANAGEMENT
// ============================================================

export const getAdminVideos = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get("/admin/videos", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


export const deleteAdminVideo = async (videoId) => {
  const token = localStorage.getItem("access_token");

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


// ============================================================
// SYSTEM ANALYTICS
// ============================================================

export const getSystemAnalytics = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get("/admin/analytics", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


// ============================================================
// PLATFORM SETTINGS
// ============================================================

export const getPlatformSettings = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get("/admin/settings", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


export const updatePlatformSettings = async (
  settings
) => {
  const token = localStorage.getItem("access_token");

  const response = await api.put(
    "/admin/settings",
    settings,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// ============================================================
// AI PROCESSING JOBS
// ============================================================

export const getProcessingJobs = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    "/admin/processing-jobs",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// ============================================================
// STORAGE
// ============================================================

export const getStorageUtilization = async () => {
  const token = localStorage.getItem("access_token");

  const response = await api.get(
    "/admin/storage",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};