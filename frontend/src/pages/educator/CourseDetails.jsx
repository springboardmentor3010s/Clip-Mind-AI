import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";

import api from "../../api/axios";

function CourseDetails() {

    const { id } = useParams();

    const [course, setCourse] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [stats, setStats] = useState(null);

    const navigate = useNavigate();

    const downloadLectureReport = async (videoId) => {

        try {

            const response = await api.get(
                `/educator/lecture-report/${videoId}`,
                {
                    responseType: "blob"
                }
            );

            const url = window.URL.createObjectURL(
                new Blob([response.data])
            );

            const link = document.createElement("a");

            link.href = url;

            link.download = `lecture_${videoId}_report.pdf`;

            document.body.appendChild(link);

            link.click();

            link.remove();

        }
        catch (err) {

            console.log(err);

            alert("Unable to download report.");

        }

    };

    useEffect(() => {

        const loadAll = async () => {
            await Promise.all([
                fetchCourse(),
                fetchStats(),
                fetchLectures(),
            ]);
        };

        loadAll();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchCourse = async () => {

        try {

            const res = await api.get(`/educator/course/${id}`);

            setCourse(res.data);

        } catch (err) {

            console.error(err);

            alert("Unable to load course.");

        }

    };

    const fetchStats = async () => {

        try {

            const res = await api.get(`/educator/course/${id}/stats`);

            setStats(res.data);

        } catch (err) {

            console.error(err);

            alert("Unable to load course statistics.");

        }

    };

    const fetchLectures = async () => {

        try {

            const res = await api.get(`/educator/course/${id}/lectures`);

            setLectures(res.data);

        } catch (err) {

            console.error(err);

            alert("Unable to load lectures.");

        }

    };

    const shareLecture = async (videoId) => {

        try {

            await api.post(
                `/educator/share/${videoId}?educator_id=${localStorage.getItem("user_id")}`
            );

            alert("Lecture shared successfully.");

            fetchStats();

        } catch (err) {

            console.error(err);

            alert("Unable to share lecture");

        }

    };

    const publishCourse = async () => {

        try {

            await api.post(`/educator/course/${id}/publish`);

            fetchCourse();

        } catch (err) {

            console.error(err);

            alert("Unable to publish course.");

        }

    };

    const unpublishCourse = async () => {

        try {

            await api.post(`/educator/course/${id}/unpublish`);

            fetchCourse();

        } catch (err) {

            console.error(err);

            alert("Unable to unpublish course.");

        }

    };

    const downloadCourseReport = () => {

        window.open(
            `http://localhost:8000/educator/course-report/${id}`,
            "_blank"
        );

    };

    if (!course) {

        return (

            <DashboardLayout role="educator">

                Loading...

            </DashboardLayout>

        );

    }

    return (

        <DashboardLayout role="educator">

            <div className="course-header">

                <div className="course-header-card">

                    <div>

                        <h1>{course.title}</h1>

                        <p className="course-description">
                            {course.description}
                        </p>

                    </div>

                    <button
                        className="download-btn"
                        onClick={downloadCourseReport}
                    >
                        📄 Download Course Report
                    </button>

                </div>

                <div className="course-info-grid">

                    <div className="info-box">
                        <h4>Category</h4>
                        <p>{course.category}</p>
                    </div>

                    <div className="info-box">
                        <h4>Difficulty</h4>
                        <p>{course.difficulty}</p>
                    </div>

                    <div className="info-box">
                        <h4>Total Lectures</h4>
                        <p>{course.lecture_count}</p>
                    </div>

                </div>

            </div>

            {

                stats && (

                    <div className="stats-grid">

                        <div className="info-box">
                            <h4>Lectures</h4>
                            <p>{stats.total}</p>
                        </div>

                        <div className="info-box">
                            <h4>Completed</h4>
                            <p>{stats.processed}</p>
                        </div>

                        <div className="info-box">
                            <h4>Failed</h4>
                            <p>{stats.failed}</p>
                        </div>

                        <div className="info-box">
                            <h4>Shared</h4>
                            <p>{stats.shared}</p>
                        </div>

                    </div>

                )

            }

            <hr />

            <h2>
                Course Lectures
            </h2>

            {

                lectures.length === 0 ? (

                    <p>
                        No lectures uploaded yet.
                    </p>

                ) : (

                    <div className="lecture-grid">
                        {
                            lectures.map((lecture) => (
                                <div
                                    className="lecture-card"
                                    key={lecture.id}
                                >
                                    <h3>{lecture.title}</h3>
                                    <p>{lecture.description}</p>
                                    <p>
                                        Status :
                                        <strong>
                                            {lecture.status}
                                        </strong>
                                    </p>
                                    <div className="lecture-actions">
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/educator/lecture/${lecture.id}`,
                                                    {
                                                        state: {
                                                            tab: "Transcript"
                                                        }
                                                    }
                                                )
                                            }
                                        >
                                            Transcript
                                        </button>
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/educator/lecture/${lecture.id}`,
                                                    {
                                                        state: {
                                                            tab: "Summary"
                                                        }
                                                    }
                                                )
                                            }
                                        >
                                            Summary
                                        </button>
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/educator/lecture/${lecture.id}`,
                                                    {
                                                        state: {
                                                            tab: "Topics"
                                                        }
                                                    }
                                                )
                                            }
                                        >
                                            Topics
                                        </button>
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/educator/lecture/${lecture.id}`,
                                                    {
                                                        state: {
                                                            tab: "Quiz"
                                                        }
                                                    }
                                                )
                                            }
                                        >
                                            Quiz
                                        </button>
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/educator/lecture/${lecture.id}`,
                                                    {
                                                        state: {
                                                            tab: "Flashcards"
                                                        }
                                                    }
                                                )
                                            }
                                        >
                                            Flashcards
                                        </button>
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/educator/lecture/${lecture.id}`,
                                                    {
                                                        state: {
                                                            tab: "Key Moments"
                                                        }
                                                    }
                                                )
                                            }
                                        >
                                            Key Moments
                                        </button>
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/educator/lecture/${lecture.id}`,
                                                    {
                                                        state: {
                                                            tab: "Learning"
                                                        }
                                                    }
                                                )
                                            }
                                        >
                                            Learning
                                        </button>
                                        <button
                                            className="download-btn"
                                            onClick={() => downloadLectureReport(lecture.id)}
                                        >
                                            📄 Lecture Report
                                        </button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                )

            }

        </DashboardLayout>

    );

}

export default CourseDetails;