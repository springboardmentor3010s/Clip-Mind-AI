import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import LearningMaterial from "../../components/LearningMaterial";

import api from "../../api/axios";


export default function Materials() {

    const educatorId = localStorage.getItem("user_id");

    const [lectures, setLectures] = useState([]);

    const [loadingLectures, setLoadingLectures] = useState(true);

    const [selectedVideoId, setSelectedVideoId] = useState("");

    const [material, setMaterial] = useState(null);

    const [generating, setGenerating] = useState(false);

    const [error, setError] = useState("");


    useEffect(() => {

        loadLectures();

    }, []);


    const loadLectures = async () => {

        try {

            setLoadingLectures(true);

            const res = await api.get(
                "/educator/lectures",
                {
                    params: {
                        educator_id: educatorId
                    }
                }
            );

            setLectures(res.data);

            // Default to the first lecture, if any, so
            // Generate works right away.
            if (res.data.length > 0) {

                setSelectedVideoId(
                    String(res.data[0].id)
                );

            }

        }

        catch (err) {

            console.error(
                "Failed to load lectures:",
                err
            );

        }

        finally {

            setLoadingLectures(false);

        }

    };


    const handleGenerate = async () => {

        if (!selectedVideoId) {

            setError("Select a lecture first.");
            return;

        }

        try {

            setGenerating(true);
            setError("");
            setMaterial(null);

            const res = await api.get(
                `/educator/materials/${selectedVideoId}`
            );

            setMaterial(res.data);

        }

        catch (err) {

            console.error(
                "Failed to generate learning material:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to generate learning material. " +
                "Make sure this lecture has a transcript."
            );

        }

        finally {

            setGenerating(false);

        }

    };


    return (

        <DashboardLayout role="educator">

            <div className="materials-page">

                <h1>Learning Materials</h1>

                <div className="materials-controls">

                    <select
                        className="materials-select"
                        value={selectedVideoId}
                        onChange={(e) =>
                            setSelectedVideoId(e.target.value)
                        }
                        disabled={
                            loadingLectures ||
                            lectures.length === 0
                        }
                    >

                        {loadingLectures && (
                            <option value="">
                                Loading lectures...
                            </option>
                        )}

                        {!loadingLectures &&
                            lectures.length === 0 && (

                            <option value="">
                                No lectures available
                            </option>

                        )}

                        {!loadingLectures &&
                            lectures.map((lecture) => (

                            <option
                                key={lecture.id}
                                value={lecture.id}
                            >
                                {lecture.title}
                                {
                                    lecture.status !== "Completed"
                                        ? ` (${lecture.status})`
                                        : ""
                                }
                            </option>

                        ))}

                    </select>

                    <button
                        className="materials-generate-btn"
                        onClick={handleGenerate}
                        disabled={
                            generating ||
                            !selectedVideoId
                        }
                    >
                        {generating
                            ? "Generating..."
                            : "Generate"}
                    </button>

                </div>

                {error && (

                    <p className="materials-error">
                        {error}
                    </p>

                )}

                {generating && (

                    <p className="materials-loading">
                        Generating learning material...
                    </p>

                )}

                {!generating && material && (

                    <LearningMaterial material={material} />

                )}

            </div>

        </DashboardLayout>

    );

}