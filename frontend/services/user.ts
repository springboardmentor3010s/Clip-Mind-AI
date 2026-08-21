import api from "@/lib/api";
import { CurrentUser } from "@/types/auth";

export const getCurrentUser = async (): Promise<CurrentUser> => {
  const token = localStorage.getItem("token");

  const response = await api.get("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getLearningHistory = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    "/users/learning-history",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export interface UpdateProfileData {
  username: string;
  email: string;
}

export const updateProfile = async (
  data: UpdateProfileData
) => {
  const token = localStorage.getItem("token");

  const response = await api.put(
    "/users/profile",
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getActivityHistory = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    "/users/activity-history",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const logLearningActivity = async (
  action: string,
  description: string = ""
) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/users/learning-activity",
    {
      action,
      description,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export interface LearnerStats {
  available_videos: number;
  ai_summaries: number;
  transcripts: number;
}

export const getLearnerStats =
  async (): Promise<LearnerStats> => {
    const token = localStorage.getItem("token");

    const response = await api.get(
      "/users/learner-stats",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  };