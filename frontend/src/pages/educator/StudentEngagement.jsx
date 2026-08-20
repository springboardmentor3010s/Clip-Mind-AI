import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";

import api from "../../api/axios";


function StudentEngagement() {

    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    useEffect(() => {

        fetchData();

    }, []);


    const fetchData = async () => {

        try {

            setLoading(true);

            setError("");

            const res = await api.get(

                "/educator/student-engagement",

                {

                    params: {

                        educator_id:
                            localStorage.getItem(
                                "user_id"
                            )

                    }

                }

            );

            setData(res.data);

        }

        catch (err) {

            console.error(
                "Student engagement error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load student engagement."
            );

        }

        finally {

            setLoading(false);

        }

    };


    if (loading) {

        return (

            <DashboardLayout role="educator">

                <div className="analytics-loading">

                    Loading student engagement...

                </div>

            </DashboardLayout>

        );

    }


    if (error) {

        return (

            <DashboardLayout role="educator">

                <div className="analytics-error">

                    <h2>
                        Unable to load engagement
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={fetchData}
                    >
                        Retry
                    </button>

                </div>

            </DashboardLayout>

        );

    }


    if (!data) {
        return null;
    }


    return (

        <DashboardLayout role="educator">

            <div className="student-engagement-page">

                <div className="analytics-page-header">

                    <div>

                        <h1>
                            Student Engagement
                        </h1>

                        <p>
                            Monitor learner activity,
                            classrooms and content
                            performance.
                        </p>

                    </div>

                </div>


                {/* =================================
                    ENGAGEMENT STATS
                ================================= */}

                <div className="stats-grid">

                    <StatCard
                        title="Students"
                        value={
                            data.total_students
                        }
                        color="#2563eb"
                    />

                    <StatCard
                        title="Classrooms"
                        value={
                            data.total_classrooms
                        }
                        color="#7c3aed"
                    />

                    <StatCard
                        title="Lecture Views"
                        value={
                            data.total_views
                        }
                        color="#0891b2"
                    />

                    <StatCard
                        title="Completed Lectures"
                        value={
                            data.completed_lectures
                        }
                        color="#16a34a"
                    />

                </div>


                {/* =================================
                    CLASSROOMS
                ================================= */}

                <div className="engagement-card">

                    <div className="engagement-card-header">

                        <div>

                            <h2>
                                My Classrooms
                            </h2>

                            <span className="engagement-card-subtitle">
                                Classrooms created by you
                            </span>

                        </div>

                        <strong>
                            {data.total_classrooms}
                        </strong>

                    </div>


                    {data.classrooms.length === 0 ? (

                        <p className="engagement-empty">

                            No classrooms created yet.

                        </p>

                    ) : (

                        <div className="classroom-engagement-list">

                            {data.classrooms.map(
                                (classroom) => (

                                <div
                                    className="classroom-engagement-row"
                                    key={classroom.id}
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

                                        Join Code

                                        <strong>
                                            {
                                                classroom.join_code
                                            }
                                        </strong>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </div>


                {/* =================================
                    POPULAR LECTURES
                ================================= */}

                <div className="engagement-card">

                    <div className="engagement-card-header">

                        <div>

                            <h2>
                                Most Viewed Lectures
                            </h2>

                            <span className="engagement-card-subtitle">
                                Ranked by learner views
                            </span>

                        </div>

                    </div>


                    {data.popular_lectures.length === 0 ? (

                        <p className="engagement-empty">

                            No lectures available.

                        </p>

                    ) : (

                        <div className="popular-course-list">

                            {data.popular_lectures.map(
                                (lecture, index) => (

                                <div
                                    className="popular-course-row"
                                    key={lecture.id}
                                >

                                    <div className="popular-course-rank">
                                        {index + 1}
                                    </div>


                                    <div className="popular-course-main">

                                        <div className="popular-course-top">

                                            <strong>
                                                {
                                                    lecture.title
                                                }
                                            </strong>

                                            <span className="popular-course-count">

                                                👁{" "}

                                                {
                                                    lecture.views
                                                }

                                                {" "}
                                                {lecture.views === 1
                                                    ? "view"
                                                    : "views"}

                                            </span>

                                        </div>


                                        <div className="popular-course-bar-track">

                                            <div
                                                className="popular-course-bar-fill"
                                                style={{
                                                    width:
                                                        `${Math.min(
                                                            lecture.views /
                                                            Math.max(
                                                                1,
                                                                data.popular_lectures[0]?.views || 1
                                                            ) *
                                                            100,
                                                            100
                                                        )}%`
                                                }}
                                            />

                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </div>


            </div>

        </DashboardLayout>

    );

}


export default StudentEngagement;