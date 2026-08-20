import DashboardLayout from "../../components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../api/axios";

function UploadContent({ role = "creator" }) {

    const navigate = useNavigate();

    const [video, setVideo] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Educational");

    const [loading, setLoading] = useState(false);

    const [courses, setCourses] = useState([]);
    const [courseId, setCourseId] = useState("");

    const educatorId = localStorage.getItem("user_id");

    useEffect(() => {

        if (role === "educator") {
            fetchCourses();
        }

    }, []);

    const fetchCourses = async () => {

        try {

            const res = await api.get("/educator/courses", {
                params: {
                    educator_id: educatorId
                }
            });

            setCourses(res.data);

        } catch (err) {

            console.log(err);

        }

    };

    const handleUpload = async () => {

        if (!video) {
            alert("Please select a video.");
            return;
        }

        if (!title.trim()) {
            alert("Please enter a title.");
            return;
        }

        const formData = new FormData();

        formData.append("title", title);
        formData.append("description", description);
        formData.append("category", category);
        formData.append("user_id", educatorId);
        formData.append("video", video);

        // Course is optional for educators now — only send it
        // if one was actually selected.
        if (role === "educator" && courseId) {
            formData.append("course_id", courseId);
        }

        try {

            setLoading(true);

            const res = await api.post(
                "/creator/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            localStorage.setItem(
                "processing_video_id",
                res.data.video_id
            );

            alert("Upload Successful!");

            navigate(
    role === "educator"
        ? "/educator/my-courses"
        : "/creator/processing"
);

        } catch (err) {

            console.log(err);

            alert(
                err.response?.data?.detail ||
                "Upload Failed"
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <DashboardLayout role={role}>

            <div className="upload-container">

                <h1>

                    {
                        role === "educator"
                            ? "Upload Lecture"
                            : "Upload Video"
                    }

                </h1>

                <p>

                    {
                        role === "educator"
                            ? "Upload a lecture to one of your courses."
                            : "Upload a video for AI processing."
                    }

                </p>

                <div className="upload-box">

                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideo(e.target.files[0])}
                    />

                    {
                        video &&
                        <div className="selected-video">

                            <h3>Selected File</h3>

                            <p>{video.name}</p>

                        </div>
                    }

                </div>

                <input
                    className="upload-input"
                    placeholder="Video Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                    className="upload-textarea"
                    placeholder="Video Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <select
                    className="upload-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >

                    <option>Educational</option>

                    <option>Business Meeting</option>

                    <option>Podcast</option>

                    <option>Interview</option>

                </select>

                {

                    role === "educator" &&

                    <select
                        className="upload-input"
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                    >

                        <option value="">

                            No Course (Optional)

                        </option>

                        {

                            courses.map(course => (

                                <option
                                    key={course.id}
                                    value={course.id}
                                >

                                    {course.title}

                                </option>

                            ))

                        }

                    </select>

                }

                <button
                    className="upload-btn"
                    onClick={handleUpload}
                    disabled={loading}
                >

                    {

                        loading
                            ? "Uploading..."
                            : role === "educator"
                                ? "Upload Lecture"
                                : "Upload Video"

                    }

                </button>

            </div>

        </DashboardLayout>

    );

}

export default UploadContent;