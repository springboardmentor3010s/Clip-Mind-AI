import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { uploadVideo } from "../api";

function Upload() {
    const navigate = useNavigate();

    // 🔴 RBAC Check: Restrict Upload page for Learners
    const userRole = localStorage.getItem("userRole") || localStorage.getItem("role") || "Learner";

    // ---------------- States ----------------
    const [file, setFile] = useState(null);

    const [uploaded, setUploaded] = useState(false);
    const [uploadDone, setUploadDone] = useState(false);
    const [storageDone, setStorageDone] = useState(false);
    const [audioDone, setAudioDone] = useState(false);
    const [whisperDone, setWhisperDone] = useState(false);
    const [databaseDone, setDatabaseDone] = useState(false);

    const [audioUrl, setAudioUrl] = useState("");
    const [loading, setLoading] = useState(false);

    // ---------------- Access Control UI for Learner ----------------
    if (userRole.toLowerCase() === "learner") {
        return (
            <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "40px" }}>
                <div style={{ background: "#ffffff", padding: "40px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center", maxWidth: "500px" }}>
                    <h1 style={{ fontSize: "50px", margin: "0 0 10px 0" }}>🚫</h1>
                    <h2 style={{ color: "#ef4444", marginBottom: "10px" }}>Access Restricted</h2>
                    <p style={{ color: "#64748b", lineHeight: "24px", marginBottom: "25px" }}>
                        Video Upload feature is only available for <b>Educators</b>, <b>Content Creators</b>, and <b>Administrators</b>.
                    </p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "12px 25px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "15px" }}
                    >
                        ← Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ---------------- Upload Handler ----------------
    const handleUpload = async () => {
        if (!file) {
            toast.warning("Please choose a video file");
            return;
        }

        // 🔴 1st Point: Educator புதிய வீடியோ அப்லோட் செய்யும் போது மட்டுமே பழைய தரவுகள் நீக்கப்பட்டு Reset ஆகும்
        localStorage.removeItem("transcript");
        localStorage.removeItem("summary");
        localStorage.removeItem("keyMoments");

        localStorage.removeItem("uploadedVideo");
        localStorage.removeItem("videoURL");
        localStorage.removeItem("videoName");
        localStorage.removeItem("videoPath");
        localStorage.removeItem("audioPath");

        try {
            setLoading(true);
            const userId = localStorage.getItem("userId") || localStorage.getItem("user_id") || 1;

            // Local File Upload
            const response = await uploadVideo(userId, file);
            const responseData = response.data;
            const audioPath = responseData.audio_path;
            const fullAudioUrl = `http://127.0.0.1:8000/${audioPath}`;

            // 🟢 1st Point: புதிய வீடியோவின் விவரங்கள் சேமிப்பு (அடுத்த அப்லோட் வரை இது அழியாது)
            localStorage.setItem("uploadedVideo", responseData.filename);
            localStorage.setItem("videoName", file.name);
            localStorage.setItem("videoURL", responseData.video_url || `http://127.0.0.1:8000/uploads/videos/${responseData.filename}`);
            localStorage.setItem("videoPath", responseData.video_path || "");
            localStorage.setItem("audioPath", audioPath);

            // ---------------- Progress Workflow Visualizer ----------------
            setUploaded(true);
            setUploadDone(true);

            setTimeout(() => {
                setStorageDone(true);
            }, 700);

            setTimeout(() => {
                setAudioDone(true);
                setAudioUrl(fullAudioUrl);
            }, 1400);

            setTimeout(() => {
                setWhisperDone(true);
            }, 2100);

            setTimeout(() => {
                setDatabaseDone(true);
            }, 2800);

            toast.success("Video Uploaded & Processed Successfully");

        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.detail || "Upload Failed");
        } finally {
            setLoading(false);
        }
    };

    const boxStyle = (color) => ({
        width: "170px",
        background: "#ffffff",
        border: `3px solid ${color}`,
        borderRadius: "18px",
        padding: "20px",
        textAlign: "center",
        fontWeight: "bold",
        boxShadow: "0 8px 20px rgba(0,0,0,.10)",
        transition: "0.4s",
    });

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg,#eef2ff,#ffffff)",
                padding: "40px"
            }}
        >
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "auto"
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background: "linear-gradient(90deg,#2563eb,#7c3aed)",
                        color: "#ffffff",
                        padding: "35px",
                        borderRadius: "20px",
                        textAlign: "center",
                        boxShadow: "0 10px 25px rgba(0,0,0,.2)"
                    }}
                >
                    <h1 style={{ margin: 0, fontSize: "42px" }}>
                        🎬 ClipMind AI Upload Center ({userRole} Mode)
                    </h1>
                    <p style={{ marginTop: "12px", fontSize: "18px" }}>
                        Upload your video and let AI generate transcripts, summaries and key moments automatically.
                    </p>
                </div>

                {/* Upload Card */}
                <div
                    style={{
                        background: "#ffffff",
                        marginTop: "35px",
                        padding: "35px",
                        borderRadius: "20px",
                        boxShadow: "0 5px 20px rgba(0,0,0,.1)"
                    }}
                >
                    <h2 style={{ textAlign: "center", marginBottom: "25px", color: "#1e293b" }}>
                        📁 Select Video
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "15px"
                        }}
                    >
                        {/* File Upload Input */}
                        <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                                setFile(e.target.files[0]);
                            }}
                        />
                    </div>

                    {file && (
                        <div style={{ marginTop: "25px", textAlign: "center" }}>
                            <h3 style={{ color: "#2563eb" }}>Selected Video Source</h3>
                            <p style={{ fontWeight: "bold", color: "#475569", wordBreak: "break-all" }}>
                                {file.name}
                            </p>
                            <p style={{ color: "#64748b" }}>Ready for AI Processing</p>
                        </div>
                    )}

                    <div style={{ textAlign: "center", marginTop: "30px" }}>
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            style={{
                                border: "none",
                                background: "linear-gradient(90deg,#2563eb,#7c3aed)",
                                color: "#ffffff",
                                padding: "16px 50px",
                                borderRadius: "10px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontWeight: "bold",
                                fontSize: "18px"
                            }}
                        >
                            {loading ? "Uploading..." : "🚀 Upload Video"}
                        </button>
                    </div>
                </div>

                {/* AI Processing Workflow */}
                {uploaded && (
                    <div
                        style={{
                            marginTop: "40px",
                            background: "#ffffff",
                            padding: "35px",
                            borderRadius: "20px",
                            boxShadow: "0 5px 20px rgba(0,0,0,.1)"
                        }}
                    >
                        <h2 style={{ textAlign: "center", marginBottom: "35px", color: "#1e293b" }}>
                            🤖 AI Processing Workflow
                        </h2>

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "15px"
                            }}
                        >
                            {/* Upload */}
                            <div style={boxStyle("#2563eb")}>
                                <h1>☁</h1>
                                <h3>Upload</h3>
                                <p>{uploadDone ? "✅ Completed" : "⏳ Waiting"}</p>
                            </div>

                            <h2>➜</h2>

                            {/* Storage */}
                            <div style={boxStyle("#10b981")}>
                                <h1>📂</h1>
                                <h3>Storage</h3>
                                <p>{storageDone ? "✅ Saved" : "⏳ Waiting"}</p>
                            </div>

                            <h2>➜</h2>

                            {/* Audio */}
                            <div style={boxStyle("#f59e0b")}>
                                <h1>🎵</h1>
                                <h3>Audio</h3>
                                {audioDone ? (
                                    <>
                                        <p style={{ margin: "0 0 5px 0" }}>✅ Extracted</p>
                                        <audio controls style={{ width: "140px" }} key={audioUrl}>
                                            <source src={audioUrl} type="audio/wav" />
                                        </audio>
                                    </>
                                ) : (
                                    <p>⏳ Waiting</p>
                                )}
                            </div>

                            <h2>➜</h2>

                            {/* Whisper */}
                            <div style={boxStyle("#8b5cf6")}>
                                <h1>🤖</h1>
                                <h3>Whisper AI</h3>
                                {whisperDone ? (
                                    <button
                                        onClick={() => navigate("/transcript")}
                                        style={{
                                            border: "none",
                                            background: "#8b5cf6",
                                            color: "#ffffff",
                                            padding: "8px 15px",
                                            borderRadius: "8px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        View Transcript
                                    </button>
                                ) : (
                                    <p>⏳ Waiting</p>
                                )}
                            </div>

                            <h2>➜</h2>

                            {/* Database */}
                            <div style={boxStyle("#ef4444")}>
                                <h1>🗄</h1>
                                <h3>Database</h3>
                                {databaseDone ? (
                                    <>
                                        <p style={{ margin: "0 0 5px 0" }}>✅ Stored</p>
                                        <small style={{ wordBreak: "break-all" }}>
                                            {file ? file.name : "Video File"}
                                        </small>
                                    </>
                                ) : (
                                    <p>⏳ Waiting</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Summary */}
                {uploaded && (
                    <div
                        style={{
                            marginTop: "40px",
                            background: "#ffffff",
                            borderRadius: "20px",
                            padding: "35px",
                            boxShadow: "0 5px 20px rgba(0,0,0,.1)"
                        }}
                    >
                        <h2 style={{ textAlign: "center", color: "#16a34a", marginBottom: "30px" }}>
                            ✅ Upload Completed Successfully
                        </h2>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2,1fr)",
                                gap: "20px"
                            }}
                        >
                            <div style={{ background: "#eff6ff", padding: "20px", borderRadius: "12px" }}>
                                <h3>📹 Video Name</h3>
                                <p style={{ wordBreak: "break-all", margin: 0 }}>{file ? file.name : ""}</p>
                            </div>

                            <div style={{ background: "#ecfdf5", padding: "20px", borderRadius: "12px" }}>
                                <h3>📂 Storage</h3>
                                <p style={{ margin: 0 }}>Saved Successfully</p>
                            </div>

                            <div style={{ background: "#fff7ed", padding: "20px", borderRadius: "12px" }}>
                                <h3>🎵 Audio Extraction</h3>
                                <p style={{ margin: 0 }}>Completed</p>
                            </div>

                            <div style={{ background: "#f3e8ff", padding: "20px", borderRadius: "12px" }}>
                                <h3>🤖 Whisper AI</h3>
                                <p style={{ margin: 0 }}>Ready for Transcript</p>
                            </div>

                            <div style={{ background: "#fef2f2", padding: "20px", borderRadius: "12px" }}>
                                <h3>🗄 Database</h3>
                                <p style={{ margin: 0 }}>Metadata Stored</p>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px" }}>
                                <h3>👤 Uploaded By</h3>
                                <p style={{ margin: 0 }}>{localStorage.getItem("name") || "User"}</p>
                            </div>
                        </div>

                        <div style={{ textAlign: "center", marginTop: "35px" }}>
                            <button
                                onClick={() => navigate("/transcript")}
                                style={{
                                    background: "linear-gradient(90deg,#2563eb,#7c3aed)",
                                    color: "#ffffff",
                                    border: "none",
                                    padding: "16px 50px",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    fontSize: "18px",
                                    fontWeight: "bold"
                                }}
                            >
                                Continue to Transcript →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Upload;