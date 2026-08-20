import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import DashboardLayout from "./DashboardLayout";
import VideoPlayer from "./VideoPlayer";

import TranscriptPanel from "./TranscriptPanel";
import SummaryPanel from "./SummaryPanel";
import TopicsPanel from "./TopicsPanel";
import QuizPanel from "./QuizPanel";
import FlashcardsPanel from "./FlashcardsPanel";
import KeyMomentsPanel from "./KeyMomentsPanel";
import LearningMaterial from "./LearningMaterial";

import api from "../api/axios";


export default function LectureViewer({
    role: roleProp
}) {

    // Fall back to localStorage role if no prop was passed
    // (e.g. when this component is reached from a route that
    // doesn't explicitly pass a role, such as the creator's
    // "My Videos" list).
    const role =
        roleProp ||
        localStorage.getItem("role") ||
        "educator";

    const isCreator = role === "creator";
    // Bookmarks / history / view-tracking are learner-facing
    // features. Creators only get the read-only content view.
    const canUseLearnerFeatures = !isCreator;

    const [duration, setDuration] = useState(0);

    const [viewRecorded, setViewRecorded] = useState(false);

    const { videoId } = useParams();

    const location = useLocation();

    const [lecture, setLecture] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [tab, setTab] = useState(
        location.state?.tab || "Transcript"
    );

    const [bookmarks, setBookmarks] = useState({});
    // keys: "summary", "transcript-{timestamp}", "key_moment-{timestamp}"
    // values: backend bookmark id

    const videoRef = useRef(null);

    const lastSavedTime = useRef(0);

    const seekVideo = (seconds) => {

        if (videoRef.current) {

            videoRef.current.currentTime =
                Number(seconds) || 0;

            videoRef.current.play();

        }

    };

    const recordView = async () => {

        try {

            await api.post(
                `/educator/lecture/${videoId}/view`
            );

        }

        catch(err){

            console.log(err);

        }

    };

    const handleLoadedMetadata = () => {

        if(videoRef.current){

            setDuration(
                videoRef.current.duration
            );

        }

    };

    const handleTimeUpdate = () => {

        if(
            !canUseLearnerFeatures ||
            !videoRef.current ||
            viewRecorded
        ){
            return;
        }

        const current =
            videoRef.current.currentTime;

        const threshold =
            duration < 20
            ? duration / 2
            : 10;

        if(current >= threshold){

            setViewRecorded(true);

            recordView();

        }

    };

    const saveProgress = async (event) => {

        if (!canUseLearnerFeatures)
            return;

        const video = event.target;

        if (!video.duration)
            return;

        const now = video.currentTime;

        // Save approximately every 5 seconds
        if (
            now - lastSavedTime.current < 5
        ) {
            return;
        }

        lastSavedTime.current = now;

        try {

            await api.post(
                "/learner/history",
                null,
                {
                    params: {
                        learner_id:
                            localStorage.getItem(
                                "user_id"
                            ),
                        video_id:
                            videoId,
                        current_time:
                            now,
                        duration:
                            video.duration
                    }
                }
            );

        } catch (err) {

            console.error(
                "Failed to save learning progress:",
                err
            );

        }

    };

    const handleVideoTimeUpdate = (event) => {

        handleTimeUpdate();

        saveProgress(event);

    };

    const downloadLectureReport = () => {

        window.open(

            `http://localhost:8000/educator/lecture-report/${videoId}`,

            "_blank"

        );

    };

    const downloadFile = async (type) => {

        try {

            const endpoint =
                type === "transcript"
                    ? `/creator/lecture/${videoId}/download-transcript`
                    : `/creator/lecture/${videoId}/download-summary`;

            const response = await api.get(
                endpoint,
                {
                    responseType: "blob"
                }
            );

            const blob = new Blob(
                [response.data],
                {
                    type: "text/plain"
                }
            );

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                type === "transcript"
                    ? `${lecture.title}_transcript.txt`
                    : `${lecture.title}_summary.txt`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

        }

        catch (err) {

            console.error(
                "Download failed:",
                err
            );

            alert(
                err.response?.data?.detail ||
                "Unable to download file."
            );

        }

    };

    const loadBookmarks = async () => {

        if (!canUseLearnerFeatures)
            return;

        try {

            const learnerId = localStorage.getItem("user_id");

            const res = await api.get(
                "/learner/bookmarks",
                {
                    params: {
                        learner_id: learnerId
                    }
                }
            );

            const forThisVideo = res.data.filter(
                b => b.video_id === Number(videoId)
            );

            const next = {};

            forThisVideo.forEach(b => {

                if (b.bookmark_type === "summary") {

                    next["summary"] = b.id;

                } else if (b.bookmark_type === "transcript") {

                    next[`transcript-${b.timestamp}`] = b.id;

                } else if (b.bookmark_type === "key_moment") {

                    next[`key_moment-${b.timestamp}`] = b.id;

                }

            });

            setBookmarks(next);

        } catch (err) {

            console.error("Failed to load bookmarks:", err);

        }

    };

    const toggleBookmark = async (key, { type, title, content, timestamp = null }) => {

        if (!canUseLearnerFeatures)
            return;

        const existingId = bookmarks[key];

        const learnerId = localStorage.getItem("user_id");

        if (existingId) {

            try {

                await api.delete(
                    `/learner/bookmarks/${existingId}`,
                    {
                        params: {
                            learner_id: learnerId
                        }
                    }
                );

                setBookmarks(prev => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });
                alert("Bookmark Removed");

            } catch (err) {

                console.error("Failed to remove bookmark:", err);
                alert("Failed to remove bookmark");

            }

            return;

        }

        try {

            const res = await api.post(
                "/learner/bookmarks",
                null,
                {
                    params: {
                        learner_id: learnerId,
                        video_id: videoId,
                        bookmark_type: type,
                        title: title || "",
                        content: content || "",
                        timestamp: timestamp
                    }
                }
            );

            const newId = res.data.bookmark.id;

            setBookmarks(prev => ({
                ...prev,
                [key]: newId
            }));

            alert("Bookmark Saved");

        } catch (err) {

            console.error("Failed to save bookmark:", err);
            alert("Failed to save bookmark");

        }

    };

    useEffect(() => {

        loadLecture();

        if (canUseLearnerFeatures) {
            loadBookmarks();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoId, role]);

    useEffect(() => {

        const resumeTime =
            location.state?.resumeTime;

        if (
            resumeTime &&
            videoRef.current
        ) {

            const video =
                videoRef.current;

            const handleLoadedMetadataResume =
                () => {
                    video.currentTime =
                        resumeTime;
                };

            video.addEventListener(
                "loadedmetadata",
                handleLoadedMetadataResume
            );

            return () => {
                video.removeEventListener(
                    "loadedmetadata",
                    handleLoadedMetadataResume
                );
            };

        }

    }, [lecture]);

    async function loadLecture() {

        try {

            setLoading(true);

            setError("");

            // Creators fetch from their own lecture endpoint;
            // everyone else (educator/learner) uses the educator one.
            const endpoint =
                isCreator
                    ? `/creator/lecture/${videoId}`
                    : `/educator/lecture/${videoId}`;

            const res = await api.get(
                endpoint
            );

            const data = res.data;

            const parseField = (value) => {

                try {

                    return typeof value === "string"
                        ? JSON.parse(value || "[]")
                        : value || [];

                } catch {

                    return [];

                }

            };

            data.topics = parseField(data.topics);
            data.quiz = parseField(data.quiz);
            data.flashcards = parseField(data.flashcards);
            data.key_moments = parseField(data.key_moments);
            data.segments = parseField(data.segments);

            setLecture(data);
            setViewRecorded(false);

        }

        catch (err) {

            console.error(
                "Failed to load lecture:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load lecture."
            );

        }

        finally {

            setLoading(false);

        }

    }

    if (loading || !lecture) {

        return (
            <DashboardLayout role={role}>
                <div className="lecture-viewer-loading">
                    Loading lecture...
                </div>
            </DashboardLayout>
        );

    }

    if (error) {

        return (
            <DashboardLayout role={role}>
                <div className="lecture-viewer-error">
                    <h2>Unable to Load Lecture</h2>
                    <p>{error}</p>
                </div>
            </DashboardLayout>
        );

    }

    return (

        <DashboardLayout role={role}>

            <div className="viewer-layout">

                <div className="viewer-video">

                    <VideoPlayer

                        ref={videoRef}

                        src={`http://localhost:8000/uploads/videos/${lecture.filename}`}

                        onLoadedMetadata={handleLoadedMetadata}

                        onTimeUpdate={handleVideoTimeUpdate}

                    />

                </div>

                <div className="viewer-content">

                    <div className="viewer-header">

                        <div>

                            <h1>
                                {lecture.title}
                            </h1>

                            <p>
                                {lecture.description}
                            </p>

                        </div>

                        {role === "educator" && (

                            <button

                                className="download-btn"

                                onClick={downloadLectureReport}

                            >

                                📄 Download Lecture Report

                            </button>

                        )}

                    </div>

                    <div className="viewer-tabs">

                        {[
                            "Transcript",
                            "Summary",
                            "Topics",
                            "Quiz",
                            "Flashcards",
                            "Key Moments",
                            
                        ].map((item) => (

                            <button

                                key={item}

                                className={
                                    tab === item
                                        ? "active-tab"
                                        : ""
                                }

                                onClick={() =>
                                    setTab(item)
                                }

                            >

                                {item}

                            </button>

                        ))}

                    </div>

                    {role === "creator" && (

                        <div className="creator-download-actions">

                            <button
                                onClick={() =>
                                    downloadFile("transcript")
                                }
                            >
                                📄 Download Transcript
                            </button>

                            <button
                                onClick={() =>
                                    downloadFile("summary")
                                }
                            >
                                📝 Download Summary
                            </button>

                        </div>

                    )}

                    <div className="viewer-panel">

                        {tab === "Transcript" &&
                            <TranscriptPanel
                                segments={lecture.segments}
                                onSeek={seekVideo}
                                showBookmark={canUseLearnerFeatures}
                                bookmarkedKeys={bookmarks}
                                onBookmark={(segment) => {
                                    const key = `transcript-${segment.start}`;
                                    toggleBookmark(key, {
                                        type: "transcript",
                                        title: `Transcript at ${segment.start}s`,
                                        content: segment.text,
                                        timestamp: segment.start
                                    });
                                }}
                            />
                        }

                        {tab === "Summary" &&
                            <SummaryPanel
                                summary={lecture.summary}
                                showBookmark={canUseLearnerFeatures}
                                isBookmarked={Boolean(bookmarks["summary"])}
                                onBookmark={() =>
                                    toggleBookmark("summary", {
                                        type: "summary",
                                        title: lecture.title,
                                        content: lecture.summary
                                    })}
                            />
                        }

                        {tab === "Topics" &&
                            <TopicsPanel
                                topics={lecture.topics}
                            />
                        }

                        {tab === "Quiz" &&
                            <QuizPanel
                                quiz={lecture.quiz}
                            />
                        }

                        {tab === "Flashcards" &&
                            <FlashcardsPanel
                                flashcards={lecture.flashcards}
                            />
                        }

                        {tab === "Key Moments" &&
                            <KeyMomentsPanel
                                moments={lecture.key_moments}
                                onSeek={seekVideo}
                                showBookmark={canUseLearnerFeatures}
                                bookmarkedKeys={bookmarks}
                                onBookmark={(moment) => {
                                    const [minutes, seconds] = moment.time.split(":").map(Number);
                                    const totalSeconds = minutes * 60 + seconds;
                                    const key = `key_moment-${totalSeconds}`;
                                    toggleBookmark(key, {
                                        type: "key_moment",
                                        title: moment.title,
                                        content: moment.title,
                                        timestamp: totalSeconds
                                    });
                                }}
                            />
                        }

                        {tab === "Learning" &&
                            <LearningMaterial
                                material={lecture.learning_material}
                            />
                        }

                    </div>

                </div>

            </div>

        </DashboardLayout>

    );

}