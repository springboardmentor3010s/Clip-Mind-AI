import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import MyVideos from "../../components/MyVideos";
import ProcessingStatus from "../../components/ProcessingStatus";

import api from "../../api/axios";

function CreatorDashboard() {

    const [stats, setStats] = useState(null);

    const [analytics, setAnalytics] = useState(null);

    const userId = localStorage.getItem("user_id");

    useEffect(() => {

        fetchStats();
        loadAnalytics();

    }, []);

    const fetchStats = async () => {

        try {

            const res = await api.get(
                `/creator/dashboard/${userId}`
            );

            setStats(res.data);

        }

        catch(err){

            console.log(err);

        }

    };

    const loadAnalytics = async () => {

        try {

            const res = await api.get(
                "/creator/analytics",
                {
                    params: {
                        user_id:
                            localStorage.getItem(
                                "user_id"
                            )
                    }
                }
            );

            setAnalytics(res.data);

        }

        catch (err) {

            console.error(
                "Analytics error:",
                err
            );

        }

    };

    if(!stats){

        return(

            <DashboardLayout role="creator">

                <h2>Loading Dashboard...</h2>

            </DashboardLayout>

        );

    }

    return(

        <DashboardLayout role="creator">

            <h1>

                Welcome, Content Creator 👋

            </h1>

            <p>

                Manage your uploaded videos and AI-generated results.

            </p>

            <div className="stats-grid">

                <StatCard

                    title="Videos"

                    value={stats.videos}

                    color="#2563eb"

                />

                <StatCard

                    title="Summaries"

                    value={stats.summaries}

                    color="#16a34a"

                />

                <StatCard

                    title="Transcripts"

                    value={stats.transcripts}

                    color="#9333ea"

                />

                <StatCard

                    title="Storage"

                    value={stats.storage}

                    color="#f97316"

                />

            </div>

            {analytics && (

                <div className="creator-analytics">

                    <div className="creator-analytics-card">

                        <span>Failed</span>

                        <strong>
                            {analytics.failed}
                        </strong>

                    </div>

                    {analytics.most_viewed && (

                        <div className="most-viewed-card">

                            <div>

                                <span>
                                    Most Viewed Content
                                </span>

                                <h3>
                                    {
                                        analytics
                                            .most_viewed
                                            .title
                                    }
                                </h3>

                            </div>

                            <strong>
                                👁{" "}
                                {
                                    analytics
                                        .most_viewed
                                        .views
                                }{" "}
                                views
                            </strong>

                        </div>

                    )}

                    <div className="content-performance">

                        <h2>
                            Content Performance
                        </h2>

                        {analytics.videos.map(
                            (video) => (

                                <div
                                    className="performance-row"
                                    key={video.id}
                                >

                                    <div>

                                        <strong>
                                            {video.title}
                                        </strong>

                                        <span>
                                            {video.status}
                                        </span>

                                    </div>

                                    <div className="performance-views">
                                        👁 {video.views || 0}
                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </div>

            )}

            <MyVideos />

            <ProcessingStatus />

        </DashboardLayout>

    );

}

export default CreatorDashboard;