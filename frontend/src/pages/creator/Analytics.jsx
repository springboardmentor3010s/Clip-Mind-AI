import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import DashboardNavbar from "../../components/DashboardNavbar";
import api from "../../api/axios";

function Analytics() {

    const { videoId } = useParams();

    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {

        try {

            const res = await api.get(
                `/creator/analytics/${videoId}`
            );

            setAnalytics(res.data);

        } catch (err) {

            console.log(err);

        }

    };

    if (!analytics) {

        return (
            <div className="dashboard">

                <Sidebar />

                <div className="dashboard-content">

                    <DashboardNavbar />

                    <div className="summary-container">

                        <h2>Loading Analytics...</h2>

                    </div>

                </div>

            </div>
        );

    }

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="dashboard-content">

                <DashboardNavbar />

                <div className="summary-container">

                    <h1>Analytics</h1>

                    <h3>Video ID : {videoId}</h3>

                    <div className="stats-grid">

                        <div className="stat-card">

                            <p>Duration</p>

                            <h2>{analytics.duration || "N/A"}</h2>

                        </div>

                        <div className="stat-card">

                            <p>Transcript Words</p>

                            <h2>{analytics.transcript_words}</h2>

                        </div>

                        <div className="stat-card">

                            <p>Summary Words</p>

                            <h2>{analytics.summary_words}</h2>

                        </div>

                        <div className="stat-card">

                            <p>Topics</p>

                            <h2>{analytics.topics}</h2>

                        </div>

                        <div className="stat-card">

                            <p>Key Moments</p>

                            <h2>{analytics.key_moments}</h2>

                        </div>

                        <div className="stat-card">

                            <p>Quiz Questions</p>

                            <h2>{analytics.quiz}</h2>

                        </div>

                        <div className="stat-card">

                            <p>Flashcards</p>

                            <h2>{analytics.flashcards}</h2>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Analytics;