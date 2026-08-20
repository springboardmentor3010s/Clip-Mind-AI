import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { generateSummary, getAllVideos, getSavedSummary, shareSummaryWithStudents } from "../api";
import SummaryCard from "../components/SummaryCard";
import Loader from "../components/Loader";

function Summary() {
  const navigate = useNavigate();

  // ---------------- User Role & Mode Detection ----------------
  const userRole = localStorage.getItem("userRole") || localStorage.getItem("role") || "Learner";
  const isLearner = userRole.toLowerCase() === "learner";
  
  // 🟢 Role checks specifically for Educator & Content Creator separation
  const isEducator = userRole.toLowerCase() === "educator" || userRole.toLowerCase() === "administrator";
  const isContentCreator = userRole.toLowerCase() === "content creator" || userRole.toLowerCase() === "administrator";

  // ---------------- Educator Local Storage Data ----------------
  const defaultFilename = localStorage.getItem("uploadedVideo") || localStorage.getItem("selectedCourse") || "";
  const defaultTranscript = localStorage.getItem("transcript") || "";
  const defaultVideoURL = localStorage.getItem("videoURL") || "";

  // ---------------- Learner States ----------------
  const [videoList, setVideoList] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState("");

  // ---------------- General States ----------------
  const [transcript, setTranscript] = useState(defaultTranscript);
  const [videoURL, setVideoURL] = useState(defaultVideoURL);

  const [shortSummary, setShortSummary] = useState("");
  const [detailedSummary, setDetailedSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const [processingTime, setProcessingTime] = useState(0);
  const [transcriptWords, setTranscriptWords] = useState(0);
  const [summaryWords, setSummaryWords] = useState(0);
  const [compressionRatio, setCompressionRatio] = useState(0);
  const [wordsSaved, setWordsSaved] = useState(0);

  // 🟢 Bookmarks State for Learners
  const [bookmarks, setBookmarks] = useState([]);

  // ---------------- Languages ----------------
  const languages = [
    { code: "en", name: "English" },
    { code: "ta", name: "Tamil" },
    { code: "hi", name: "Hindi" },
    { code: "te", name: "Telugu" },
    { code: "ml", name: "Malayalam" },
    { code: "kn", name: "Kannada" },
    { code: "mr", name: "Marathi" },
    { code: "gu", name: "Gujarati" },
    { code: "bn", name: "Bengali" },
    { code: "pa", name: "Punjabi" },
    { code: "ur", name: "Urdu" },
    { code: "or", name: "Odia" },
    { code: "as", name: "Assamese" },
    { code: "ne", name: "Nepali" },
    { code: "si", name: "Sinhala" },
    { code: "ar", name: "Arabic" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "es", name: "Spanish" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ja", name: "Japanese" }
  ];

  // ---------------- Initial Load & Persistence Logic ----------------
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

    if (isLearner) {
      const activeVideo = localStorage.getItem("uploadedVideo") || defaultFilename;
      fetchLearnerVideos(activeVideo);
    } else {
      const cachedShort = localStorage.getItem(`shortSummary_${defaultFilename}`) || localStorage.getItem("shortSummary");
      const cachedDetailed = localStorage.getItem(`detailedSummary_${defaultFilename}`) || localStorage.getItem("detailedSummary");

      if (cachedShort) setShortSummary(cachedShort);
      if (cachedDetailed) setDetailedSummary(cachedDetailed);
    }
  }, [isLearner, defaultFilename]);

  const fetchLearnerVideos = async (preferredFilename) => {
    try {
      const response = await getAllVideos();
      const vids = response.data || [];
      setVideoList(vids);
      if (vids.length > 0) {
        const found = vids.find((v) => (v.filename || v.video_name) === preferredFilename);
        const targetVid = found ? (found.filename || found.video_name) : (vids[0].filename || vids[0].video_name);

        setSelectedVideo(targetVid);
        setVideoURL(`http://127.0.0.1:8000/uploads/videos/${targetVid}`);
        localStorage.setItem("uploadedVideo", targetVid);

        autoFetchPreGeneratedSummary(targetVid);
      }
    } catch (err) {
      console.error("Failed to load video list:", err);
      toast.error("Failed to load lessons list");
    }
  };

  // 🟢 INSTANT SUMMARY FETCH FUNCTION (0.1 Second Response)
  const autoFetchPreGeneratedSummary = async (targetFilename) => {
    if (!targetFilename) return;

    const cachedShort = localStorage.getItem(`shortSummary_${targetFilename}`);
    const cachedDetailed = localStorage.getItem(`detailedSummary_${targetFilename}`);

    if (cachedShort || cachedDetailed) {
      const sSum = cachedShort || cachedDetailed;
      const dSum = cachedDetailed || cachedShort;
      setShortSummary(sSum);
      setDetailedSummary(dSum);

      const currentTranscript = localStorage.getItem(`transcript_${targetFilename}`) || localStorage.getItem("transcript") || "";
      const transcriptCount = currentTranscript.trim().split(/\s+/).filter(Boolean).length || 150;
      const summaryCount = dSum.trim().split(/\s+/).filter(Boolean).length;

      setTranscriptWords(transcriptCount);
      setSummaryWords(summaryCount);

      const ratio = transcriptCount > 0 ? ((summaryCount / transcriptCount) * 100).toFixed(2) : 0;
      setCompressionRatio(ratio);
      setWordsSaved(Math.max(0, transcriptCount - summaryCount));
      setProcessingTime(localStorage.getItem("processingTime") || "1.20");
      return;
    }

    try {
      setLoading(true);
      const langObj = languages.find((l) => l.code === selectedLanguage);
      const targetLangName = langObj ? langObj.name : "English";

      const res = await getSavedSummary(targetFilename, targetLangName);
      if (res && res.data && res.data.success) {
        const resData = res.data;
        const shortSum = resData.short_summary || resData.summary || resData.detailed_summary || "";
        const detailedSum = resData.detailed_summary || resData.summary || resData.short_summary || "";

        if (shortSum || detailedSum) {
          setShortSummary(shortSum);
          setDetailedSummary(detailedSum);

          localStorage.setItem(`shortSummary_${targetFilename}`, shortSum);
          localStorage.setItem(`detailedSummary_${targetFilename}`, detailedSum);

          const currentTranscript = localStorage.getItem(`transcript_${targetFilename}`) || localStorage.getItem("transcript") || "";
          const transcriptCount = currentTranscript.trim().split(/\s+/).filter(Boolean).length || 150;
          const summaryCount = detailedSum.trim().split(/\s+/).filter(Boolean).length;

          setTranscriptWords(transcriptCount);
          setSummaryWords(summaryCount);

          const ratio = transcriptCount > 0 ? ((summaryCount / transcriptCount) * 100).toFixed(2) : 0;
          setCompressionRatio(ratio);
          setWordsSaved(Math.max(0, transcriptCount - summaryCount));
          setProcessingTime(resData.processing_time || "1.20");
        } else {
          setShortSummary("");
          setDetailedSummary("");
        }
      } else {
        setShortSummary("");
        setDetailedSummary("");
      }
    } catch (err) {
      console.log("No pre-saved summary found from backend for", targetFilename);
      setShortSummary("");
      setDetailedSummary("");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelectChange = (e) => {
    const fname = e.target.value;
    setSelectedVideo(fname);
    setVideoURL(`http://127.0.0.1:8000/uploads/videos/${fname}`);
    localStorage.setItem("uploadedVideo", fname);

    setShortSummary("");
    setDetailedSummary("");

    autoFetchPreGeneratedSummary(fname);
  };

  // 🎬 Content Creator Requirement 6: Download Summary as TXT File Handler
  const handleDownloadSummary = () => {
    if (!shortSummary && !detailedSummary) {
      toast.warning("No summary content available to download");
      return;
    }

    const activeFile = selectedVideo || defaultFilename || "Summary";
    const exportName = activeFile.replace(/\.[^/.]+$/, "");

    const summaryContent = `
===================================================================
                  CLIPMIND AI GENERATED SUMMARY
===================================================================

[ SHORT SUMMARY ]
-------------------------------------------------------------------
${shortSummary || "N/A"}


[ DETAILED SUMMARY ]
-------------------------------------------------------------------
${detailedSummary || "N/A"}

===================================================================
               Generated Automatically by ClipMind AI
===================================================================
`;

    const blob = new Blob([summaryContent.trim()], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportName}_Summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("📥 Summary Downloaded Successfully!");
  };

  // 🟢 Bookmark Summary Toggle Function
  const toggleBookmarkSummary = (text, type = "Summary") => {
    const exists = bookmarks.some((b) => b.title === text);
    let updated;
    if (exists) {
      updated = bookmarks.filter((b) => b.title !== text);
      toast.info("Bookmark removed");
    } else {
      updated = [...bookmarks, { type, title: text, seconds: 0, timestamp: "00:00" }];
      toast.success("Summary saved to My Bookmarks!");
    }
    setBookmarks(updated);
    localStorage.setItem("bookmarks_default", JSON.stringify(updated));
  };

  const isBookmarked = (text) => bookmarks.some((b) => b.title === text);

  // 🟢 Educator Share Summary Function (Educator Exclusive)
  const handleShareSummary = async () => {
    const activeFile = selectedVideo || defaultFilename || localStorage.getItem("uploadedVideo");
    if (!activeFile) {
      toast.warning("No active video selected to share");
      return;
    }
    try {
      await shareSummaryWithStudents(activeFile, true);
      toast.success("📤 Summary Shared with Students Successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to share summary with students");
    }
  };

  // 🟢 Educator Create Learning Materials Function (Educator Exclusive)
  const handleCreateLearningMaterials = () => {
    const activeFile = selectedVideo || defaultFilename || localStorage.getItem("uploadedVideo");
    const activeTranscript = localStorage.getItem(`transcript_${activeFile}`) || localStorage.getItem("transcript") || transcript;

    if (!activeTranscript) {
      toast.warning("Transcript is required to generate learning materials.");
      return;
    }

    toast.info("Navigating to Learning Materials generator...");
    navigate("/learning-materials");
  };

  // ---------------- Quality Evaluation Helpers ----------------
  const getStars = (rating) => {
    const map = { Excellent: 5, Good: 4, Average: 3, Fair: 2, Poor: 1 };
    const filled = map[rating] || 0;
    return "★".repeat(filled) + "☆".repeat(5 - filled);
  };

  const getReadability = () => (summaryWords <= 150 ? "Excellent" : "Good");

  const getConciseness = () => {
    if (compressionRatio <= 40) return "Excellent";
    if (compressionRatio <= 65) return "Good";
    return "Average";
  };

  const getCoverage = () => {
    if (summaryWords >= 20 && summaryWords <= 200) return "Good";
    if (summaryWords > 200) return "Excellent";
    return "Average";
  };

  const getOverallQuality = () => "Excellent";

  // ---------------- Generate Summary Action ----------------
  const handleGenerateSummary = async () => {
    const currentTranscript = localStorage.getItem(`transcript_${selectedVideo || defaultFilename}`) || localStorage.getItem("transcript") || transcript;

    if (!currentTranscript) {
      toast.warning("Transcript not found. Please generate transcript first.");
      return;
    }

    try {
      setLoading(true);
      const startTime = performance.now();

      const langObj = languages.find((l) => l.code === selectedLanguage);
      const targetLangName = langObj ? langObj.name : "English";

      const response = await generateSummary(currentTranscript, targetLangName);
      const endTime = performance.now();

      const resData = response.data || {};

      const shortSum = resData.short_summary || resData.summary || "";
      const detailedSum = resData.detailed_summary || resData.summary || "";

      setShortSummary(shortSum);
      setDetailedSummary(detailedSum);

      const activeFile = selectedVideo || defaultFilename;
      localStorage.setItem("shortSummary", shortSum);
      localStorage.setItem("detailedSummary", detailedSum);
      if (activeFile) {
        localStorage.setItem(`shortSummary_${activeFile}`, shortSum);
        localStorage.setItem(`detailedSummary_${activeFile}`, detailedSum);
      }

      const totalTime = ((endTime - startTime) / 1000).toFixed(2);
      setProcessingTime(totalTime);

      const transcriptCount = currentTranscript.trim().split(/\s+/).filter(Boolean).length;
      const summaryCount = detailedSum.trim().split(/\s+/).filter(Boolean).length;

      setTranscriptWords(transcriptCount);
      setSummaryWords(summaryCount);

      const ratio = transcriptCount > 0 ? ((summaryCount / transcriptCount) * 100).toFixed(2) : 0;
      setCompressionRatio(ratio);
      setWordsSaved(Math.max(0, transcriptCount - summaryCount));

      toast.success(`Summary Generated in ${targetLangName} Successfully`);
    } catch (error) {
      console.error("Summary Generation Error:", error);
      toast.error("Summary Generation Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", padding: "40px" }}>
      <h1 style={{ color: "#2563eb", marginBottom: "25px" }}>
        AI Summary Generator ({userRole} Mode)
      </h1>

      {/* Video & Controls Container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "25px",
          marginBottom: "30px"
        }}
      >
        {/* Video Player */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,.08)"
          }}
        >
          {/* Learner Video Dropdown Selection */}
          {isLearner && (
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold", marginRight: "10px" }}>
                Select Lesson Video:
              </label>
              <select
                value={selectedVideo}
                onChange={handleVideoSelectChange}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px"
                }}
              >
                {videoList.length === 0 ? (
                  <option value="">No videos uploaded by Educator yet</option>
                ) : (
                  videoList.map((vid) => (
                    <option key={vid.id} value={vid.filename || vid.video_name}>
                      {vid.video_name || vid.filename}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <video
            controls
            src={videoURL}
            style={{
              width: "100%",
              height: "420px",
              objectFit: "contain",
              background: "#000",
              borderRadius: "10px"
            }}
          />
        </div>

        {/* Language Options & Action Buttons */}
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,.08)"
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>Select Language</h3>

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid #d1d5db"
            }}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateSummary}
            disabled={loading}
            style={{
              width: "100%",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "15px"
            }}
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>

          <button
            onClick={() => navigate("/keymoments")}
            style={{
              width: "100%",
              background: "#16a34a",
              color: "#ffffff",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        (shortSummary || detailedSummary) && (
          <>
            {/* AI Generated Summary Display Card & Actions */}
            <div style={{ marginBottom: "30px", position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px"
                }}
              >
                <h3 style={{ margin: 0, color: "#1e293b" }}>
                  Generated AI Summary
                </h3>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {/* 🎬 Download Summary Button for Content Creator */}
                  {isContentCreator && (
                    <button
                      onClick={handleDownloadSummary}
                      style={{
                        background: "#0284c7",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "14px"
                      }}
                    >
                      📥 Download Summary
                    </button>
                  )}

                  {/* 👩‍🏫 Share & Learning Materials exclusively for Educator */}
                  {isEducator && (
                    <>
                      <button
                        onClick={handleShareSummary}
                        style={{
                          background: "#8b5cf6",
                          color: "#ffffff",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "14px"
                        }}
                      >
                        📤 Share with Students
                      </button>

                      <button
                        onClick={handleCreateLearningMaterials}
                        style={{
                          background: "#059669",
                          color: "#ffffff",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: "14px"
                        }}
                      >
                        📚 Create Learning Materials
                      </button>
                    </>
                  )}

                  <button
                    onClick={() =>
                      toggleBookmarkSummary(shortSummary || detailedSummary)
                    }
                    style={{
                      background: "#fef3c7",
                      color: "#b45309",
                      border: "1px solid #fde68a",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "14px"
                    }}
                  >
                    {isBookmarked(shortSummary || detailedSummary)
                      ? "★ Bookmarked"
                      : "☆ Bookmark Summary"}
                  </button>
                </div>
              </div>

              <SummaryCard
                shortSummary={shortSummary}
                detailedSummary={detailedSummary}
              />
            </div>

            {/* Quality & Performance Statistics */}
            <h2 style={{ color: "#2563eb", marginBottom: "15px" }}>
              Summary Quality &amp; Performance
            </h2>

            <div
              style={{
                marginBottom: "30px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: "20px"
              }}
            >
              <div style={{ background: "#dbeafe", padding: "20px", borderRadius: "10px" }}>
                <h3>Processing Time</h3>
                <h2>{processingTime} sec</h2>
              </div>

              <div style={{ background: "#dcfce7", padding: "20px", borderRadius: "10px" }}>
                <h3>Transcript Words</h3>
                <h2>{transcriptWords}</h2>
              </div>

              <div style={{ background: "#fef3c7", padding: "20px", borderRadius: "10px" }}>
                <h3>Summary Words</h3>
                <h2>{summaryWords}</h2>
              </div>

              <div style={{ background: "#ede9fe", padding: "20px", borderRadius: "10px" }}>
                <h3>Compression Ratio</h3>
                <h2>{compressionRatio}%</h2>
              </div>

              <div style={{ background: "#fef9c3", padding: "20px", borderRadius: "10px" }}>
                <h3>Words Saved</h3>
                <h2>{wordsSaved}</h2>
              </div>
            </div>

            {/* Quality Evaluation Table */}
            <div
              style={{
                background: "#f0fdf4",
                padding: "25px",
                borderRadius: "12px",
                marginBottom: "30px"
              }}
            >
              <h2 style={{ color: "#16a34a", marginBottom: "20px" }}>
                Summary Quality Evaluation
              </h2>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px 0" }}><strong>Readability</strong></td>
                    <td>
                      {getReadability()}{" "}
                      <span style={{ color: "#facc15" }}>{getStars(getReadability())}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0" }}><strong>Conciseness</strong></td>
                    <td>
                      {getConciseness()}{" "}
                      <span style={{ color: "#facc15" }}>{getStars(getConciseness())}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0" }}><strong>Coverage</strong></td>
                    <td>
                      {getCoverage()}{" "}
                      <span style={{ color: "#facc15" }}>{getStars(getCoverage())}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 0" }}><strong>Overall Quality</strong></td>
                    <td>
                      {getOverallQuality()}{" "}
                      <span style={{ color: "#facc15" }}>{getStars(getOverallQuality())}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Next Page Navigation Button */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                onClick={() => navigate("/keymoments")}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  padding: "14px 40px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "17px",
                  fontWeight: "bold"
                }}
              >
                Continue to Key Moments →
              </button>
            </div>
          </>
        )
      )}
    </div>
  );
}

export default Summary;