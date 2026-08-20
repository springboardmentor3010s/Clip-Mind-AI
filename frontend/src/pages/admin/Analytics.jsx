import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";

import api from "../../api/axios";


function Analytics() {

    const [analytics, setAnalytics] =
        useState(null);


    useEffect(() => {

        loadAnalytics();

    }, []);


    const loadAnalytics = async () => {

        try {

            const res = await api.get(
                "/admin/analytics"
            );

            setAnalytics(res.data);

        }

        catch (err) {

            console.error(
                "Failed to load analytics:",
                err
            );

        }

    };


    if (!analytics) {

        return (

            <DashboardLayout role="admin">

                <h2>
                    Loading System Analytics...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="admin">

            <div className="admin-analytics">

                <div className="admin-header">

                    <div>

                        <h1>
                            System Analytics
                        </h1>

                        <p>
                            Platform-wide usage and
                            content intelligence.
                        </p>

                    </div>

                </div>


                {/* =================================
                    PLATFORM OVERVIEW
                ================================= */}

                <h2 className="admin-section-title">
                    Platform Overview
                </h2>

                <div className="stats-grid">

                    <StatCard
                        title="Educators"
                        value={
                            analytics.users.educators
                        }
                    />

                    <StatCard
                        title="Learners"
                        value={
                            analytics.users.learners
                        }
                    />

                    <StatCard
                        title="Creators"
                        value={
                            analytics.users.creators
                        }
                    />

                    <StatCard
                        title="Admins"
                        value={
                            analytics.users.admins
                        }
                    />

                    <StatCard
                        title="Total Users"
                        value={
                            analytics.users.total
                        }
                    />

                    <StatCard
                        title="Courses"
                        value={
                            analytics.content.courses
                        }
                    />

                    <StatCard
                        title="Videos"
                        value={
                            analytics.content.videos
                        }
                    />

                    <StatCard
                        title="Total Views"
                        value={
                            analytics.content.views
                        }
                    />

                </div>


                {/* =================================
                    CONTENT INSIGHTS
                ================================= */}

                <h2 className="admin-section-title">
                    Content Insights
                </h2>


                <div className="admin-insights-grid">

                    <div className="admin-insight-card">

                        <div className="admin-insight-icon">
                            🔥
                        </div>

                        <div>

                            <span>
                                Most Viewed Lecture
                            </span>

                            <h3>
                                {
                                    analytics
                                        .most_viewed
                                        ?.title ||
                                    "No data"
                                }
                            </h3>

                            <strong>
                                {
                                    analytics
                                        .most_viewed
                                        ?.views || 0
                                } views
                            </strong>

                        </div>

                    </div>


                    <div className="admin-insight-card">

                        <div className="admin-insight-icon">
                            📉
                        </div>

                        <div>

                            <span>
                                Least Viewed Lecture
                            </span>

                            <h3>
                                {
                                    analytics
                                        .least_viewed
                                        ?.title ||
                                    "No data"
                                }
                            </h3>

                            <strong>
                                {
                                    analytics
                                        .least_viewed
                                        ?.views || 0
                                } views
                            </strong>

                        </div>

                    </div>

                </div>


                {/* =================================
                    AI PROCESSING
                ================================= */}

                <h2 className="admin-section-title">
                    AI Processing
                </h2>

                <div className="stats-grid">

                    <StatCard
                        title="Completed"
                        value={
                            analytics
                                .processing
                                .completed
                        }
                    />

                    <StatCard
                        title="Processing"
                        value={
                            analytics
                                .processing
                                .processing
                        }
                    />

                    <StatCard
                        title="Failed"
                        value={
                            analytics
                                .processing
                                .failed
                        }
                    />

                    <StatCard
                        title="Success Rate"
                        value={
                            `${analytics.processing.success_rate}%`
                        }
                    />

                </div>

            </div>

        </DashboardLayout>

    );

}


export default Analytics;