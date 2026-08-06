import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import api from "../../api/axios";

function Analytics() {

    const [stats, setStats] = useState(null);

    const educatorId = localStorage.getItem("user_id");

    useEffect(() => {

        fetchAnalytics();

    }, []);

    const fetchAnalytics = async () => {

        try {

            const res = await api.get(

                "/educator/dashboard-analytics",

                {

                    params: {

                        educator_id: educatorId

                    }

                }

            );

            setStats(res.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    const downloadAnalyticsReport = () => {

        window.open(

            `http://localhost:8000/educator/analytics-report?educator_id=${educatorId}`,

            "_blank"

        );

    };

    if (!stats) {

        return (

            <DashboardLayout role="educator">

                <h2>Loading Analytics...</h2>

            </DashboardLayout>

        );

    }

    return (

        <DashboardLayout role="educator">

            <h1 className="page-title">

                Analytics Dashboard

            </h1>

            <div className="stats-grid">

                <StatCard
                    title="Videos"
                    value={stats.total_videos}
                    color="#2563eb"
                />

                <StatCard
                    title="Completed"
                    value={stats.completed}
                    color="#22c55e"
                />

                <StatCard
                    title="Processing"
                    value={stats.processing}
                    color="#3b82f6"
                />

                <StatCard
                    title="Failed"
                    value={stats.failed}
                    color="#ef4444"
                />

                <StatCard
                    title="Views"
                    value={stats.total_views}
                    color="#9333ea"
                />

                <StatCard
                    title="Transcript Words"
                    value={stats.transcript_words}
                    color="#f97316"
                />

                <StatCard
                    title="Summary Words"
                    value={stats.summary_words}
                    color="#0ea5e9"
                />

                <StatCard
                    title="Quiz Questions"
                    value={stats.quiz_questions}
                    color="#10b981"
                />

                <StatCard
                    title="Flashcards"
                    value={stats.flashcards}
                    color="#8b5cf6"
                />

                <StatCard
                    title="Key Moments"
                    value={stats.key_moments}
                    color="#eab308"
                />

                <StatCard
                    title="Success %"
                    value={`${stats.success_rate}%`}
                    color="#14b8a6"
                />

            </div>

            <div className="analytics-report-card">

                <h2>

                    Content Insights

                </h2>

                <p>

                    <strong>Total Duration:</strong>{" "}

                    {stats.total_duration_seconds} sec

                </p>

                <p>

                    <strong>Average Duration:</strong>{" "}

                    {stats.average_duration_seconds} sec

                </p>

                <p>

                    <strong>Average Views:</strong>{" "}

                    {stats.average_views}

                </p>

                <div className="analytics-buttons">

                    <button
                        className="download-btn"
                        onClick={downloadAnalyticsReport}
                    >

                        Download Analytics Report

                    </button>

                </div>

            </div>

        </DashboardLayout>

    );

}

export default Analytics;