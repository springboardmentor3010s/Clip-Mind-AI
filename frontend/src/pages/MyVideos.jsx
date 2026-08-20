import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getAllVideos } from "../api";
import Loader from "../components/Loader";

function MyVideos() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || localStorage.getItem("role") || "Learner";

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await getAllVideos();
      const list = res.data || [];
      setVideos(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load uploaded videos history");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Select & View Video in Transcript / Summary
  const handleSelectVideo = (video) => {
    const filename = video.filename || video.video_name;
    localStorage.setItem("uploadedVideo", filename);
    localStorage.setItem("videoName", video.video_name || filename);
    localStorage.setItem("videoURL", `http://127.0.0.1:8000/uploads/videos/${filename}`);
    toast.info(`Selected video: ${video.video_name || filename}`);
    navigate("/transcript");
  };

  // 🟢 Rename Video Local State Function
  const handleStartRename = (video) => {
    setEditingId(video.id);
    setNewName(video.video_name || video.filename);
  };

  const handleSaveRename = (id) => {
    if (!newName.trim()) return;
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, video_name: newName } : v))
    );
    setEditingId(null);
    toast.success("Video title updated!");
  };

  // 🟢 Delete Video Local State Function
  const handleDeleteVideo = (id) => {
    if (window.confirm("Are you sure you want to remove this video from list?")) {
      setVideos((prev) => prev.filter((v) => v.id !== id));
      toast.success("Video removed from library");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ color: "#2563eb", margin: 0, fontSize: "28px", fontWeight: "700" }}>
            📁 My Videos & Upload History ({userRole} Mode)
          </h1>
          <p style={{ color: "#64748b", margin: "5px 0 0 0", fontSize: "14px" }}>
            Manage your uploaded videos, rename, inspect status, or proceed to AI generation.
          </p>
        </div>

        <button
          onClick={() => navigate("/upload")}
          style={{ background: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
        >
          + Upload New Video
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : videos.length === 0 ? (
        <div style={{ background: "#ffffff", padding: "50px", borderRadius: "16px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
          <h2 style={{ color: "#64748b" }}>No Uploaded Videos Found</h2>
          <p style={{ color: "#94a3b8", marginBottom: "20px" }}>Start by uploading a video lecture or content file.</p>
          <button
            onClick={() => navigate("/upload")}
            style={{ background: "#16a34a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            Go to Upload Page
          </button>
        </div>
      ) : (
        <>
          {/* Step 2 — Manage Uploaded Videos Cards Grid */}
          <h2 style={{ color: "#1e293b", marginBottom: "20px", fontSize: "20px" }}>🎬 Manage Videos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px", marginBottom: "40px" }}>
            {videos.map((vid) => {
              const fname = vid.filename || vid.video_name;
              const isEd = editingId === vid.id;

              return (
                <div
                  key={vid.id}
                  style={{
                    background: "#ffffff",
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    justify: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                      <span style={{ fontSize: "24px" }}>🎥</span>
                      {isEd ? (
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #2563eb", width: "100%" }}
                        />
                      ) : (
                        <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b", wordBreak: "break-word" }}>
                          {vid.video_name || fname}
                        </h3>
                      )}
                    </div>

                    <p style={{ margin: "0 0 6px 0", color: "#64748b", fontSize: "13px" }}>
                      <b>File:</b> {fname}
                    </p>
                    <p style={{ margin: "0 0 15px 0", color: "#64748b", fontSize: "13px" }}>
                      <b>Uploaded:</b> {vid.created_at ? new Date(vid.created_at).toLocaleDateString() : "Recent"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                    <button
                      onClick={() => handleSelectVideo(vid)}
                      style={{ background: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                    >
                      ▶ View AI Content
                    </button>

                    {isEd ? (
                      <button
                        onClick={() => handleSaveRename(vid.id)}
                        style={{ background: "#16a34a", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartRename(vid)}
                        style={{ background: "#f59e0b", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                      >
                        ✏️ Rename
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteVideo(vid.id)}
                      style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step 8 — Upload History Table */}
          <h2 style={{ color: "#1e293b", marginBottom: "15px", fontSize: "20px" }}>🕒 Upload History Log</h2>
          <div style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", color: "#475569", fontSize: "14px" }}>
                  <th style={{ padding: "14px 20px" }}>Video Name</th>
                  <th style={{ padding: "14px 20px" }}>Language</th>
                  <th style={{ padding: "14px 20px" }}>Status</th>
                  <th style={{ padding: "14px 20px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px", color: "#334155" }}>
                    <td style={{ padding: "14px 20px", fontWeight: "600" }}>{v.video_name || v.filename}</td>
                    <td style={{ padding: "14px 20px" }}>{(v.language || "English").toUpperCase()}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                        Completed
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <button
                        onClick={() => handleSelectVideo(v)}
                        style={{ background: "#0284c7", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", marginRight: "8px" }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default MyVideos;