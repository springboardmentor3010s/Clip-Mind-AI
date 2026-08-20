import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function Courses() {

    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);


    useEffect(() => {

        loadCourses();

    }, []);


    const loadCourses = async () => {

        try {

            const res = await api.get(
                "/learner/courses"
            );

            setCourses(res.data);

        } catch (err) {

            console.error(
                "Failed to load courses:",
                err
            );

        } finally {

            setLoading(false);

        }

    };


    const filteredCourses = courses.filter(
        (course) =>
            course.title
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                ) ||
            course.description
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                )
    );


    if (loading) {

        return (

            <DashboardLayout role="learner">

                <div className="learner-loading">

                    Loading Courses...

                </div>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="learner">

            <div className="learner-courses-page">

                {/* HEADER */}

                <div className="learner-page-header">

                    <div>

                        <h1>
                            All Courses
                        </h1>

                        <p>
                            Explore all courses available
                            on ClipMind AI.
                        </p>

                    </div>

                </div>


                {/* SEARCH */}

                <div className="learner-course-search">

                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>


                {/* COURSES */}

                {filteredCourses.length === 0 ? (

                    <div className="learner-empty-state">

                        <div>
                            🎓
                        </div>

                        <h2>
                            No Courses Found
                        </h2>

                        <p>
                            There are no courses
                            matching your search.
                        </p>

                    </div>

                ) : (

                    <div className="learner-course-grid">

                        {filteredCourses.map(
                            (course) => (

                            <div
                                className="learner-course-card"
                                key={course.id}
                            >

                                <div className="learner-course-icon">

                                    🎓

                                </div>


                                <div className="learner-course-content">

                                    <h2>
                                        {course.title}
                                    </h2>

                                    <p>
                                        {course.description ||
                                            "No description available."}
                                    </p>


                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/learner/course/${course.id}`
                                            )
                                        }
                                    >
                                        View Course
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </DashboardLayout>

    );

}

export default Courses;