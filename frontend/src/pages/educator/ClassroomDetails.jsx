import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function ClassroomDetails() {

    const { classroomId } = useParams();

    const [classroom, setClassroom] = useState(null);

    const [showPost, setShowPost] = useState(false);

    const [title, setTitle] = useState("");

    const [content, setContent] = useState("");

    const [postType, setPostType] =
        useState("announcement");

    const [lectures, setLectures] = useState([]);

    const [selectedVideo, setSelectedVideo] =
        useState("");

    const [materialFile, setMaterialFile] =
        useState(null);

    useEffect(() => {

        fetchClassroom();

        fetchLectures();

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

    const fetchLectures = async () => {

        try {

            const res = await api.get(
                "/educator/lectures",
                {
                    params: {
                        educator_id:
                            localStorage.getItem("user_id")
                    }
                }
            );

            setLectures(res.data);

        } catch (err) {

            console.error(err);

        }

    };

    const createPost = async (e) => {

        e.preventDefault();

        if (!title.trim()) {

            alert("Enter a title.");

            return;

        }

        try {

            // =====================================
            // LEARNING MATERIAL
            // =====================================

            if (postType === "material") {

                if (!materialFile) {

                    alert(
                        "Please select a learning material."
                    );

                    return;

                }

                const formData =
                    new FormData();

                formData.append(
                    "title",
                    title
                );

                formData.append(
                    "content",
                    content
                );

                formData.append(
                    "educator_id",
                    localStorage.getItem(
                        "user_id"
                    )
                );

                formData.append(
                    "file",
                    materialFile
                );

                await api.post(

                    `/classroom/${classroomId}/materials`,

                    formData

                );

            }

            // =====================================
            // LECTURE
            // =====================================

            else if (postType === "lecture") {

                if (!selectedVideo) {

                    alert(
                        "Please select a lecture."
                    );

                    return;

                }

                await api.post(

                    `/classroom/${classroomId}/posts`,

                    {

                        title,

                        content,

                        post_type:
                            "lecture",

                        video_id:
                            Number(selectedVideo)

                    }

                );

            }

            // =====================================
            // ANNOUNCEMENT
            // =====================================

            else {

                await api.post(

                    `/classroom/${classroomId}/posts`,

                    {

                        title,

                        content,

                        post_type:
                            "announcement"

                    }

                );

            }

            // =====================================
            // RESET
            // =====================================

            setTitle("");

            setContent("");

            setPostType(
                "announcement"
            );

            setSelectedVideo("");

            setMaterialFile(null);

            setShowPost(false);

            fetchClassroom();

        }

        catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Unable to create post."
            );

        }

    };

    if (!classroom) {

        return (

            <DashboardLayout role="educator">

                <h2>Loading Classroom...</h2>

            </DashboardLayout>

        );

    }

    return (

        <DashboardLayout role="educator">

            <div className="classroom-details">

                <div className="classroom-details-header">

                    <div>

                        <h1>
                            {classroom.name}
                        </h1>

                        <p>
                            {classroom.description}
                        </p>

                    </div>

                    <div className="classroom-join-code">

                        <span>
                            Join Code
                        </span>

                        <strong>
                            {classroom.join_code}
                        </strong>

                    </div>

                </div>

                <div className="classroom-overview">

                    <div>
                        👥
                        <strong>
                            {classroom.student_count}
                        </strong>
                        Students
                    </div>

                    <button
                        className="classroom-create-btn"
                        onClick={() =>
                            setShowPost(!showPost)
                        }
                    >
                        + Create Post
                    </button>

                </div>

                {showPost && (

                    <form
                        className="classroom-post-form"
                        onSubmit={createPost}
                    >

                        <h2>
                            Create Classroom Post
                        </h2>

                        <select
                            value={postType}
                            onChange={(e) =>
                                setPostType(e.target.value)
                            }
                        >

                            <option value="announcement">
                                Announcement
                            </option>

                            <option value="material">
                                Learning Material
                            </option>

                            <option value="lecture">
                                Lecture
                            </option>

                        </select>

                        {postType === "lecture" && (

                            <select
                                value={selectedVideo}
                                onChange={(e) =>
                                    setSelectedVideo(e.target.value)
                                }
                            >

                                <option value="">
                                    Select Lecture
                                </option>

                                {lectures.map((lecture) => (

                                    <option
                                        key={lecture.id}
                                        value={lecture.id}
                                    >
                                        {lecture.title}
                                    </option>

                                ))}

                            </select>

                        )}

                        {postType === "material" && (

                            <div className="material-upload-box">

                                <label>
                                    Select Learning Material
                                </label>

                                <input
                                    type="file"
                                    accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.xlsx,.xls"
                                    onChange={(e) =>
                                        setMaterialFile(
                                            e.target.files[0]
                                        )
                                    }
                                />

                                {materialFile && (

                                    <p className="selected-file">

                                        📎 {materialFile.name}

                                    </p>

                                )}

                            </div>

                        )}

                        <input
                            placeholder="Post title"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                        />

                        <textarea
                            placeholder="Write something for your learners..."
                            value={content}
                            onChange={(e) =>
                                setContent(e.target.value)
                            }
                        />

                        <div className="classroom-form-actions">

                            <button type="submit">
                                Publish Post
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPost(false)
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                )}

                <div className="classroom-posts">

                    <h2>
                        Classroom Feed
                    </h2>

                    {classroom.posts.length === 0 ? (

                        <div className="empty-classrooms">

                            <p>
                                No posts yet.
                            </p>

                        </div>

                    ) : (

                        classroom.posts.map((post) => (

                            <div
                                className="classroom-post"
                                key={post.id}
                            >

                                <div className="post-type">

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

                                <p>
                                    {post.content}
                                </p>

                                {post.post_type === "lecture" && (

                                    <div className="classroom-lecture">

                                        🎥

                                        <strong>
                                            {post.video_title}
                                        </strong>

                                        <button
                                            onClick={() =>
                                                window.location.href =
                                                    `/educator/lecture/${post.video_id}`
                                            }
                                        >
                                            Watch Lecture
                                        </button>

                                    </div>

                                )}

                                {post.post_type === "material" && (

                                    <div className="classroom-material">

                                        <div className="material-icon">
                                            📚
                                        </div>

                                        <div className="material-info">

                                            <strong>
                                                {post.title}
                                            </strong>

                                            <p>
                                                {post.content}
                                            </p>

                                            {post.file_path && (

                                                <a
                                                    href={
                                                        `http://localhost:8000${post.file_path}`
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="material-download-btn"
                                                >
                                                    📥 Download Material
                                                </a>

                                            )}

                                        </div>

                                    </div>

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