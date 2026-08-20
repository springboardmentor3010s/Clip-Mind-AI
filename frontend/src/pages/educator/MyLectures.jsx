import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function MyLectures() {

    const navigate = useNavigate();

    const [lectures, setLectures] = useState([]);
    const [search, setSearch] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {

        fetchLectures();

    }, []);

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

            console.log(err);

        }

    };

    const downloadReport = async (videoId) => {

        try {

            const response = await api.get(
                `/educator/lecture/${videoId}/report`,
                {
                    responseType: "blob"
                }
            );

            const url = window.URL.createObjectURL(
                new Blob([response.data])
            );

            const link = document.createElement("a");

            link.href = url;

            link.download = `lecture-${videoId}-report.pdf`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (err) {

            console.log(err);

            alert("Failed to download report");

        }

    };

    const deleteLecture = async (videoId) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this lecture? This cannot be undone."
        );

        if (!confirmed) return;

        try {

            setDeletingId(videoId);

            await api.delete(`/educator/lecture/${videoId}`);

            setLectures((prev) =>
                prev.filter((lecture) => lecture.id !== videoId)
            );

        } catch (err) {

            console.log(err);

            alert("Failed to delete lecture");

        } finally {

            setDeletingId(null);

        }

    };

    const filteredLectures = lectures.filter((lecture) =>
        lecture.title
            ?.toLowerCase()
            .includes(search.toLowerCase())
    );

    return (

        <DashboardLayout role="educator">

            <div className="my-lectures-page">

                <h1>My Lectures</h1>

                <input
                    type="text"
                    className="lecture-search"
                    placeholder="Search lectures..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                {filteredLectures.length === 0 && (
                    <p className="lecture-empty">No lectures found.</p>
                )}

                {filteredLectures.map((lecture) => (

                    <div key={lecture.id} className="lecture-card">

                        <h3>{lecture.title}</h3>

                        <p>Course: {lecture.course_title || "Not assigned"}</p>

                        <p>Status: {lecture.status}</p>

                        <p>Views: {lecture.views}</p>

                        <div className="lecture-actions">

                            <button
                                onClick={() =>
                                    navigate(`/educator/lecture/${lecture.id}`)
                                }
                            >
                                Open
                            </button>

                            <button
                                onClick={() =>
                                    navigate(`/educator/transcript/${lecture.id}`)
                                }
                            >
                                Transcript
                            </button>

                            <button
                                onClick={() =>
                                    navigate(`/educator/summary/${lecture.id}`)
                                }
                            >
                                Summary
                            </button>

                            <button
                                className="download-btn"
                                onClick={() => downloadReport(lecture.id)}
                            >
                                Download Report
                            </button>

                            <button
                                className="delete-btn"
                                onClick={() => deleteLecture(lecture.id)}
                                disabled={deletingId === lecture.id}
                            >
                                {deletingId === lecture.id
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>

                        </div>

                    </div>

                ))}

            </div>

        </DashboardLayout>

    );

}

export default MyLectures;