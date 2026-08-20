import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


export default function UploadHistory() {

    const [history, setHistory] =
        useState([]);

    const [loading, setLoading] =
        useState(true);


    useEffect(() => {

        loadHistory();

    }, []);


    const loadHistory = async () => {

        try {

            const res = await api.get(
                "/creator/upload-history",
                {
                    params: {
                        user_id:
                            localStorage.getItem(
                                "user_id"
                            )
                    }
                }
            );

            setHistory(res.data);

        }

        catch (err) {

            console.error(
                "Upload history error:",
                err
            );

        }

        finally {

            setLoading(false);

        }

    };


    const formatDate = (date) => {

        if (!date)
            return "-";

        return new Date(
            date
        ).toLocaleString(
            "en-IN",
            {
                timeZone:
                    "Asia/Kolkata"
            }
        );

    };


    if (loading) {

        return (

            <DashboardLayout role="creator">

                <h2>
                    Loading Upload History...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="creator">

            <div className="upload-history-page">

                <h1>
                    Upload History
                </h1>

                <p className="page-subtitle">
                    View your previously uploaded
                    content and processing status.
                </p>


                <div className="upload-history-list">

                    {history.length === 0 ? (

                        <div className="empty-history">

                            <h2>
                                No uploads yet
                            </h2>

                            <p>
                                Your uploaded videos
                                will appear here.
                            </p>

                        </div>

                    ) : (

                        history.map(
                            (video) => (

                            <div
                                className="history-card"
                                key={video.id}
                            >

                                <div className="history-info">

                                    <h2>
                                        {video.title}
                                    </h2>

                                    <p>
                                        {
                                            video.description ||
                                            "No description"
                                        }
                                    </p>

                                    <span>
                                        Uploaded:{" "}
                                        {formatDate(
                                            video.uploaded_at
                                        )}
                                    </span>

                                </div>


                                <div className="history-meta">

                                    <span
                                        className={
                                            `history-status ${
                                                video.status
                                                    ?.toLowerCase()
                                            }`
                                        }
                                    >
                                        {video.status}
                                    </span>

                                    <span>
                                        👁{" "}
                                        {video.views || 0}
                                    </span>

                                </div>

                            </div>

                        )

                    ))}

                </div>

            </div>

        </DashboardLayout>

    );

}