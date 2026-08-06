import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";

import api from "../../api/axios";

function EducatorDashboard() {

    const [analytics, setAnalytics] = useState(null);
    const [engagement, setEngagement] = useState(null);

    useEffect(() => {

        fetchDashboard();

    }, []);

    const fetchDashboard = async () => {

        try {

            const educatorId = localStorage.getItem("user_id");

            const [analyticsRes, engagementRes] = await Promise.all([

                api.get("/educator/analytics", {
                    params: {
                        educator_id: educatorId
                    }
                }),

                api.get("/educator/student-engagement", {
                    params: {
                        educator_id: educatorId
                    }
                })

            ]);

            setAnalytics(analyticsRes.data);

            setEngagement(engagementRes.data);

        } catch (err) {

            console.log(err);

            alert("Unable to load dashboard.");

        }

    };

    if (!analytics || !engagement) {

        return (

            <DashboardLayout role="educator">

                <h2>Loading...</h2>

            </DashboardLayout>

        );

    }

    return (

        <DashboardLayout role="educator">

            <h1>Welcome, Educator 👋</h1>

            <p>
                Manage your courses and monitor lecture performance.
            </p>

            <div className="stats-grid">

                <StatCard
                    title="Courses"
                    value={analytics.total_courses}
                    color="#2563eb"
                />

                <StatCard
                    title="Lectures"
                    value={analytics.total_lectures}
                    color="#16a34a"
                />

                <StatCard
                    title="Published"
                    value={analytics.published_courses}
                    color="#9333ea"
                />

                <StatCard
                    title="Draft"
                    value={analytics.draft_courses}
                    color="#f97316"
                />

                <StatCard
                    title="Completed"
                    value={analytics.completed}
                    color="#059669"
                />

                <StatCard
                    title="Processing"
                    value={analytics.processing}
                    color="#ca8a04"
                />

                <StatCard
                    title="Failed"
                    value={analytics.failed}
                    color="#dc2626"
                />

                <StatCard
                    title="Shared"
                    value={analytics.shared}
                    color="#7c3aed"
                />

            </div>

            <div className="summary-card">

                <h2>Popular Courses</h2>

                {

                    engagement.popular_courses.length === 0 ?

                    <p>No courses found.</p>

                    :

                    <ul>

                        {

                            engagement.popular_courses.map(course => (

                                <li key={course.id}>

                                    {course.title} ({course.lectures} lectures)

                                </li>

                            ))

                        }

                    </ul>

                }

            </div>

            <div className="summary-card">

                <h2>Recently Shared Lectures</h2>

                {

                    engagement.recent_shared.length === 0 ?

                    <p>No shared lectures.</p>

                    :

                    <ul>

                        {

                            engagement.recent_shared.map((lecture, index) => (

                                <li key={index}>

                                    {lecture.lecture} - {lecture.status}

                                </li>

                            ))

                        }

                    </ul>

                }

            </div>

        </DashboardLayout>

    );

}

export default EducatorDashboard;