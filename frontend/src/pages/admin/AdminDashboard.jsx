import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";

import api from "../../api/axios";


function AdminDashboard() {

    const [stats, setStats] = useState(null);


    useEffect(() => {

        loadDashboard();

    }, []);


    const loadDashboard = async () => {

        try {

            const res = await api.get(
                "/admin/dashboard"
            );

            setStats(res.data);

        }

        catch (err) {

            console.error(
                "Failed to load admin dashboard:",
                err
            );

        }

    };


    if (!stats) {

        return (

            <DashboardLayout role="admin">

                <h2>
                    Loading Admin Dashboard...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="admin">

            <div className="admin-dashboard">

                <div className="admin-header">

                    <div>

                        <h1>
                            Admin Dashboard
                        </h1>

                        <p>
                            Monitor and manage the
                            ClipMind AI platform.
                        </p>

                    </div>

                </div>


                {/* USERS */}

                <h2 className="admin-section-title">
                    Users
                </h2>

                <div className="stats-grid">

                    <StatCard
                        title="Creators"
                        value={
                            stats.users.creators
                        }
                    />

                    <StatCard
                        title="Educators"
                        value={
                            stats.users.educators
                        }
                    />

                    <StatCard
                        title="Learners"
                        value={
                            stats.users.learners
                        }
                    />

                    <StatCard
                        title="Admins"
                        value={
                            stats.users.admins
                        }
                    />

                </div>


                {/* CONTENT */}

                <h2 className="admin-section-title">
                    Platform Content
                </h2>

                <div className="stats-grid">

                    <StatCard
                        title="Videos"
                        value={
                            stats.content.videos
                        }
                    />

                    <StatCard
                        title="Courses"
                        value={
                            stats.content.courses
                        }
                    />

                    <StatCard
                        title="Completed"
                        value={
                            stats.content.completed
                        }
                    />

                    <StatCard
                        title="Total Views"
                        value={
                            stats.content.views
                        }
                    />

                </div>


                {/* PROCESSING */}

                <h2 className="admin-section-title">
                    AI Processing
                </h2>

                <div className="stats-grid">

                    <StatCard
                        title="Processing"
                        value={
                            stats.content.processing
                        }
                    />

                    <StatCard
                        title="Failed"
                        value={
                            stats.content.failed
                        }
                    />

                </div>

            </div>

        </DashboardLayout>

    );

}


export default AdminDashboard;