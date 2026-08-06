import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import api from "../../api/axios";

function StudentEngagement() {

    const [data, setData] = useState(null);

    useEffect(() => {

        fetchData();

    }, []);

    const fetchData = async () => {

        try {

            const res = await api.get(

                "/educator/student-engagement",

                {

                    params: {

                        educator_id: localStorage.getItem("user_id")

                    }

                }

            );

            setData(res.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    if (!data) {

        return (

            <DashboardLayout role="educator">

                <h2>Loading...</h2>

            </DashboardLayout>

        );

    }

    return (

        <DashboardLayout role="educator">

            <h1>

                Student Engagement

            </h1>

            <div className="stats-grid">

                <StatCard

                    title="Courses"

                    value={data.total_courses}

                    color="#2563eb"

                />

                <StatCard

                    title="Lectures"

                    value={data.total_lectures}

                    color="#16a34a"

                />

                <StatCard

                    title="Shared"

                    value={data.shared_lectures}

                    color="#9333ea"

                />

            </div>

            <div className="video-card">

                <h2>

                    Popular Courses

                </h2>

                {

                    data.popular_courses.length === 0 ?

                    <p>No Courses</p>

                    :

                    data.popular_courses.map(course => (

                        <div
                            key={course.id}
                            style={{
                                marginBottom:20
                            }}
                        >

                            <strong>

                                {course.title}

                            </strong>

                            <p>

                                Lectures : {course.lectures}

                            </p>

                        </div>

                    ))

                }

            </div>

            <div className="video-card">

                <h2>

                    Recently Shared Lectures

                </h2>

                {

                    data.recent_shared.length === 0 ?

                    <p>

                        No Shared Lectures

                    </p>

                    :

                    data.recent_shared.map(

                        (lecture,index)=>(

                            <div
                                key={index}
                                style={{
                                    marginBottom:15
                                }}
                            >

                                <strong>

                                    {lecture.lecture}

                                </strong>

                                <p>

                                    Status : {lecture.status}

                                </p>

                            </div>

                        )

                    )

                }

            </div>

        </DashboardLayout>

    );

}

export default StudentEngagement;