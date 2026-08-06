import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import DashboardNavbar from "../../components/DashboardNavbar";
import api from "../../api/axios";

function Flashcards() {
    const { videoId } = useParams();
    const navigate = useNavigate();

    const [flashcards, setFlashcards] = useState([]);

    useEffect(() => {
        fetchFlashcards();
    }, []);

    const fetchFlashcards = async () => {
        try {
            const res = await api.get(
                `/creator/flashcards/${videoId}`
            );

            setFlashcards(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className="dashboard">
            <Sidebar />

            <div className="dashboard-content">
                <DashboardNavbar />

                <div className="summary-container">
                    <h1>Flashcards</h1>

                    {flashcards.length === 0 ? (
                        <p>No flashcards available.</p>
                    ) : (
                        <div className="flashcards-container">
                            {flashcards.map((card, index) => (
                                <div
                                    className="flashcard"
                                    key={index}
                                >
                                    <div className="flashcard-inner">
                                        <div className="flashcard-front">
                                            <h2>Front</h2>
                                            <p>{card.front}</p>
                                        </div>

                                        <div className="flashcard-back">
                                            <h2>Back</h2>
                                            <p>{card.back}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="summary-buttons">
                        <button
                            onClick={() =>
                                navigate(`/creator/analytics/${videoId}`)
                            }
                        >
                            Next → Analytics
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Flashcards;