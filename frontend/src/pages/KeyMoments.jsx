import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { generateKeyMoments, getAllVideos, getSavedKeyMoments } from "../api";
import Loader from "../components/Loader";

function KeyMoments() {
    const navigate = useNavigate();
    const videoRef = useRef(null);

    // ---------------- User Role & Mode Detection ----------------
    const userRole = localStorage.getItem("userRole") || localStorage.getItem("role") || "Learner";
    const isLearner = userRole.toLowerCase() === "learner";

    // ---------------- Local Storage Data ----------------
    const defaultFilename = localStorage.getItem("uploadedVideo") || localStorage.getItem("selectedCourse") || "";
    const defaultTranscript = localStorage.getItem("transcript") || "";
    const defaultVideoURL = localStorage.getItem("videoURL") || "";
    const videoId = localStorage.getItem("videoId") || "default";

    // ---------------- Learner States ----------------
    const [videoList, setVideoList] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState("");

    // ---------------- States ----------------
    const [transcript, setTranscript] = useState(defaultTranscript);
    const [videoURL, setVideoURL] = useState(defaultVideoURL);

    const [timestampData, setTimestampData] = useState([]);
    const [importantSegments, setImportantSegments] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [topicSegments, setTopicSegments] = useState([]);
    const [sentenceData, setSentenceData] = useState([]);
    const [keywords, setKeywords] = useState([]);

    const [loading, setLoading] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [generated, setGenerated] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [bookmarks, setBookmarks] = useState([]);

    // UI Layout States
    const [activeTab, setActiveTab] = useState("timestamps");
    const [showAllKeywords, setShowAllKeywords] = useState(false);

    const languages = [
        { code: "en", name: "English" },
        { code: "ta", name: "Tamil" },
        { code: "hi", name: "Hindi" },
        { code: "te", name: "Telugu" }
    ];

    // 🟢 Restore Persistence Data & Bookmarks on Page Load
    useEffect(() => {
        const storedBookmarks = localStorage.getItem(`bookmarks_${videoId}`) || localStorage.getItem("bookmarks_default");
        if (storedBookmarks) {
            try {
                setBookmarks(JSON.parse(storedBookmarks));
            } catch (e) {
                console.error("Bookmarks parse error", e);
            }
        }

        // Check if there is an incoming Seek request from Bookmarks Page
        const pendingSeek = localStorage.getItem("seekTime");
        if (pendingSeek && videoRef.current) {
            seekToTime(Number(pendingSeek));
            localStorage.removeItem("seekTime");
        }

        if (isLearner) {
            const activeVideo = localStorage.getItem("uploadedVideo") || defaultFilename;
            fetchLearnerVideos(activeVideo);
        } else {
            // Educator/Creator View
            const savedKeyMoments = localStorage.getItem(`cached_key_moments_${defaultFilename}`) || localStorage.getItem("cached_key_moments");
            if (savedKeyMoments) {
                try {
                    const parsed = JSON.parse(savedKeyMoments);
                    setTimestampData(parsed.timestamp_data || []);
                    setImportantSegments(parsed.important_segments || []);
                    setHighlights(parsed.highlights || []);
                    setTopicSegments(parsed.topic_segments || []);
                    setSentenceData(parsed.sentence_data || []);
                    setKeywords(parsed.keywords || []);
                    setGenerated(true);
                } catch (err) {
                    console.error("Cache parsing error", err);
                }
            }
        }
    }, [videoId, isLearner, defaultFilename]);

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

                // 🟢 Automatically Fetch Pre-Generated Key Moments for Active Video
                autoFetchPreGeneratedKeyMoments(targetVid);
            }
        } catch (err) {
            console.error("Failed to load video list:", err);
            toast.error("Failed to load lessons list");
        }
    };

    // 🟢 AUTOMATIC KEY MOMENTS FETCH FUNCTION
    const autoFetchPreGeneratedKeyMoments = async (targetFilename) => {
        if (!targetFilename) return;

        // 1. LocalStorage Caching Check (by specific filename)
        const cachedKeyMoments = localStorage.getItem(`cached_key_moments_${targetFilename}`);
        if (cachedKeyMoments) {
            try {
                const parsed = JSON.parse(cachedKeyMoments);
                setTimestampData(parsed.timestamp_data || []);
                setImportantSegments(parsed.important_segments || []);
                setHighlights(parsed.highlights || []);
                setTopicSegments(parsed.topic_segments || []);
                setSentenceData(parsed.sentence_data || []);
                setKeywords(parsed.keywords || []);
                setGenerated(true);
                return;
            } catch (err) {
                console.error("Cache parsing error", err);
            }
        }

        // 2. Fetch from Backend API
        try {
            setLoading(true);
            const langObj = languages.find((l) => l.code === selectedLanguage);
            const targetLangName = langObj ? langObj.name : "English";

            const res = await getSavedKeyMoments(targetFilename, targetLangName);
            if (res && res.data && res.data.success) {
                const result = res.data;
                setTimestampData(result.timestamp_data || []);
                setImportantSegments(result.important_segments || []);
                setHighlights(result.highlights || []);
                setTopicSegments(result.topic_segments || []);
                setSentenceData(result.sentence_data || []);
                setKeywords(result.keywords || []);

                localStorage.setItem(`cached_key_moments_${targetFilename}`, JSON.stringify(result));
                setGenerated(true);
            } else {
                setGenerated(false);
                setTimestampData([]);
                setImportantSegments([]);
                setHighlights([]);
                setTopicSegments([]);
                setSentenceData([]);
                setKeywords([]);
            }
        } catch (err) {
            console.log("No pre-saved key moments found from backend for", targetFilename);
            setGenerated(false);
            setTimestampData([]);
            setImportantSegments([]);
            setHighlights([]);
            setTopicSegments([]);
            setSentenceData([]);
            setKeywords([]);
        } finally {
            setLoading(false);
        }
    };

    const handleVideoSelectChange = (e) => {
        const fname = e.target.value;
        setSelectedVideo(fname);
        setVideoURL(`http://127.0.0.1:8000/uploads/videos/${fname}`);
        localStorage.setItem("uploadedVideo", fname);
        setGenerated(false);

        autoFetchPreGeneratedKeyMoments(fname);
    };

    const seekToTime = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime = seconds;
            videoRef.current.play();
        }
    };

    const handleGenerateKeyMoments = async () => {
        const activeFile = selectedVideo || defaultFilename;
        const currentTranscript = localStorage.getItem(`transcript_${activeFile}`) || localStorage.getItem("transcript") || transcript;

        if (!currentTranscript) {
            toast.warning("Transcript not found. Please generate transcript first.");
            return;
        }

        try {
            setLoading(true);

            // 🟢 Send full language name to AI model
            const langObj = languages.find((l) => l.code === selectedLanguage);
            const targetLangName = langObj ? langObj.name : "English";

            const response = await generateKeyMoments(currentTranscript, targetLangName, videoDuration);
            const result = response.data;

            setTimestampData(result.timestamp_data || []);
            setImportantSegments(result.important_segments || []);
            setHighlights(result.highlights || []);
            setTopicSegments(result.topic_segments || []);
            setSentenceData(result.sentence_data || []);
            setKeywords(result.keywords || []);

            // 🟢 Cache to LocalStorage specifically for active video
            localStorage.setItem("cached_key_moments", JSON.stringify(result));
            if (activeFile) {
                localStorage.setItem(`cached_key_moments_${activeFile}`, JSON.stringify(result));
            }

            setGenerated(true);
            toast.success(`Key Moments Generated in ${targetLangName}!`);
        } catch (error) {
            console.error("Key Moments Error:", error);
            toast.error("Key Moments Generation Failed");
        } finally {
            setLoading(false);
        }
    };

    const isBookmarked = (title, seconds) => bookmarks.some((b) => b.seconds === seconds && b.title === title);

    // 🟢 Bookmark functionality (Allowed for Learners & Educators)
    const toggleBookmark = (type, title, seconds, timestamp) => {
        const exists = bookmarks.find((b) => b.seconds === seconds && b.title === title);
        let updated = exists
            ? bookmarks.filter((b) => !(b.seconds === seconds && b.title === title))
            : [...bookmarks, { type, title, seconds, timestamp }];

        setBookmarks(updated);
        localStorage.setItem(`bookmarks_${videoId}`, JSON.stringify(updated));
        localStorage.setItem("bookmarks_default", JSON.stringify(updated));
        toast.info(exists ? "Bookmark removed" : "Bookmark saved!");
    };

    const matchesSearch = (text) => !searchQuery.trim() || (text || "").toLowerCase().includes(searchQuery.toLowerCase());

    const filteredSentences = useMemo(() => sentenceData.filter((s) => matchesSearch(s.text)), [sentenceData, searchQuery]);
    const filteredHighlights = useMemo(() => highlights.filter((h) => matchesSearch(h.title) || matchesSearch(h.keyword)), [highlights, searchQuery]);
    const filteredSegments = useMemo(() => importantSegments.filter((seg) => matchesSearch(seg.description) || matchesSearch(seg.keyword)), [importantSegments, searchQuery]);
    const filteredTopics = useMemo(() => topicSegments.filter((seg) => matchesSearch(seg.topic)), [topicSegments, searchQuery]);

    const visibleKeywords = showAllKeywords ? keywords.filter(matchesSearch) : keywords.filter(matchesSearch).slice(0, 18);

    // 🟢 Export Feature (Educator / Content Creator Feature)
    const handleExportHighlights = () => {
        let content = "===== CLIPMIND AI REPORT =====\n\n";
        sentenceData.forEach((s) => { content += `${s.timestamp} ${s.text}\n`; });
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "clipmind_key_moments_report.txt";
        link.click();
        toast.success("Report Exported Successfully!");
    };

    const BookmarkButton = ({ type, title, seconds, timestamp }) => (
        <button
            onClick={(e) => { e.stopPropagation(); toggleBookmark(type, title, seconds, timestamp); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginLeft: "8px", color: isBookmarked(title, seconds) ? "#f59e0b" : "#94a3b8" }}
            title="Bookmark this moment"
        >
            {isBookmarked(title, seconds) ? "★" : "☆"}
        </button>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "30px 40px" }}>
            <h1 style={{ color: "#2563eb", marginBottom: "20px", fontSize: "26px", fontWeight: "700" }}>
                AI Key Moments Detection ({userRole} Mode)
            </h1>

            {/* Video Player & Control Panel */}
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: "20px", marginBottom: "25px" }}>
                <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
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
                        ref={videoRef}
                        controls
                        src={videoURL}
                        onLoadedMetadata={(e) => setVideoDuration(e.target.duration)}
                        style={{ width: "100%", height: "360px", objectFit: "contain", background: "#000", borderRadius: "8px" }}
                    />
                </div>

                <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,.06)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h3 style={{ marginBottom: "10px", fontSize: "16px" }}>Select Output Language</h3>
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", marginBottom: "15px" }}
                    >
                        {languages.map((lang) => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                    </select>

                    <button
                        onClick={handleGenerateKeyMoments}
                        disabled={loading}
                        style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", marginBottom: "10px", fontWeight: "600" }}
                    >
                        {loading ? "Generating..." : "Generate Key Moments"}
                    </button>

                    {/* Export Report allowed for Content Creators, Educators, Administrators */}
                    {!isLearner && (
                        <button
                            onClick={handleExportHighlights}
                            style={{ width: "100%", background: "#f59e0b", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", marginBottom: "10px" }}
                        >
                            ⬇ Export Report
                        </button>
                    )}

                    <button
                        onClick={() => navigate(isLearner ? "/dashboard" : "/analytics")}
                        style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer" }}
                    >
                        {isLearner ? "Back to Dashboard" : "Next to Analytics →"}
                    </button>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : generated && (
                <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                    
                    {/* Search Bar for Timestamps & Key Moments (Learner Feature) */}
                    <div style={{ display: "flex", gap: "15px", marginBottom: "20px", alignItems: "center" }}>
                        <input
                            type="text"
                            placeholder="🔍 Search key moments, sentences, keywords..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ flex: 1, padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                        />
                    </div>

                    {/* Detected Keywords */}
                    {keywords.length > 0 && (
                        <div style={{ marginBottom: "20px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{ fontWeight: "600", fontSize: "13px", color: "#475569" }}>DETECTED KEYWORDS ({keywords.length})</span>
                                <button
                                    onClick={() => setShowAllKeywords(!showAllKeywords)}
                                    style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                                >
                                    {showAllKeywords ? "Show Less ▲" : "Show All ▼"}
                                </button>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {visibleKeywords.map((word, index) => (
                                    <span
                                        key={index}
                                        onClick={() => setSearchQuery(word)}
                                        style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", cursor: "pointer" }}
                                    >
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation Tabs */}
                    <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: "20px" }}>
                        <button
                            onClick={() => setActiveTab("timestamps")}
                            style={{ padding: "10px 20px", border: "none", background: "none", borderBottom: activeTab === "timestamps" ? "3px solid #2563eb" : "none", color: activeTab === "timestamps" ? "#2563eb" : "#64748b", fontWeight: "600", cursor: "pointer" }}
                        >
                            Timestamp Extraction ({filteredSentences.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("highlights")}
                            style={{ padding: "10px 20px", border: "none", background: "none", borderBottom: activeTab === "highlights" ? "3px solid #2563eb" : "none", color: activeTab === "highlights" ? "#2563eb" : "#64748b", fontWeight: "600", cursor: "pointer" }}
                        >
                            Highlights & Segments ({filteredHighlights.length + filteredSegments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("topics")}
                            style={{ padding: "10px 20px", border: "none", background: "none", borderBottom: activeTab === "topics" ? "3px solid #2563eb" : "none", color: activeTab === "topics" ? "#2563eb" : "#64748b", fontWeight: "600", cursor: "pointer" }}
                        >
                            Topics ({filteredTopics.length})
                        </button>
                    </div>

                    {/* TAB 1: Timestamps List (Interactive Seek & Bookmark for Learners) */}
                    {activeTab === "timestamps" && (
                        <div style={{ maxHeight: "360px", overflowY: "auto", paddingRight: "8px" }}>
                            {filteredSentences.map((s, index) => (
                                <div
                                    key={index}
                                    onClick={() => seekToTime(s.seconds)}
                                    style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 8px", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                                >
                                    <span style={{ color: "#2563eb", fontWeight: "600", fontSize: "13px", minWidth: "45px" }}>{s.timestamp}</span>
                                    <span style={{ color: "#334155", flex: 1, fontSize: "14px" }}>{s.text}</span>
                                    <BookmarkButton type="Sentence" title={s.text} seconds={s.seconds} timestamp={s.timestamp} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TAB 2: Highlights & Segments */}
                    {activeTab === "highlights" && (
                        <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
                            <h4 style={{ color: "#16a34a", marginBottom: "10px" }}>Key Highlights</h4>
                            {filteredHighlights.map((h, index) => (
                                <div key={index} onClick={() => seekToTime(h.seconds)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f0fdf4", borderRadius: "6px", marginBottom: "8px", cursor: "pointer" }}>
                                    <span>⏱ <b>{h.timestamp}</b> — {h.title}</span>
                                    <BookmarkButton type="Highlight" title={h.title} seconds={h.seconds} timestamp={h.timestamp} />
                                </div>
                            ))}

                            <h4 style={{ color: "#b45309", marginTop: "20px", marginBottom: "10px" }}>Important Video Segments</h4>
                            {filteredSegments.map((seg, index) => (
                                <div key={index} onClick={() => seekToTime(seg.start_seconds)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#fef3c7", borderRadius: "6px", marginBottom: "8px", cursor: "pointer" }}>
                                    <span>⏱ <b>{seg.start_time} – {seg.end_time}</b> | {seg.description}</span>
                                    <BookmarkButton type="Segment" title={seg.description} seconds={seg.start_seconds} timestamp={seg.start_time} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TAB 3: Topic Segmentation */}
                    {activeTab === "topics" && (
                        <div>
                            {filteredTopics.map((seg, index) => (
                                <div key={index} onClick={() => seekToTime(seg.start_seconds)} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#f5f3ff", borderRadius: "8px", marginBottom: "8px", cursor: "pointer", borderLeft: "4px solid #7c3aed" }}>
                                    <span style={{ fontWeight: "600", color: "#5b21b6" }}>{seg.topic}</span>
                                    <span style={{ color: "#64748b", fontSize: "13px" }}>{seg.start_time} – {seg.end_time}</span>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}

export default KeyMoments;