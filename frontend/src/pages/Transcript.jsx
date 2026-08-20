import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { transcriptStreamURL, explainKeyword, getAllVideos, getSavedTranscript, updateTranscript } from "../api";

function Transcript() {
  const navigate = useNavigate();

  // ---------------- User Role & Dropdown States ----------------
  const userRole = localStorage.getItem("userRole") || localStorage.getItem("role") || "Learner";
  const isLearner = userRole.toLowerCase() === "learner";
  
  // 🟢 Role check specifically for Content Creator & Admin Download Access
  const isContentCreator = userRole.toLowerCase() === "content creator" || userRole.toLowerCase() === "administrator";

  const [videoList, setVideoList] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState("");

  // ---------------- Uploaded Video Details ----------------
  const defaultFilename = localStorage.getItem("uploadedVideo") || localStorage.getItem("selectedCourse") || "";
  const defaultVideoName = localStorage.getItem("videoName") || defaultFilename;
  const defaultVideoURL =
    localStorage.getItem("videoURL") ||
    `http://127.0.0.1:8000/uploads/videos/${defaultFilename}`;

  const [filename, setFilename] = useState(defaultFilename);
  const [videoName, setVideoName] = useState(defaultVideoName);
  const [videoURL, setVideoURL] = useState(defaultVideoURL);

  // ---------------- Supported Languages ----------------
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
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "es", name: "Spanish" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "tr", name: "Turkish" },
    { code: "nl", name: "Dutch" },
    { code: "pl", name: "Polish" },
    { code: "sv", name: "Swedish" },
    { code: "da", name: "Danish" },
    { code: "fi", name: "Finnish" },
    { code: "el", name: "Greek" },
    { code: "cs", name: "Czech" },
    { code: "hu", name: "Hungarian" },
    { code: "ro", name: "Romanian" },
    { code: "uk", name: "Ukrainian" },
    { code: "vi", name: "Vietnamese" },
    { code: "th", name: "Thai" },
    { code: "id", name: "Indonesian" },
    { code: "ms", name: "Malay" }
  ];

  // ---------------- States ----------------
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [transcript, setTranscript] = useState("");
  const [segments, setSegments] = useState([]);
  const [language, setLanguage] = useState("");

  const [searchWord, setSearchWord] = useState("");
  const [activeKeyword, setActiveKeyword] = useState("");
  const [explanation, setExplanation] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);

  const [processingTime, setProcessingTime] = useState(0);
  const [transcriptWords, setTranscriptWords] = useState(0);
  const [detectedKeywords, setDetectedKeywords] = useState([]);
  const [keyMomentsCount, setKeyMomentsCount] = useState(0);

  // 🟢 Educator Edit Transcript States
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");

  // 🟢 Bookmarks State for Learners
  const [bookmarks, setBookmarks] = useState([]);

  // Common stop words to exclude
  const stopWords = new Set([
    "the", "is", "are", "was", "were", "this", "that", "and", "or", "for", "with",
    "என்றால்", "என்ன", "என்பது", "ஒரு", "மற்றும்", "இது", "இந்த", "அந்த", "எனவே", "மூலம்"
  ]);

  // ---------------- Initial Load Logic & Automatic Load ----------------
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookmarks_default");
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error(e);
      }
    }

    if (isLearner) {
      const activeVideo = localStorage.getItem("uploadedVideo") || localStorage.getItem("selectedCourse");
      fetchLearnerVideos(activeVideo);
    } else {
      const savedTranscript = localStorage.getItem(`transcript_${defaultFilename}`) || localStorage.getItem("transcript");
      if (savedTranscript) {
        setTranscript(savedTranscript);
        setEditedText(savedTranscript);

        const savedSegments = localStorage.getItem(`segments_${defaultFilename}`) || localStorage.getItem("segments");
        if (savedSegments) {
          try {
            setSegments(JSON.parse(savedSegments));
          } catch (e) {
            console.error(e);
          }
        }

        const savedKeywords = localStorage.getItem(`keywords_${defaultFilename}`) || localStorage.getItem("keywords");
        if (savedKeywords) {
          try {
            setDetectedKeywords(JSON.parse(savedKeywords));
          } catch (e) {
            console.error(e);
          }
        }

        const savedProcessingTime = localStorage.getItem("processingTime");
        if (savedProcessingTime) {
          setProcessingTime(savedProcessingTime);
        }

        const savedTranscriptWords = localStorage.getItem("transcriptWords");
        if (savedTranscriptWords) {
          setTranscriptWords(Number(savedTranscriptWords));
        }

        const savedLanguage = localStorage.getItem("detectedLanguage");
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      }
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
        setFilename(targetVid);
        setVideoName(targetVid);
        setVideoURL(`http://127.0.0.1:8000/uploads/videos/${targetVid}`);
        localStorage.setItem("uploadedVideo", targetVid);

        autoFetchPreGeneratedData(targetVid);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load lesson videos");
    }
  };

  const autoFetchPreGeneratedData = async (targetFilename) => {
    if (!targetFilename) return;

    const cachedTranscript = localStorage.getItem(`transcript_${targetFilename}`);
    if (cachedTranscript) {
      setTranscript(cachedTranscript);
      setEditedText(cachedTranscript);
      const cachedSegs = localStorage.getItem(`segments_${targetFilename}`);
      if (cachedSegs) setSegments(JSON.parse(cachedSegs));
      const cachedKws = localStorage.getItem(`keywords_${targetFilename}`);
      if (cachedKws) setDetectedKeywords(JSON.parse(cachedKws));
      return;
    }

    try {
      setLoading(true);
      const res = await getSavedTranscript(targetFilename);
      if (res.data && res.data.transcript) {
        const data = res.data;
        setTranscript(data.transcript);
        setEditedText(data.transcript);
        localStorage.setItem(`transcript_${targetFilename}`, data.transcript);

        if (data.segments) {
          setSegments(data.segments);
          localStorage.setItem(`segments_${targetFilename}`, JSON.stringify(data.segments));
        }
        if (data.keywords) {
          setDetectedKeywords(data.keywords);
          localStorage.setItem(`keywords_${targetFilename}`, JSON.stringify(data.keywords));
        }
        if (data.detected_language) {
          setLanguage(data.detected_language);
        }

        const words = data.transcript.trim().split(/\s+/).filter(Boolean).length;
        setTranscriptWords(words);
        setProcessingTime(data.processing_time || "0.5");
        setKeyMomentsCount(data.key_moments_count || 5);
      } else {
        setTranscript("");
        setEditedText("");
        setSegments([]);
        setDetectedKeywords([]);
      }
    } catch (err) {
      console.log("No pre-saved transcript found for", targetFilename);
      setTranscript("");
      setEditedText("");
      setSegments([]);
      setDetectedKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelectChange = (e) => {
    const fname = e.target.value;
    setSelectedVideo(fname);
    setFilename(fname);
    localStorage.setItem("uploadedVideo", fname);

    const found = videoList.find((v) => (v.filename || v.video_name) === fname);
    setVideoName(found ? found.video_name || fname : fname);
    setVideoURL(`http://127.0.0.1:8000/uploads/videos/${fname}`);

    setTranscript("");
    setEditedText("");
    setSegments([]);
    setDetectedKeywords([]);

    autoFetchPreGeneratedData(fname);
  };

  const handleStartEdit = () => {
    setEditedText(transcript);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const activeFile = filename || localStorage.getItem("uploadedVideo");
    if (!activeFile) {
      toast.error("Filename is missing");
      return;
    }
    try {
      setLoading(true);
      await updateTranscript(activeFile, editedText);
      setTranscript(editedText);

      const newWordCount = editedText.trim().split(/\s+/).filter(Boolean).length;
      setTranscriptWords(newWordCount);

      localStorage.setItem("transcript", editedText);
      localStorage.setItem(`transcript_${activeFile}`, editedText);
      localStorage.setItem("transcriptWords", newWordCount);
      localStorage.setItem(`educator_edited_${activeFile}`, "true");

      setIsEditing(false);
      toast.success("Transcript updated and saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save updated transcript");
    } finally {
      setLoading(false);
    }
  };

  // 🎬 Content Creator Feature: Download Transcript as TXT File
  const handleDownloadTranscript = () => {
    const textToDownload = transcript || editedText;
    if (!textToDownload) {
      toast.warning("No transcript available to download");
      return;
    }
    const blob = new Blob([textToDownload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const exportName = (videoName || filename || "Transcript").replace(/\.[^/.]+$/, "");
    link.download = `${exportName}_Transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("📥 Transcript Downloaded Successfully!");
  };

  const toggleBookmark = (text, seconds = 0, timestamp = "00:00") => {
    const exists = bookmarks.some((b) => b.title === text);
    let updated;
    if (exists) {
      updated = bookmarks.filter((b) => b.title !== text);
      toast.info("Bookmark removed");
    } else {
      updated = [...bookmarks, { type: "Sentence", title: text, seconds, timestamp }];
      toast.success("Bookmark saved to My Bookmarks!");
    }
    setBookmarks(updated);
    localStorage.setItem("bookmarks_default", JSON.stringify(updated));
  };

  const isBookmarked = (text) => bookmarks.some((b) => b.title === text);

  // ---------------- Stream & Generate Transcript ----------------
  const handleGenerate = async () => {
    if (!filename) {
      toast.error("No uploaded video found");
      return;
    }

    try {
      setLoading(true);
      setTranscript("");
      setEditedText("");
      setSegments([]);
      setExplanation("");
      setSearchWord("");
      setActiveKeyword("");
      setDetectedKeywords([]);
      setProcessingTime(0);
      setTranscriptWords(0);
      setKeyMomentsCount(0);
      setIsEditing(false);

      const startTime = performance.now();

      const response = await fetch(
        transcriptStreamURL(filename, selectedLanguage)
      );

      if (!response.ok) {
        throw new Error("Failed to start transcript stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let transcriptText = "";
      let allSegments = [];
      let importantMoments = [];
      let keywordSet = new Set();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const events = chunk.split("\n\n").filter(Boolean);

        for (const event of events) {
          if (!event.startsWith("data:")) continue;

          const jsonStr = event.replace("data:", "").trim();

          try {
            const data = JSON.parse(jsonStr);

            if (data.text) {
              transcriptText = data.text;
              setTranscript(transcriptText);
              setEditedText(transcriptText);
              localStorage.setItem("transcript", transcriptText);
              localStorage.setItem(`transcript_${filename}`, transcriptText);
            }

            if (data.detected_language) {
              setLanguage(data.detected_language);
              localStorage.setItem("detectedLanguage", data.detected_language);
            }

            if (data.segment) {
              allSegments.push(data.segment);
              setSegments([...allSegments]);
              localStorage.setItem("segments", JSON.stringify(allSegments));
              localStorage.setItem(`segments_${filename}`, JSON.stringify(allSegments));

              const currentWordCount = transcriptText
                .trim()
                .split(/\s+/)
                .filter(Boolean).length;
              setTranscriptWords(currentWordCount);
              localStorage.setItem("transcriptWords", currentWordCount);

              const cleanText = data.segment.text.replace(/[^\p{L}\p{M}\s]/gu, "");
              const words = cleanText.split(/\s+/).filter((w) => w.trim().length >= 3);

              if (words) {
                words.forEach((word) => {
                  const cleanedWord = word.trim();
                  if (!stopWords.has(cleanedWord.toLowerCase())) {
                    keywordSet.add(cleanedWord);
                  }
                });
                const keywordArr = [...keywordSet];
                setDetectedKeywords(keywordArr);
                localStorage.setItem("keywords", JSON.stringify(keywordArr));
                localStorage.setItem(`keywords_${filename}`, JSON.stringify(keywordArr));
              }

              const textLower = data.segment.text.toLowerCase();
              if (
                textLower.includes("important") ||
                textLower.includes("conclusion") ||
                textLower.includes("summary") ||
                textLower.includes("result") ||
                textLower.includes("finally") ||
                textLower.includes("therefore") ||
                textLower.includes("key") ||
                textLower.includes("objective") ||
                textLower.includes("algorithm") ||
                textLower.includes("accuracy") ||
                textLower.includes("முக்கிய") ||
                textLower.includes("முடிவு")
              ) {
                importantMoments.push({
                  time: `${Math.floor(data.segment.start / 60)}:${String(
                    Math.floor(data.segment.start % 60)
                  ).padStart(2, "0")}`,
                  start: data.segment.start,
                  end: data.segment.end,
                  text: data.segment.text
                });
                setKeyMomentsCount(importantMoments.length);
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
      }

      const endTime = performance.now();
      const elapsed = ((endTime - startTime) / 1000).toFixed(2);
      setProcessingTime(elapsed);
      localStorage.setItem("processingTime", elapsed);

      localStorage.setItem("keyMoments", JSON.stringify(importantMoments));

      toast.success("Transcript Generated Successfully");
    } catch (error) {
      console.log(error);
      toast.error("Transcript Generation Failed");
    } finally {
      setLoading(false);
    }
  };

  const executeExplain = async (targetWord) => {
    const wordToSearch = targetWord || searchWord;
    if (!wordToSearch.trim()) {
      toast.warning("Enter or select a keyword");
      return;
    }

    try {
      setLoadingExplain(true);
      const kw = wordToSearch.trim();
      setActiveKeyword(kw);
      localStorage.setItem("activeKeyword", kw);

      const response = await explainKeyword(
        transcript,
        kw,
        selectedLanguage
      );
      const expText = response.data.explanation;
      setExplanation(expText);
      localStorage.setItem("explanation", expText);

      toast.success("Keyword Explained Successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to explain keyword");
    } finally {
      setLoadingExplain(false);
    }
  };

  const handleKeywordClick = (word) => {
    setSearchWord(word);
    executeExplain(word);
  };

  const foundMatches = useMemo(() => {
    if (!activeKeyword) return [];
    return segments.filter((seg) =>
      seg.text.toLowerCase().includes(activeKeyword.toLowerCase())
    );
  }, [segments, activeKeyword]);

  const renderHighlightedTranscript = () => {
    if (!transcript) {
      return (
        <p style={{ color: "#9ca3af" }}>
          Generated transcript will appear here in real-time...
        </p>
      );
    }

    if (!activeKeyword.trim()) {
      return (
        <div style={{ margin: 0 }}>
          {transcript}
          <button
            onClick={() => toggleBookmark(transcript)}
            style={{
              marginLeft: "12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: isBookmarked(transcript) ? "#f59e0b" : "#94a3b8"
            }}
            title="Bookmark Full Transcript"
          >
            {isBookmarked(transcript) ? "★" : "☆"}
          </button>
        </div>
      );
    }

    const escapedKeyword = activeKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedKeyword})`, "gui");
    const parts = transcript.split(regex);

    return (
      <p style={{ margin: 0 }}>
        {parts.map((part, index) =>
          part.toLowerCase() === activeKeyword.toLowerCase() ? (
            <mark
              key={index}
              style={{
                backgroundColor: "#fef08a",
                color: "#854d0e",
                padding: "2px 4px",
                borderRadius: "4px",
                fontWeight: "bold"
              }}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </p>
    );
  };

  const handleNext = () => {
    navigate("/summary");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f6fa",
        padding: "40px"
      }}
    >
      <h1 style={{ color: "#2563eb", marginBottom: "25px" }}>
        AI Transcript ({userRole} Mode)
      </h1>

      {/* Main Video & Language Section */}
      <div
        style={{
          background: "#ffffff",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}
      >
        {isLearner && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "bold", marginRight: "10px" }}>
              Select Lesson Video:
            </label>
            <select
              value={selectedVideo}
              onChange={handleVideoSelectChange}
              style={{
                padding: "10px 15px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "15px",
                minWidth: "300px"
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

        <h3 style={{ marginBottom: "20px" }}>Uploaded Video</h3>

        <div
          style={{
            display: "flex",
            gap: "30px",
            alignItems: "flex-start",
            flexWrap: "wrap"
          }}
        >
          <div style={{ flex: 2, minWidth: "300px" }}>
            <video
              src={videoURL}
              controls
              width="100%"
              height="300"
              style={{
                borderRadius: "10px",
                border: "1px solid #d1d5db"
              }}
            />
            <p style={{ marginTop: "12px", color: "#555" }}>
              <strong>Video : </strong> {videoName}
            </p>
            {language && (
              <p>
                <strong>Detected Language : </strong> {language.toUpperCase()}
              </p>
            )}
          </div>

          <div style={{ flex: 1, minWidth: "250px" }}>
            <label style={{ fontWeight: "600" }}>Select Output Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "10px",
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

            {!isLearner ? (
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  padding: "12px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Generating..." : "Generate Transcript"}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  padding: "12px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Loading..." : "Load Transcript"}
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "12px",
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer"
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Generated Transcript Paragraph Section */}
        <div style={{ marginTop: "35px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2 style={{ color: "#2563eb", margin: 0 }}>
              Generated Transcript
            </h2>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* 🎬 Content Creator Feature: Download Transcript Button (RESTRICTED TO CONTENT CREATOR / ADMIN) */}
              {isContentCreator && transcript && (
                <button
                  onClick={handleDownloadTranscript}
                  style={{
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                >
                  📥 Download Transcript
                </button>
              )}

              {/* 🟢 Requirement 3: Review & Edit Transcript Controls for Educator */}
              {!isLearner && (
                <div>
                  {!isEditing ? (
                    <button
                      onClick={handleStartEdit}
                      style={{
                        background: "#f59e0b",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 18px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "14px"
                      }}
                    >
                      ✏️ Edit Transcript
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        style={{
                          background: "#16a34a",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "6px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontWeight: "bold",
                          fontSize: "14px"
                        }}
                      >
                        {loading ? "Saving..." : "✅ Save Changes"}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={loading}
                        style={{
                          background: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "6px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontWeight: "bold",
                          fontSize: "14px"
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              width: "100%",
              minHeight: "180px",
              padding: "20px",
              borderRadius: "10px",
              border: isEditing ? "2px solid #2563eb" : "1px solid #d1d5db",
              background: "#ffffff",
              fontSize: "15px",
              lineHeight: "28px",
              color: "#1f2937"
            }}
          >
            {isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                placeholder="Type or paste updated transcript here..."
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "15px",
                  lineHeight: "28px",
                  outline: "none",
                  fontFamily: "inherit"
                }}
              />
            ) : (
              renderHighlightedTranscript()
            )}
          </div>
        </div>

        {/* Transcript Statistics Bar */}
        {transcript && (
          <div
            style={{
              marginTop: "30px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: "20px"
            }}
          >
            <div
              style={{
                background: "#eff6ff",
                padding: "18px",
                borderRadius: "10px"
              }}
            >
              <h3>Processing Time</h3>
              <h2>{processingTime} sec</h2>
            </div>

            <div
              style={{
                background: "#f0fdf4",
                padding: "18px",
                borderRadius: "10px"
              }}
            >
              <h3>Transcript Words</h3>
              <h2>{transcriptWords}</h2>
            </div>

            <div
              style={{
                background: "#fef9c3",
                padding: "18px",
                borderRadius: "10px"
              }}
            >
              <h3>Keywords</h3>
              <h2>{detectedKeywords.length}</h2>
            </div>

            <div
              style={{
                background: "#ede9fe",
                padding: "18px",
                borderRadius: "10px"
              }}
            >
              <h3>Key Moments</h3>
              <h2>{keyMomentsCount}</h2>
            </div>
          </div>
        )}

        {/* Detected Keywords Chips */}
        {detectedKeywords.length > 0 && (
          <div
            style={{
              marginTop: "35px",
              background: "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb"
            }}
          >
            <h2>Detected Keywords</h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "15px"
              }}
            >
              {detectedKeywords.map((keyword, index) => {
                const isSelected =
                  activeKeyword.toLowerCase() === keyword.toLowerCase();
                return (
                  <span
                    key={index}
                    onClick={() => handleKeywordClick(keyword)}
                    style={{
                      background: isSelected ? "#8b5cf6" : "#dbeafe",
                      color: isSelected ? "#ffffff" : "#1d4ed8",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      cursor: "pointer",
                      fontWeight: isSelected ? "bold" : "normal",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {keyword}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Explain Keyword Section */}
        <div
          style={{
            marginTop: "35px",
            background: "#ffffff",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb"
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: "700" }}>
            🔍 Search & Explain Keyword
          </h2>

          <div style={{ marginTop: "15px" }}>
            <input
              type="text"
              placeholder="Enter Keyword"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "15px"
              }}
            />

            <button
              onClick={() => executeExplain()}
              disabled={loadingExplain}
              style={{
                marginTop: "15px",
                padding: "12px 24px",
                background: "#8b5cf6",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: loadingExplain ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "15px"
              }}
            >
              {loadingExplain ? "Explaining..." : "Explain Keyword"}
            </button>
          </div>

          {/* Found In Section */}
          {activeKeyword && foundMatches.length > 0 && (
            <div style={{ marginTop: "25px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  marginBottom: "10px"
                }}
              >
                Found In
              </h3>

              {foundMatches.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: "#f8fafc",
                    padding: "15px 18px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: "bold",
                        color: "#1e293b",
                        margin: "0 0 6px 0",
                        fontSize: "14px"
                      }}
                    >
                      {item.start.toFixed(2)}s - {item.end.toFixed(2)}s
                    </p>
                    <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>
                      {item.text}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleBookmark(item.text, item.start, `${item.start.toFixed(0)}s`)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "18px",
                      color: isBookmarked(item.text) ? "#f59e0b" : "#94a3b8"
                    }}
                    title="Bookmark Segment"
                  >
                    {isBookmarked(item.text) ? "★" : "☆"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI Explanation Box */}
          {explanation && (
            <div
              style={{
                marginTop: "25px",
                background: "#eff6ff",
                padding: "20px 24px",
                borderRadius: "12px",
                border: "1px solid #bfdbfe"
              }}
            >
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "#1e3a8a",
                  margin: "0 0 10px 0"
                }}
              >
                AI Explanation
              </h3>
              <p
                style={{
                  margin: 0,
                  lineHeight: "26px",
                  color: "#1e293b",
                  fontSize: "14.5px"
                }}
              >
                {explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Transcript;