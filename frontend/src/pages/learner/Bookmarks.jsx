import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


function Bookmarks() {

    const navigate = useNavigate();

    const [bookmarks, setBookmarks] = useState([]);

    const [loading, setLoading] = useState(true);


    useEffect(() => {

        loadBookmarks();

    }, []);


    const loadBookmarks = async () => {

        try {

            const learnerId =
                localStorage.getItem("user_id");

            const res = await api.get(
                "/learner/bookmarks",
                {
                    params: {
                        learner_id: learnerId
                    }
                }
            );

            setBookmarks(res.data);

        }

        catch (err) {

            console.error(
                "Failed to load bookmarks:",
                err
            );

        }

        finally {

            setLoading(false);

        }

    };


    const deleteBookmark = async (id) => {

        try {

            const learnerId =
                localStorage.getItem("user_id");

            await api.delete(
                `/learner/bookmarks/${id}`,
                {
                    params: {
                        learner_id: learnerId
                    }
                }
            );

            setBookmarks(
                bookmarks.filter(
                    (item) => item.id !== id
                )
            );

        }

        catch (err) {

            console.error(
                "Failed to delete bookmark:",
                err
            );

        }

    };


    const openBookmark = (bookmark) => {

        navigate(
            `/learner/lecture/${bookmark.video_id}`,
            {
                state: {
                    resumeTime:
                        bookmark.timestamp || 0
                }
            }
        );

    };


    const formatTime = (seconds) => {

        if (
            seconds === null ||
            seconds === undefined
        ) {
            return "";
        }

        const minutes =
            Math.floor(seconds / 60);

        const remaining =
            Math.floor(seconds % 60);

        return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;

    };


    if (loading) {

        return (

            <DashboardLayout role="learner">

                <h2>
                    Loading Bookmarks...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="learner">

            <div className="learner-bookmarks-page">

                <div className="learner-page-header">

                    <div>

                        <h1>
                            My Bookmarks
                        </h1>

                        <p>
                            Save important moments and
                            learning content for later.
                        </p>

                    </div>

                </div>


                {bookmarks.length === 0 ? (

                    <div className="learner-empty-state">

                        <div>
                            🔖
                        </div>

                        <h2>
                            No Bookmarks Yet
                        </h2>

                        <p>
                            Bookmark important summaries,
                            transcript moments and key
                            moments while learning.
                        </p>

                    </div>

                ) : (

                    <div className="bookmark-list">

                        {bookmarks.map(
                            (bookmark) => (

                            <div
                                className="bookmark-card"
                                key={bookmark.id}
                            >

                                <div className="bookmark-icon">

                                    {bookmark.bookmark_type ===
                                    "summary"
                                        ? "📄"
                                        : bookmark.bookmark_type ===
                                          "transcript"
                                            ? "📝"
                                            : "⭐"}

                                </div>


                                <div className="bookmark-content">

                                    <div className="bookmark-top">

                                        <div>

                                            <span className="bookmark-type">

                                                {bookmark.bookmark_type
                                                    .replace(
                                                        "_",
                                                        " "
                                                    )}

                                            </span>

                                            <h2>
                                                {bookmark.video_title}
                                            </h2>

                                        </div>

                                        {bookmark.timestamp !==
                                            null &&
                                            bookmark.timestamp !==
                                                undefined && (

                                            <span className="bookmark-time">

                                                {formatTime(
                                                    bookmark.timestamp
                                                )}

                                            </span>

                                        )}

                                    </div>


                                    <h3>
                                        {bookmark.title}
                                    </h3>


                                    {bookmark.content && (

                                        <p>
                                            {bookmark.content}
                                        </p>

                                    )}


                                    <div className="bookmark-actions">

                                        <button
                                            onClick={() =>
                                                openBookmark(
                                                    bookmark
                                                )
                                            }
                                        >
                                            {bookmark.timestamp !==
                                            null &&
                                            bookmark.timestamp !==
                                                undefined
                                                ? "Jump to Moment"
                                                : "Open Lecture"}
                                        </button>


                                        <button
                                            className="delete-bookmark"
                                            onClick={() =>
                                                deleteBookmark(
                                                    bookmark.id
                                                )
                                            }
                                        >
                                            Remove
                                        </button>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </DashboardLayout>

    );

}


export default Bookmarks;