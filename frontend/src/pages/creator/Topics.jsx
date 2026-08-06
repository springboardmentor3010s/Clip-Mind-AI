import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import DashboardNavbar from "../../components/DashboardNavbar";
import api from "../../api/axios";

function Topics() {

    const { videoId } = useParams();

    const navigate = useNavigate();

    const [topics, setTopics] = useState([]);

    useEffect(() => {

        fetchTopics();

    }, []);

    const fetchTopics = async () => {

        try {

            const res = await api.get(
                `/creator/topics/${videoId}`
            );

            setTopics(res.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="dashboard-content">

                <DashboardNavbar />

                <div className="summary-container">

                    <h1>Topics</h1>

                    {

                        topics.length === 0

                        ?

                        <p>No topics available.</p>

                        :

                        topics.map((topic, index) => (

                            <div
                                className="moment-card"
                                key={index}
                            >

                                <h3>

                                    {topic}

                                </h3>

                            </div>

                        ))

                    }

                    <div className="summary-buttons">

                        <button
                            onClick={() =>
                                navigate(`/creator/quiz/${videoId}`)
                            }
                        >

                            Next →  Quiz

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Topics;