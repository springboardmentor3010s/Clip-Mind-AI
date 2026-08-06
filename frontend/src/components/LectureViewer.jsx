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


export default function LectureViewer() {

    const [duration, setDuration] = useState(0);

    const [viewRecorded, setViewRecorded] = useState(false);

    const { videoId } = useParams();

    const location = useLocation();

    const [lecture, setLecture] = useState(null);

    const [tab, setTab] = useState(
        location.state?.tab || "Transcript"
    );

    const videoRef = useRef(null);

    const seekVideo = (seconds) => {

        if (videoRef.current) {

            videoRef.current.currentTime = seconds;

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

        !videoRef.current ||

        viewRecorded

    ){

        return;

    }

    const current =

        videoRef.current.currentTime;

    const threshold =

        duration < 40

        ? duration / 2

        : 20;

    if(current >= threshold){

        setViewRecorded(true);

        recordView();

    }

};

    const downloadLectureReport = () => {

    window.open(

        `http://localhost:8000/educator/lecture-report/${videoId}`,

        "_blank"

    );

};

    useEffect(() => {

        loadLecture();

    }, [videoId]);

    async function loadLecture() {

        const res = await api.get(
            `/educator/lecture/${videoId}`
        );

        const data = res.data;

        try {

            data.topics = JSON.parse(
                data.topics || "[]"
            );

        } catch {

            data.topics = [];

        }

        try {

            data.quiz = JSON.parse(
                data.quiz || "[]"
            );

        } catch {

            data.quiz = [];

        }

        try {

            data.flashcards = JSON.parse(
                data.flashcards || "[]"
            );

        } catch {

            data.flashcards = [];

        }

        try {

            data.key_moments = JSON.parse(
                data.key_moments || "[]"
            );

        } catch {

            data.key_moments = [];

        }

        setLecture(data);
        setViewRecorded(false);

    }

    if (!lecture)
        return (
            <DashboardLayout role="educator">
                Loading...
            </DashboardLayout>
        );

    return (

        <DashboardLayout role="educator">

            <div className="viewer-layout">

                <div className="viewer-video">

                    <VideoPlayer

ref={videoRef}

src={`http://localhost:8000/uploads/videos/${lecture.filename}`}

onLoadedMetadata={handleLoadedMetadata}

onTimeUpdate={handleTimeUpdate}

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

    <button

        className="download-btn"

        onClick={downloadLectureReport}

    >

        📄 Download Lecture Report

    </button>

</div>

                    <div className="viewer-tabs">

                        {[
                            "Transcript",
                            "Summary",
                            "Topics",
                            "Quiz",
                            "Flashcards",
                            "Key Moments",
                            "Learning"
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

                    <div className="viewer-panel">

                        {tab === "Transcript" &&
                            <TranscriptPanel
                                segments={lecture.segments}
                                onSeek={seekVideo}
                            />
                        }

                        {tab === "Summary" &&
                            <SummaryPanel
                                summary={lecture.summary}
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