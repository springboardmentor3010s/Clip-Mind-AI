import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";

import api from "../../api/axios";


function EducatorDashboard() {

    const [analytics, setAnalytics] = useState(null);
    const [engagement, setEngagement] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        fetchDashboard();

    }, []);


    const fetchDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            const educatorId =
                localStorage.getItem("user_id");


            if (!educatorId) {

                throw new Error(
                    "Educator ID not found."
                );

            }


            const [
                analyticsRes,
                engagementRes
            ] = await Promise.all([

                api.get(
                    "/educator/analytics",
                    {
                        params: {
                            educator_id:
                                educatorId
                        }
                    }
                ),

                api.get(
                    "/educator/student-engagement",
                    {
                        params: {
                            educator_id:
                                educatorId
                        }
                    }
                )

            ]);


            setAnalytics(
                analyticsRes.data || {}
            );

            setEngagement(
                engagementRes.data || {}
            );


        } catch (err) {

            console.error(
                "Educator Dashboard Error:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                err?.message ||
                "Unable to load dashboard."
            );


        } finally {

            setLoading(false);

        }

    };


    /*
     * =========================================
     * LOADING
     * =========================================
     */

    if (loading) {

        return (

            <DashboardLayout role="educator">

                <div className="dashboard-loading">

                    <h2>
                        Loading Educator Dashboard...
                    </h2>

                    <p>
                        Fetching your platform
                        analytics.
                    </p>

                </div>

            </DashboardLayout>

        );

    }


    /*
     * =========================================
     * ERROR
     * =========================================
     */

    if (error) {

        return (

            <DashboardLayout role="educator">

                <div className="dashboard-error">

                    <h2>
                        Unable to Load Dashboard
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={fetchDashboard}
                        className="btn btn-primary"
                    >
                        Retry
                    </button>

                </div>

            </DashboardLayout>

        );

    }


    /*
     * =========================================
     * SAFE VALUES
     * =========================================
     */

    const totalCourses =
        analytics?.total_courses ?? 0;


    const totalLectures =
        analytics?.total_lectures ?? 0;


    const completed =
        analytics?.completed ?? 0;


    const processing =
        analytics?.processing ?? 0;


    const failed =
        analytics?.failed ?? 0;


    const totalStudents =
        engagement?.total_students ?? 0;


    const totalClassrooms =
        engagement?.total_classrooms ?? 0;


    const totalViews =
        engagement?.total_views ?? 0;


    const completedLectures =
        engagement?.completed_lectures ?? 0;


    const popularLectures =
        Array.isArray(
            engagement?.popular_lectures
        )
            ? engagement.popular_lectures
            : [];


    const classrooms =
        Array.isArray(
            engagement?.classrooms
        )
            ? engagement.classrooms
            : [];


    /*
     * =========================================
     * DASHBOARD
     * =========================================
     */

    return (

        <DashboardLayout role="educator">

            <div className="dashboard-header">

                <h1>
                    Welcome, Educator 👋
                </h1>

                <p>
                    Manage your content and monitor
                    learner engagement.
                </p>

            </div>


            {/* =====================================
                PLATFORM OVERVIEW
            ===================================== */}

            <div className="stats-grid">

                <StatCard
                    title="Courses"
                    value={totalCourses}
                    color="#2563eb"
                />


                <StatCard
                    title="Lectures"
                    value={totalLectures}
                    color="#16a34a"
                />


                <StatCard
                    title="Students"
                    value={totalStudents}
                    color="#7c3aed"
                />


                <StatCard
                    title="Classrooms"
                    value={totalClassrooms}
                    color="#0891b2"
                />


                <StatCard
                    title="Lecture Views"
                    value={totalViews}
                    color="#ea580c"
                />


                <StatCard
                    title="Completed"
                    value={completedLectures}
                    color="#059669"
                />


                <StatCard
                    title="Processing"
                    value={processing}
                    color="#ca8a04"
                />


                <StatCard
                    title="Failed"
                    value={failed}
                    color="#dc2626"
                />

            </div>


            {/* =====================================
                MOST VIEWED LECTURES
            ===================================== */}

            <div className="summary-card">

                <div className="summary-card-header">

                    <div>

                        <h2>
                            Most Viewed Lectures
                        </h2>

                        <p>
                            Your most watched educational
                            content.
                        </p>

                    </div>

                </div>


                {
                    popularLectures.length === 0 ? (

                        <p>
                            No lecture views yet.
                        </p>

                    ) : (

                        <div className="popular-course-list">

                            {
                                popularLectures.map(
                                    (lecture, index) => (

                                        <div
                                            key={
                                                lecture.id ??
                                                index
                                            }
                                            className="popular-course-row"
                                        >

                                            <div className="popular-course-rank">

                                                {index + 1}

                                            </div>


                                            <div className="popular-course-main">

                                                <div className="popular-course-top">

                                                    <strong>
                                                        {
                                                            lecture.title ||
                                                            "Untitled Lecture"
                                                        }
                                                    </strong>


                                                    <span className="popular-course-count">

                                                        👁{" "}

                                                        {
                                                            lecture.views ??
                                                            0
                                                        }

                                                        {" "}

                                                        {
                                                            lecture.views === 1
                                                                ? "view"
                                                                : "views"
                                                        }

                                                    </span>

                                                </div>


                                                <div className="popular-course-bar-track">

                                                    <div
                                                        className="popular-course-bar-fill"
                                                        style={{
                                                            width:
                                                                `${
                                                                    Math.min(
                                                                        (
                                                                            (lecture.views || 0) /
                                                                            Math.max(
                                                                                1,
                                                                                popularLectures[0]?.views || 1
                                                                            )
                                                                        ) * 100,
                                                                        100
                                                                    )
                                                                }%`
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )
                            }

                        </div>

                    )
                }

            </div>


            {/* =====================================
                CLASSROOM OVERVIEW
            ===================================== */}

            <div className="summary-card">

                <div className="summary-card-header">

                    <div>

                        <h2>
                            My Classrooms
                        </h2>

                        <p>
                            Learning spaces created
                            for your learners.
                        </p>

                    </div>

                    <strong>
                        {totalClassrooms}
                    </strong>

                </div>


                {
                    classrooms.length === 0 ? (

                        <p>
                            No classrooms created yet.
                        </p>

                    ) : (

                        <div className="classroom-engagement-list">

                            {
                                classrooms
                                    .slice(0, 5)
                                    .map(
                                        (classroom) => (

                                            <div
                                                key={
                                                    classroom.id
                                                }
                                                className="classroom-engagement-row"
                                            >

                                                <div>

                                                    <strong>
                                                        {
                                                            classroom.name
                                                        }
                                                    </strong>

                                                    <p>
                                                        {
                                                            classroom.description ||
                                                            "No description"
                                                        }
                                                    </p>

                                                </div>


                                                <div className="classroom-code">

                                                    <span>
                                                        JOIN CODE
                                                    </span>

                                                    <strong>
                                                        {
                                                            classroom.join_code
                                                        }
                                                    </strong>

                                                </div>

                                            </div>

                                        )
                                    )
                            }

                        </div>

                    )
                }

            </div>


            {/* =====================================
                PROCESSING SUMMARY
            ===================================== */}

            <div className="summary-card">

                <h2>
                    Content Processing
                </h2>

                <p>
                    Current status of your uploaded
                    lecture processing.
                </p>


                <div className="processing-summary-grid">

                    <div className="processing-item">

                        <span>
                            Total Lectures
                        </span>

                        <strong>
                            {totalLectures}
                        </strong>

                    </div>


                    <div className="processing-item completed">

                        <span>
                            Completed
                        </span>

                        <strong>
                            {completed}
                        </strong>

                    </div>


                    <div className="processing-item processing">

                        <span>
                            Processing
                        </span>

                        <strong>
                            {processing}
                        </strong>

                    </div>


                    <div className="processing-item failed">

                        <span>
                            Failed
                        </span>

                        <strong>
                            {failed}
                        </strong>

                    </div>

                </div>

            </div>

        </DashboardLayout>

    );

}


export default EducatorDashboard;