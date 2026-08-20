import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function ClassroomDetails() {

    const { classroomId } = useParams();

    const navigate = useNavigate();

    const [classroom, setClassroom] =
        useState(null);

    useEffect(() => {

        fetchClassroom();

    }, [classroomId]);

    const fetchClassroom = async () => {

        try {

            const res = await api.get(
                `/classroom/${classroomId}`
            );

            setClassroom(res.data);

        } catch (err) {

            console.error(err);

            alert("Unable to load classroom.");

        }

    };

    if (!classroom) {

        return (

            <DashboardLayout role="learner">

                <h2>
                    Loading Classroom...
                </h2>

            </DashboardLayout>

        );

    }

    return (

        <DashboardLayout role="learner">

            <div className="learner-classroom-details">

                <div className="learner-classroom-header">

                    <div>

                        <h1>
                            {classroom.name}
                        </h1>

                        <p>
                            {classroom.description}
                        </p>

                    </div>

                </div>

                <div className="learner-classroom-feed">

                    <h2>
                        Classroom Feed
                    </h2>

                    {classroom.posts.length === 0 ? (

                        <div className="learner-empty-state">

                            <p>
                                Your educator hasn't
                                posted anything yet.
                            </p>

                        </div>

                    ) : (

                        classroom.posts.map((post) => (

                            <div
                                className="learner-post"
                                key={post.id}
                            >

                                <div className="learner-post-type">

                                    {post.post_type ===
                                    "announcement"
                                        ? "📢 Announcement"
                                        : post.post_type ===
                                          "lecture"
                                        ? "🎥 Lecture"
                                        : "📚 Learning Material"}

                                </div>

                                <h3>
                                    {post.title}
                                </h3>

                                {post.content && (

                                    <p>
                                        {post.content}
                                    </p>

                                )}

                                {post.post_type ===
                                    "lecture" &&
                                    post.video_id && (

                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/learner/lecture/${post.video_id}`
                                            )
                                        }
                                    >
                                        ▶ Watch Lecture
                                    </button>

                                )}

                                {post.post_type ===
                                    "material" &&
                                    post.file_path && (

                                    <a
                                        href={
                                            `http://localhost:8000${post.file_path}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        📥 Download Material
                                    </a>

                                )}

                                <small>

                                    {post.created_at
                                        ? new Date(
                                            post.created_at
                                        ).toLocaleString()
                                        : ""}

                                </small>

                            </div>

                        ))

                    )}

                </div>

            </div>

        </DashboardLayout>

    );

}

export default ClassroomDetails;