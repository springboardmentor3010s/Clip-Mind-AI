import api from "@/lib/api";

export interface Bookmark {
  id: number;
  video_id: number;
  bookmark_type: string;
  content: string;
  timestamp: string | null;
  created_at: string;
}

export interface BookmarkCreate {
  video_id: number;
  bookmark_type: string;
  content: string;
  timestamp?: string | null;
}

export const createBookmark = async (
  bookmark: BookmarkCreate
): Promise<Bookmark> => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/bookmarks",
    bookmark,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getMyBookmarks = async (): Promise<Bookmark[]> => {
  const token = localStorage.getItem("token");

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

export const deleteBookmark = async (
  bookmarkId: number
) => {
  const token = localStorage.getItem("token");

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