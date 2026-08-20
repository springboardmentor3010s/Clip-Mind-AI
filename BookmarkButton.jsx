import { useState, useEffect } from "react";
import { FiBookmark, FiBookmark as FaBookmark, FiBookmark as FaRegBookmark } from "react-icons/fi";
import bookmarkService from "../services/bookmarkService";
import { toast } from "react-toastify";


export default function BookmarkButton({ videoId, className = "" }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, [videoId]);

  async function loadStatus() {
    try {
      const status = await bookmarkService.checkBookmark(videoId);
      setBookmarked(status);
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleBookmark() {
    if (loading) return;

    const previous = bookmarked;

    setBookmarked(!previous);
    setLoading(true);

    try {
      if (previous) {
        await bookmarkService.removeBookmark(videoId);
        toast.success("Bookmark removed");
      } else {
        await bookmarkService.addBookmark(videoId);
        toast.success("Bookmarked!");
      }
    } catch (err) {
      setBookmarked(previous);
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      disabled={loading}
      onClick={toggleBookmark}
      className={`text-2xl text-blue-500 hover:scale-110 transition ${className}`}
      title={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
    </button>
  );
}