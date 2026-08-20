import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


function Dashboard() {

    const navigate = useNavigate();

    const [stats, setStats] = useState(null);

    const [videos, setVideos] = useState([]);

    useEffect(() => {

        loadDashboard();

        loadVideos();

    }, []);


    const loadDashboard = async () => {

        try {

            const res = await api.get(
                "/learner/dashboard"
            );

            setStats(res.data);

        } catch (err) {

            console.error(err);

        }

    };


    const loadVideos = async () => {

        try {

            const res = await api.get(
                "/learner/videos"
            );

            setVideos(res.data);

        } catch (err) {

            console.error(err);

        }

    };


    return (

        <DashboardLayout role="learner">

            <div className="learner-dashboard">

                <div className="learner-dashboard-header">

                    <div>

                        <h1>
                            Welcome Back 👋
                        </h1>

                        <p>
                            Continue learning and
                            explore new lectures.
                        </p>

                    </div>

                    <button
                        onClick={() =>
                            navigate(
                                "/learner/courses"
                            )
                        }
                    >
                        Explore Courses
                    </button>

                </div>


                {/* ============================
                    STATISTICS
                ============================ */}

                {stats && (

                    <div className="learner-stats-grid">

                        <div className="learner-stat-card">

                            <span>
                                🎥
                            </span>

                            <div>

                                <strong>
                                    {stats.total_videos}
                                </strong>

                                <p>
                                    Available Videos
                                </p>

                            </div>

                        </div>


                        <div className="learner-stat-card">

                            <span>
                                🎓
                            </span>

                            <div>

                                <strong>
                                    {stats.total_courses}
                                </strong>

                                <p>
                                    Courses
                                </p>

                            </div>

                        </div>

                    </div>

                )}


                {/* ============================
                    RECENT LECTURES
                ============================ */}

                <div className="learner-section-header">

                    <div>

                        <h2>
                            Available Lectures
                        </h2>

                        <p>
                            Learn from lectures uploaded
                            by educators across ClipMind AI.
                        </p>

                    </div>

                    <button
                        onClick={() =>
                            navigate(
                                "/learner/videos"
                            )
                        }
                    >
                        View All
                    </button>

                </div>


                <div className="learner-video-grid">

                    {videos
                        .slice(0, 6)
                        .map((video) => (

                            <div
                                className="learner-video-card"
                                key={video.id}
                            >

                                <div className="learner-video-thumbnail">

                                    {video.thumbnail ? (

                                        <img
                                            src={
                                                `http://localhost:8000/uploads/${video.thumbnail}`
                                            }
                                            alt=""
                                        />

                                    ) : (

                                        <div>
                                            🎥
                                        </div>

                                    )}

                                </div>


                                <div className="learner-video-info">

                                    <h3>
                                        {video.title}
                                    </h3>

                                    <p>
                                        {video.description ||
                                            "No description available."}
                                    </p>

                                    <div className="learner-video-meta">

                                        <span>
                                            👁 {video.views || 0}
                                        </span>

                                        <span>
                                            {video.duration || "--"}
                                        </span>

                                    </div>


                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/learner/lecture/${video.id}`
                                            )
                                        }
                                    >
                                        ▶ Watch Lecture
                                    </button>

                                </div>

                            </div>

                        ))}

                </div>

            </div>

        </DashboardLayout>

    );

}

export default Dashboard;