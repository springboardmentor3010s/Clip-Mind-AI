import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


function LearningHistory() {

    const navigate = useNavigate();

    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);


    useEffect(() => {

        loadHistory();

    }, []);


    const loadHistory = async () => {

        try {

            const learnerId =
                localStorage.getItem("user_id");

            const res = await api.get(
                "/learner/history",
                {
                    params: {
                        learner_id: learnerId
                    }
                }
            );

            setHistory(res.data);

        } catch (err) {

            console.error(
                "Failed to load learning history:",
                err
            );

        } finally {

            setLoading(false);

        }

    };


    const formatLastWatched = (date) => {

    if (!date)
        return "";

    const formatted = new Date(date).toLocaleString(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );

    return `${formatted} IST`;
};

    if (loading) {

        return (

            <DashboardLayout role="learner">

                <h2>
                    Loading Learning History...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="learner">

            <div className="learning-history-page">

                <div className="learner-page-header">

                    <div>

                        <h1>
                            Learning History
                        </h1>

                        <p>
                            Continue where you left off
                            and track your learning progress.
                        </p>

                    </div>

                </div>


                {history.length === 0 ? (

                    <div className="learner-empty-state">

                        <div>
                            📚
                        </div>

                        <h2>
                            No Learning History
                        </h2>

                        <p>
                            Start watching a lecture and
                            your progress will appear here.
                        </p>

                        <button
                            onClick={() =>
                                navigate(
                                    "/learner/videos"
                                )
                            }
                        >
                            Explore Lectures
                        </button>

                    </div>

                ) : (

                    <div className="learning-history-list">

                        {history.map((item) => (

                            <div
                                className="learning-history-card"
                                key={item.id}
                            >

                                <div className="history-icon">

                                    {item.completed
                                        ? "✓"
                                        : "▶"}

                                </div>


                                <div className="history-content">

                                    <div className="history-header">

                                        <h2>
                                            {item.title}
                                        </h2>

                                        {item.completed && (

                                            <span className="completed-badge">
                                                Completed
                                            </span>

                                        )}

                                    </div>


                                    <p>
                                        {item.description ||
                                            "No description available."}
                                    </p>


                                    <div className="history-progress-row">

                                        <div className="history-progress">

                                            <div
                                                className="history-progress-fill"
                                                style={{
                                                    width:
                                                        `${item.progress}%`
                                                }}
                                            />

                                        </div>

                                        <span>
                                            {Math.round(
                                                item.progress
                                            )}%
                                        </span>

                                    </div>


                                    <div className="history-meta">

                                        <span>
                                            Last watched:{" "}
                                            {formatLastWatched(
                                                item.last_watched
                                            )}
                                        </span>

                                    </div>


                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/learner/lecture/${item.video_id}`,
                                                {
                                                    state: {
                                                        resumeTime:
                                                            item.current_time
                                                    }
                                                }
                                            )
                                        }
                                    >
                                        {item.completed
                                            ? "Watch Again"
                                            : "Continue Learning"}
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


export default LearningHistory;