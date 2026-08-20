import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


function Videos() {

    const navigate = useNavigate();

    const [videos, setVideos] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);


    useEffect(() => {

        loadVideos();

    }, []);


    const loadVideos = async () => {

        try {

            const res = await api.get(
                "/learner/videos"
            );

            setVideos(res.data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };


    const filteredVideos =
        videos.filter((video) =>

            video.title
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                )

        );


    if (loading) {

        return (

            <DashboardLayout role="learner">

                <h2>
                    Loading Videos...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="learner">

            <div className="learner-videos-page">

                <div className="learner-page-header">

                    <div>

                        <h1>
                            All Lectures
                        </h1>

                        <p>
                            Explore lectures from all
                            educators on ClipMind AI.
                        </p>

                    </div>

                </div>


                <div className="learner-video-search">

                    <input
                        type="text"
                        placeholder="Search lectures..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>


                {filteredVideos.length === 0 ? (

                    <div className="learner-empty-state">

                        <h2>
                            No Lectures Found
                        </h2>

                        <p>
                            Try another search.
                        </p>

                    </div>

                ) : (

                    <div className="learner-video-grid">

                        {filteredVideos.map(
                            (video) => (

                            <div
                                className="learner-video-card"
                                key={video.id}
                            >

                                <div className="learner-video-thumbnail">

                                    🎥

                                </div>

                                <div className="learner-video-info">

                                    <h3>
                                        {video.title}
                                    </h3>

                                    <p>
                                        {video.description ||
                                            "No description available."}
                                    </p>

                                    <div className="learner-video-meta">

                                        <span>
                                            👁{" "}
                                            {video.views || 0}
                                        </span>

                                        <span>
                                            {video.duration ||
                                                "--"}
                                        </span>

                                    </div>

                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/learner/lecture/${video.id}`
                                            )
                                        }
                                    >
                                        ▶ Watch Lecture
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

export default Videos;