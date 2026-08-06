import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";

import api from "../../api/axios";

function MyCourses() {

    const [courses, setCourses] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {

        fetchCourses();

    }, []);

    const fetchCourses = async () => {

        try {

            const res = await api.get(
                "/educator/courses",
                {
                    params: {
                        educator_id: localStorage.getItem("user_id")
                    }
                }
            );

            setCourses(res.data);

        } catch (err) {

            console.error(err);

            alert("Unable to load courses.");

        }

    };

    const deleteCourse = async (id) => {

        if (!window.confirm("Delete Course?")) {

            return;

        }

        try {

            await api.delete(`/educator/course/${id}`);

            fetchCourses();

        } catch (err) {

            console.error(err);

            alert("Unable to delete course.");

        }

    };

    return (

        <DashboardLayout role="educator">

            <h1>
                My Courses
            </h1>

            {

                courses.length === 0 ? (

                    <p>
                        No courses created yet.
                    </p>

                ) : (

                    courses.map((course) => (

                        <div
                            className="video-card"
                            key={course.id}
                        >

                            {

                                course.thumbnail && (

                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        width="250"
                                    />

                                )

                            }

                            <h2>
                                {course.title}
                            </h2>

                            <p>
                                {course.description}
                            </p>

                            <p>
                                <strong>
                                    Lectures :
                                </strong>{" "}
                                {course.lecture_count}
                            </p>

                            <p>
                                {course.category}
                            </p>

                            <p>
                                {course.difficulty}
                            </p>

                            <p>
                                Status:
                                {
                                    course.is_published
                                        ? " Published"
                                        : " Draft"
                                }
                            </p>

                            <div className="course-stats">

                                <p>
                                    Completed: {course.completed}
                                </p>

                                <p>
                                    Processing: {course.processing}
                                </p>

                                <p>
                                    Failed: {course.failed}
                                </p>

                            </div>

                            <div className="course-actions">

                                <button
                                    className="course-btn primary"
                                    onClick={() =>
                                        navigate(`/educator/course/${course.id}`)
                                    }
                                >
                                    View Lectures
                                </button>

                                <button
                                    className="course-btn warning"
                                    onClick={() =>
                                        navigate(`/educator/edit-course/${course.id}`)
                                    }
                                >
                                    Edit
                                </button>

                                <button
                                    className="course-btn danger"
                                    onClick={() => deleteCourse(course.id)}
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    ))

                )

            }

        </DashboardLayout>

    );

}

export default MyCourses;