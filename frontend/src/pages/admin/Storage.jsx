import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


function Storage() {

    const [stats, setStats] = useState(null);


    useEffect(() => {

        loadStorage();

    }, []);


    const loadStorage = async () => {

        try {

            const res = await api.get(
                "/admin/storage"
            );

            setStats(res.data);

        } catch (err) {

            console.error(
                "Failed to load storage statistics:",
                err
            );

        }

    };


    const formatBytes = (bytes) => {

        if (!bytes || bytes <= 0)
            return "0 B";

        const units = [
            "B",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        const index = Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

        return (
            (bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(2)
            + " "
            + units[index]
        );

    };


    if (!stats) {

        return (

            <DashboardLayout role="admin">

                <h2>
                    Loading Storage...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="admin">

            <div className="admin-storage-page">

                <div className="admin-header">

                    <div>

                        <h1>
                            Storage & Resources
                        </h1>

                        <p>
                            Monitor uploaded content and
                            platform resource utilization.
                        </p>

                    </div>

                </div>


                {/* =================================
                    STORAGE OVERVIEW
                ================================= */}

                <h2 className="admin-section-title">
                    Storage Overview
                </h2>


                <div className="storage-stats-grid">

                    <div className="storage-stat-card">

                        <div className="storage-stat-icon">
                            💾
                        </div>

                        <div>

                            <span>
                                Total Storage
                            </span>

                            <strong>
                                {formatBytes(
                                    stats.total_storage
                                )}
                            </strong>

                        </div>

                    </div>


                    <div className="storage-stat-card">

                        <div className="storage-stat-icon">
                            🎥
                        </div>

                        <div>

                            <span>
                                Total Videos
                            </span>

                            <strong>
                                {stats.total_videos}
                            </strong>

                        </div>

                    </div>


                    <div className="storage-stat-card">

                        <div className="storage-stat-icon">
                            📦
                        </div>

                        <div>

                            <span>
                                Average File Size
                            </span>

                            <strong>
                                {formatBytes(
                                    stats.average_file_size
                                )}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* =================================
                    LARGEST FILE
                ================================= */}

                <h2 className="admin-section-title">
                    Largest Upload
                </h2>


                <div className="largest-video-card">

                    <div className="largest-video-icon">
                        📁
                    </div>

                    <div>

                        <span>
                            Largest video file
                        </span>

                        <h2>
                            {
                                stats.largest_video
                                    ?.title ||
                                "No videos available"
                            }
                        </h2>

                        {stats.largest_video && (

                            <strong>
                                {formatBytes(
                                    stats
                                        .largest_video
                                        .file_size
                                )}
                            </strong>

                        )}

                    </div>

                </div>


                {/* =================================
                    PROCESSING RESOURCES
                ================================= */}

                <h2 className="admin-section-title">
                    Processing Resources
                </h2>


                <div className="storage-processing-grid">

                    <div>

                        <span>
                            Currently Processing
                        </span>

                        <strong>
                            {
                                stats.processing
                                    .processing
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Completed
                        </span>

                        <strong>
                            {
                                stats.processing
                                    .completed
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Failed
                        </span>

                        <strong>
                            {
                                stats.processing
                                    .failed
                            }
                        </strong>

                    </div>

                </div>


                {/* =================================
                    CATEGORY STORAGE
                ================================= */}

                <h2 className="admin-section-title">
                    Storage by Category
                </h2>


                <div className="storage-category-list">

                    {stats.categories.length === 0 ? (

                        <p>
                            No category data available.
                        </p>

                    ) : (

                        stats.categories.map(
                            (item) => (

                            <div
                                className="storage-category-row"
                                key={item.category}
                            >

                                <span>
                                    {item.category}
                                </span>

                                <strong>
                                    {formatBytes(
                                        item.storage
                                    )}
                                </strong>

                            </div>

                        )
                    )
                    )}

                </div>

            </div>

        </DashboardLayout>

    );

}


export default Storage;