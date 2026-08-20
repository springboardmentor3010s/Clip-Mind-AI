import api from "./api";


const bookmarkService = {

  addBookmark: async (videoId) => {
    const res = await api.post("/bookmarks/", {
      video_id: videoId
    });
    return res.data;
  },

  removeBookmark: async (videoId) => {
    const res = await api.delete(`/bookmarks/${videoId}`);
    return res.data;
  },

  getBookmarks: async () => {
    const res = await api.get("/bookmarks/");
    return res.data;
  },

  checkBookmark: async (videoId) => {
    const res = await api.get(`/bookmarks/check/${videoId}`);
    return res.data.bookmarked;
  },

  // --- Content-item bookmarks (summaries & key-moment highlights) ---

  // itemType: 'summary' | 'key_moment'
  saveContentItem: async (itemType, itemId, label) => {
    const res = await api.post("/bookmarks/items/", {
      item_type: itemType,
      item_id: itemId,
      label: label || null,
    });
    return res.data;
  },

  unsaveContentItem: async (itemType, itemId) => {
    const res = await api.delete(`/bookmarks/items/${itemType}/${itemId}`);
    return res.data;
  },

  getContentBookmarks: async () => {
    const res = await api.get("/bookmarks/items/");
    return res.data;
  },

  checkContentItem: async (itemType, itemId) => {
    const res = await api.get(`/bookmarks/items/check/${itemType}/${itemId}`);
    return res.data.bookmarked;
  },

};

export default bookmarkService;