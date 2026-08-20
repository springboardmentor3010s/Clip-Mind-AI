// src/pages/Bookmarks.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaBookmark, FaPlay, FaTrashAlt, FaClock, FaBookOpen } from "react-icons/fa";

function Bookmarks() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId") || "default";
  const videoId = localStorage.getItem("videoId") || "default";

  const [bookmarks, setBookmarks] = useState([]);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    const savedBookmarks =
      localStorage.getItem(`bookmarks_${videoId}`) ||
      localStorage.getItem(`bookmarks_default`);

    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error("Failed to parse bookmarks:", e);
      }
    }
  };

  const handleRemoveBookmark = (itemToRemove, e) => {
    e.stopPropagation();
    const updated = bookmarks.filter(
      (b) => !(b.seconds === itemToRemove.seconds && b.title === itemToRemove.title)
    );
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${videoId}`, JSON.stringify(updated));
    localStorage.setItem(`bookmarks_default`, JSON.stringify(updated));
    toast.info("Bookmark removed successfully");
  };

  const handleJumpToMoment = (seconds) => {
    localStorage.setItem("seekTime", seconds);
    toast.info("Navigating to Key Moments...");
    navigate("/keymoments");
  };

  const filteredBookmarks = bookmarks.filter((b) => {
    if (filterType === "all") return true;
    return (b.type || "").toLowerCase() === filterType.toLowerCase();
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px" }}>
      
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(90deg, #d97706, #f59e0b)",
          color: "#ffffff",
          padding: "35px",
          borderRadius: "16px",
          marginBottom: "35px",
          boxShadow: "0 10px 25px rgba(217, 119, 6, 0.2)",
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700" }}>
            🔖 My Saved Bookmarks
          </h1>
          <p style={{ margin: "10px 0 0 0", fontSize: "16px", opacity: 0.9 }}>
            Access all your saved highlights, important lesson sentences, and key video moments in one organized place.
          </p>
        </div>
        <div style={{ background: "rgba(255, 255, 255, 0.2)", padding: "12px 22px", borderRadius: "12px", textAlign: "center" }}>
          <h2 style={{ margin: 0, fontSize: "26px" }}>{bookmarks.length}</h2>
          <span style={{ fontSize: "13px" }}>Saved Items</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px", flexWrap: "wrap" }}>
        {["all", "sentence", "highlight", "segment"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: "10px 20px",
              borderRadius: "20px",
              border: "1px solid #cbd5e1",
              background: filterType === type ? "#d97706" : "#ffffff",
              color: filterType === type ? "#ffffff" : "#475569",
              fontWeight: "600",
              cursor: "pointer",
              textTransform: "capitalize",
              fontSize: "14px",
              transition: "all 0.2s ease"
            }}
          >
            {type === "all" ? "All Bookmarks" : `${type}s`}
          </button>
        ))}
      </div>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            padding: "50px 20px",
            borderRadius: "16px",
            textAlign: "center",
            border: "1px solid #e2e8f0"
          }}
        >
          <FaBookmark style={{ fontSize: "40px", color: "#cbd5e1", marginBottom: "15px" }} />
          <h2 style={{ color: "#64748b", margin: "0 0 10px 0" }}>No Bookmarks Saved Yet</h2>
          <p style={{ color: "#94a3b8", margin: "0 0 20px 0" }}>
            Click the star (★) icon next to any transcript sentence or key moment while studying to save it here.
          </p>
          <button
            onClick={() => navigate("/keymoments")}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Explore Key Moments →
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {filteredBookmarks.map((item, index) => (
            <div
              key={index}
              onClick={() => handleJumpToMoment(item.seconds)}
              style={{
                background: "#ffffff",
                padding: "18px 22px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                justify: "space-between",
                alignItems: "center",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 1 }}>
                <span
                  style={{
                    background: "#fef3c7",
                    color: "#b45309",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    textTransform: "uppercase"
                  }}
                >
                  {item.type || "Saved"}
                </span>

                <span style={{ color: "#2563eb", fontWeight: "700", fontSize: "14px", minWidth: "60px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <FaClock style={{ fontSize: "12px" }} /> {item.timestamp || "00:00"}
                </span>

                <span style={{ color: "#1e293b", fontSize: "15px", fontWeight: "500", flex: 1 }}>
                  {item.title}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJumpToMoment(item.seconds);
                  }}
                  style={{
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <FaPlay style={{ fontSize: "10px" }} /> Jump
                </button>

                <button
                  onClick={(e) => handleRemoveBookmark(item, e)}
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                  title="Delete Bookmark"
                >
                  <FaTrashAlt />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default Bookmarks;