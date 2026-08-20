// src/pages/LearningMaterials.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaBook,
  FaShareAlt,
  FaCheckCircle,
  FaBookmark,
  FaDownload,
  FaSearch,
  FaVideo,
  FaListUl,
  FaQuestionCircle
} from "react-icons/fa";
import { getAllVideos, generateLearningMaterials, saveAndShareMaterial, getSharedMaterialsForLearner } from "../api";
import Loader from "../components/Loader";

function LearningMaterials() {
  const navigate = useNavigate();

  const userRole = localStorage.getItem("userRole") || localStorage.getItem("role") || "Learner";
  const isEducator = userRole.toLowerCase() === "educator" || userRole.toLowerCase() === "administrator";
  const isLearner = userRole.toLowerCase() === "learner";

  // Video and Material Selection
  const [videoList, setVideoList] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [materialsList, setMaterialsList] = useState([]);
  const [activeMaterial, setActiveMaterial] = useState(null);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    // Restore Bookmarks
    const savedBookmarks = localStorage.getItem("bookmarks_default");
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error(e);
      }
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Videos
      const vidRes = await getAllVideos();
      const vids = vidRes.data || [];
      setVideoList(vids);

      const defaultVid = localStorage.getItem("uploadedVideo") || (vids.length > 0 ? (vids[0].filename || vids[0].video_name) : "");
      setSelectedVideo(defaultVid);

      // 2. Fetch Shared Materials from Backend
      try {
        const matRes = await getSharedMaterialsForLearner();
        const serverMaterials = matRes.data?.data || [];
        
        // Merge with local storage fallback
        const localSaved = JSON.parse(localStorage.getItem("clipmind_shared_materials") || "[]");
        const combined = [...serverMaterials, ...localSaved.filter(l => !serverMaterials.some(s => s.video_name === l.video_name))];

        setMaterialsList(combined);
        if (combined.length > 0) {
          setActiveMaterial(combined[0]);
        }
      } catch (e) {
        const localSaved = JSON.parse(localStorage.getItem("clipmind_shared_materials") || "[]");
        setMaterialsList(localSaved);
        if (localSaved.length > 0) setActiveMaterial(localSaved[0]);
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  // 👩‍🏫 Educator Action: Generate AI Material from Video Transcript
  const handleGenerateAndShare = async () => {
    const currentTranscript = localStorage.getItem(`transcript_${selectedVideo}`) || localStorage.getItem("transcript") || "";

    if (!currentTranscript) {
      toast.warning("Transcript not found for this video. Please generate transcript first.");
      return;
    }

    try {
      setLoading(true);
      const res = await generateLearningMaterials(currentTranscript, "English");
      const generated = res.data?.data;

      if (generated) {
        const newMaterial = {
          id: Date.now(),
          title: `${selectedVideo.replace(/\.[^/.]+$/, "")} — Study Guide`,
          video_name: selectedVideo,
          concepts: generated.concepts || ["Foundations", "Core Logic", "Applications"],
          key_points: generated.key_points || ["Key lecture takeaway 1", "Key lecture takeaway 2"],
          study_notes: generated.study_notes || currentTranscript.slice(0, 500) + "...",
          practice_questions: generated.practice_questions || [
            "1. Explain the primary objective covered in this lecture?",
            "2. What are the key algorithmic steps involved?"
          ],
          is_shared: true,
          educator_name: localStorage.getItem("userName") || "Educator"
        };

        // Save to backend
        try {
          await saveAndShareMaterial(newMaterial);
        } catch (e) {
          console.log("Backend save fallback to local");
        }

        // Save to LocalStorage
        const existing = JSON.parse(localStorage.getItem("clipmind_shared_materials") || "[]");
        const updated = [newMaterial, ...existing.filter(m => m.video_name !== selectedVideo)];
        localStorage.setItem("clipmind_shared_materials", JSON.stringify(updated));

        setMaterialsList(updated);
        setActiveMaterial(newMaterial);
        toast.success("📤 Study Guide Generated & Shared with Students Successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate learning material");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Bookmark Toggle
  const toggleBookmark = (title, text) => {
    const exists = bookmarks.some((b) => b.title === title);
    let updated;
    if (exists) {
      updated = bookmarks.filter((b) => b.title !== title);
      toast.info("Bookmark removed");
    } else {
      updated = [...bookmarks, { type: "Study Guide", title, description: text, timestamp: "00:00" }];
      toast.success("Saved to My Bookmarks!");
    }
    setBookmarks(updated);
    localStorage.setItem("bookmarks_default", JSON.stringify(updated));
  };

  const isBookmarked = (title) => bookmarks.some((b) => b.title === title);

  // 📥 Download TXT
  const handleDownload = (material) => {
    if (!material) return;
    const content = `
=====================================================
            CLIPMIND AI — LECTURE STUDY GUIDE
=====================================================
TITLE: ${material.title}
VIDEO: ${material.video_name}
SHARED BY: ${material.educator_name || "Educator"}

[ 1. CORE CONCEPTS ]
${material.concepts.map((c, i) => `${i + 1}. ${c}`).join("\n")}

[ 2. KEY TAKEAWAYS ]
${material.key_points.map((k) => `• ${k}`).join("\n")}

[ 3. DETAILED STUDY NOTES ]
${material.study_notes}

[ 4. PRACTICE QUESTIONS ]
${material.practice_questions.join("\n")}
=====================================================
`;
    const blob = new Blob([content.trim()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${material.video_name}_Study_Guide.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("📥 Study Guide Downloaded!");
  };

  const filteredMaterials = materialsList.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.video_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "35px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ color: "#2563eb", margin: 0, fontSize: "28px", fontWeight: "700" }}>
            📚 Learning Materials &amp; Study Guides ({userRole} Mode)
          </h1>
          <p style={{ color: "#64748b", margin: "5px 0 0 0", fontSize: "14px" }}>
            {isEducator
              ? "Create structured concepts, study notes, and quiz questions from video transcripts to share with students."
              : "Access official lecture study notes, key takeaways, and practice questions shared by your educators."}
          </p>
        </div>
      </div>

      {/* 👩‍🏫 EDUCATOR CREATE & SHARE PANEL */}
      {isEducator && (
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "25px", display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontWeight: "600", marginRight: "10px", color: "#334155" }}>Select Lesson Video:</label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", minWidth: "220px" }}
            >
              {videoList.map((v) => (
                <option key={v.id} value={v.filename || v.video_name}>
                  {v.video_name || v.filename}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateAndShare}
            disabled={loading}
            style={{
              background: "#16a34a",
              color: "#ffffff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <FaShareAlt /> {loading ? "Generating..." : "Generate & Share with Students"}
          </button>
        </div>
      )}

      {/* Search Bar for Learner and Educator */}
      <div style={{ display: "flex", alignItems: "center", background: "#ffffff", padding: "10px 15px", borderRadius: "8px", border: "1px solid #cbd5e1", maxWidth: "450px", marginBottom: "25px" }}>
        <FaSearch style={{ color: "#94a3b8", marginRight: "10px" }} />
        <input
          type="text"
          placeholder="Search materials by topic or video..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: "none", outline: "none", width: "100%", fontSize: "14px" }}
        />
      </div>

      {loading ? (
        <Loader />
      ) : filteredMaterials.length === 0 ? (
        <div style={{ background: "#ffffff", padding: "50px", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <h2 style={{ color: "#64748b" }}>No Shared Learning Materials Found</h2>
          <p style={{ color: "#94a3b8" }}>
            {isEducator
              ? "Select a video above and click 'Generate & Share with Students' to publish study notes."
              : "Your educator has not shared any study materials yet. Check back soon!"}
          </p>
        </div>
      ) : (
        /* 2-Column Split: Shared Materials List on Left, Active Material View on Right */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "25px" }}>
          {/* Left Column: Shared Materials Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <h3 style={{ margin: "0 0 5px 0", color: "#1e293b", fontSize: "16px" }}>
              📋 Available Study Materials ({filteredMaterials.length})
            </h3>

            {filteredMaterials.map((mat) => {
              const isSelected = activeMaterial?.id === mat.id;

              return (
                <div
                  key={mat.id}
                  onClick={() => setActiveMaterial(mat)}
                  style={{
                    background: isSelected ? "#eff6ff" : "#ffffff",
                    border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    padding: "16px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "0.2s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <h4 style={{ margin: 0, color: "#1e293b", fontSize: "15px" }}>{mat.title}</h4>
                    <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                      Shared ✓
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
                    <FaVideo /> {mat.video_name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Learning Material Viewer */}
          {activeMaterial && (
            <div style={{ background: "#ffffff", padding: "30px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              {/* Material Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #f1f5f9", paddingBottom: "15px", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ color: "#1e293b", margin: "0 0 5px 0", fontSize: "22px" }}>{activeMaterial.title}</h2>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Source Video: <b>{activeMaterial.video_name}</b> • Published by: <b>{activeMaterial.educator_name || "Educator"}</b>
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => toggleBookmark(activeMaterial.title, activeMaterial.study_notes)}
                    style={{
                      background: isBookmarked(activeMaterial.title) ? "#fef3c7" : "#f1f5f9",
                      color: isBookmarked(activeMaterial.title) ? "#b45309" : "#475569",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <FaBookmark /> {isBookmarked(activeMaterial.title) ? "Bookmarked" : "Bookmark"}
                  </button>

                  <button
                    onClick={() => handleDownload(activeMaterial)}
                    style={{
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <FaDownload /> Download (.txt)
                  </button>
                </div>
              </div>

              {/* 1. Core Concepts */}
              <div style={{ marginBottom: "25px" }}>
                <h3 style={{ color: "#2563eb", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <FaBook /> Core Concepts Breakdown
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  {activeMaterial.concepts.map((c, i) => (
                    <div key={i} style={{ background: "#eff6ff", padding: "12px 16px", borderRadius: "8px", borderLeft: "4px solid #2563eb", fontWeight: "600", color: "#1e40af", fontSize: "14px" }}>
                      {i + 1}. {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Key Takeaways */}
              <div style={{ marginBottom: "25px" }}>
                <h3 style={{ color: "#16a34a", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <FaListUl /> Key Takeaways
                </h3>
                <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "26px", color: "#334155", fontSize: "14px" }}>
                  {activeMaterial.key_points.map((pt, i) => (
                    <li key={i}><strong>{pt}</strong></li>
                  ))}
                </ul>
              </div>

              {/* 3. Study Notes */}
              <div style={{ marginBottom: "25px" }}>
                <h3 style={{ color: "#475569", fontSize: "16px", marginBottom: "10px" }}>📖 Detailed Study Notes</h3>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", color: "#334155", lineHeight: "24px", fontSize: "14px", whiteSpace: "pre-line" }}>
                  {activeMaterial.study_notes}
                </div>
              </div>

              {/* 4. Practice Questions */}
              <div>
                <h3 style={{ color: "#d97706", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <FaQuestionCircle /> Practice &amp; Review Quiz
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activeMaterial.practice_questions.map((q, i) => (
                    <div key={i} style={{ background: "#fffbeb", padding: "12px 16px", borderRadius: "8px", border: "1px solid #fde68a", color: "#92400e", fontSize: "14px", fontWeight: "500" }}>
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LearningMaterials;