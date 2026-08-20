import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


function Content() {

    const [videos, setVideos] = useState([]);

    const [loading, setLoading] = useState(true);

    const [deleting, setDeleting] = useState(null);


    useEffect(() => {

        loadVideos();

    }, []);


    const loadVideos = async () => {

        try {

            const res = await api.get(
                "/admin/videos"
            );

            setVideos(res.data);

        }

        catch (err) {

            console.error(
                "Failed to load videos:",
                err
            );

        }

        finally {

            setLoading(false);

        }

    };


    const deleteVideo = async (videoId, title) => {

        const confirmed = window.confirm(

            `Are you sure you want to delete "${title}"?\n\n` +
            "This will permanently remove the lecture " +
            "and its transcript."

        );

        if (!confirmed) {
            return;
        }


        try {

            setDeleting(videoId);


            await api.delete(
                `/admin/videos/${videoId}`
            );


            setVideos(
                videos.filter(
                    (video) =>
                        video.id !== videoId
                )
            );


            alert(
                "Lecture deleted successfully."
            );

        }

        catch (err) {

            console.error(
                "Failed to delete video:",
                err
            );

            alert(
                err.response?.data?.detail ||
                "Failed to delete lecture."
            );

        }

        finally {

            setDeleting(null);

        }

    };


    if (loading) {

        return (

            <DashboardLayout role="admin">

                <h2>
                    Loading Content...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="admin">

            <div className="admin-content-page">

                <div className="admin-header">

                    <div>

                        <h1>
                            Uploaded Content
                        </h1>

                        <p className="admin-subtitle">
                            Monitor and manage all
                            uploaded lectures.
                        </p>

                    </div>

                </div>


                <div className="admin-table-wrapper">

                    <table className="admin-table">

                        <thead>

                            <tr>

                                <th>
                                    Lecture
                                </th>

                                <th>
                                    Category
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Views
                                </th>

                                <th>
                                    Uploaded
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {videos.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "30px"
                                        }}
                                    >
                                        No uploaded content
                                        found.
                                    </td>

                                </tr>

                            ) : (

                                videos.map(
                                    (video) => (

                                    <tr
                                        key={video.id}
                                    >

                                        <td>
                                            {video.title}
                                        </td>

                                        <td>
                                            {
                                                video.category ||
                                                "-"
                                            }
                                        </td>

                                        <td>

                                            <span
                                                className={
                                                    `content-status ${
                                                        video.status
                                                            ?.toLowerCase()
                                                    }`
                                                }
                                            >
                                                {
                                                    video.status
                                                }
                                            </span>

                                        </td>

                                        <td>
                                            {
                                                video.views ||
                                                0
                                            }
                                        </td>

                                        <td>

                                            {
                                                video.uploaded_at
                                                    ? new Date(
                                                        video.uploaded_at
                                                    ).toLocaleDateString(
                                                        "en-IN"
                                                    )
                                                    : "-"
                                            }

                                        </td>

                                        <td>

                                            <button

                                                className="delete-content-button"

                                                disabled={
                                                    deleting ===
                                                    video.id
                                                }

                                                onClick={() =>
                                                    deleteVideo(
                                                        video.id,
                                                        video.title
                                                    )
                                                }

                                            >

                                                {deleting ===
                                                video.id
                                                    ? "Deleting..."
                                                    : "Delete"}

                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </DashboardLayout>

    );

}


export default Content;