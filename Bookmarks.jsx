import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBookmark, FiVideo, FiSearch, FiTrash2, FiClock, FiList, FiZap } from "react-icons/fi";
import bookmarkService from "../services/bookmarkService";


export default function Bookmarks() {

  const [videoBookmarks, setVideoBookmarks] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const [videosData, itemsData] = await Promise.allSettled([
        bookmarkService.getBookmarks(),
        bookmarkService.getContentBookmarks().catch(() => []),
      ]);
      if (videosData.status === 'fulfilled') setVideoBookmarks(videosData.value || []);
      if (itemsData.status === 'fulfilled') setSavedItems(itemsData.value || []);
    } catch (err) {
      console.error("Failed to load bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (videoId) => {
    try {
      await bookmarkService.removeBookmark(videoId);
      setVideoBookmarks(prev => prev.filter(b => b.video.id !== videoId));
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
    }
  };

  const removeSavedItem = async (id) => {
    try {
      const item = savedItems.find(i => i.id === id);
      if (!item) return;
      await bookmarkService.unsaveContentItem(item.item_type, item.item_id);
      setSavedItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error("Failed to remove saved item:", err);
    }
  };

  const filteredVideos = videoBookmarks.filter(item =>
    item.video.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredItems = savedItems.filter(item =>
    (item.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.video_title || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">

        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Bookmarks</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Videos you've saved for later
          </p>
        </div>

        {/* Search */}
        {videoBookmarks.length > 0 && (
          <div className="relative mb-6">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="border border-gray-300 rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Search bookmarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && videoBookmarks.length === 0 && savedItems.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiBookmark className="text-4xl text-gray-300" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Saved Items Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Bookmark videos or save summaries and highlights to access them quickly.
            </p>
            <Link
              to="/browse"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <FiVideo className="mr-2" /> Browse Videos
            </Link>
          </div>
        )}

        {/* No Search Results */}
        {!loading && (filteredVideos.length > 0 || filteredItems.length > 0) && filteredVideos.length === 0 && filteredItems.length === 0 && (
          <div className="text-center py-16">
            <FiSearch className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-1">No matches found</h3>
            <p className="text-gray-500">Try a different search term</p>
          </div>
        )}

        {/* Saved Highlights (summaries & key moments) */}
        {!loading && filteredItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Saved Highlights</h2>
            <div className="grid gap-3">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    {item.video_thumbnail_url ? (
                      <img src={item.video_thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <FiZap className="text-2xl text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={item.link} className="font-semibold text-gray-800 hover:text-primary-600 transition-colors truncate block">
                      {item.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.preview}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.video_title}</p>
                  </div>
                  <button
                    onClick={() => removeSavedItem(item.id)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <FiTrash2 className="text-lg" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Bookmarks */}
        {!loading && filteredVideos.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Saved Videos</h2>
            <div className="grid gap-4">
            {filteredVideos.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow"
              >
                {/* Thumbnail placeholder */}
                <div className="w-20 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {bookmark.video.thumbnail_url ? (
                    <img
                      src={bookmark.video.thumbnail_url}
                      alt={bookmark.video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiVideo className="text-gray-300 text-xl" />
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/videos/${bookmark.video.id}`}
                    className="font-semibold text-gray-800 hover:text-primary-600 transition-colors truncate block"
                  >
                    {bookmark.video.title}
                  </Link>
                  {bookmark.video.description && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {bookmark.video.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {bookmark.video.duration && (
                      <span className="flex items-center gap-1">
                        <FiClock /> {formatDuration(bookmark.video.duration)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FiBookmark className="text-blue-500" />
                      Saved {new Date(bookmark.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeBookmark(bookmark.video.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove bookmark"
                >
                  <FiTrash2 className="text-lg" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Count */}
        {!loading && (videoBookmarks.length + savedItems.length) > 0 && (
          <p className="text-sm text-gray-400 mt-4 text-center">
            {videoBookmarks.length} saved video{videoBookmarks.length !== 1 ? "s" : ""}
            {savedItems.length > 0 && (
              <span> &middot; {savedItems.length} saved highlight{savedItems.length !== 1 ? "s" : ""}</span>
            )}
            {search && (filteredVideos.length + filteredItems.length) !== (videoBookmarks.length + savedItems.length) && (
              <span> &middot; {filteredVideos.length + filteredItems.length} matching</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}