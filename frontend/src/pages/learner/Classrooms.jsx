import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function Classrooms() {

    const navigate = useNavigate();

    const [classrooms, setClassrooms] = useState([]);

    const [loading, setLoading] = useState(true);

    const learnerId =
        localStorage.getItem("user_id");

    useEffect(() => {

        fetchClassrooms();

    }, []);

    const fetchClassrooms = async () => {

        try {

            const res = await api.get(
                "/classroom/learner",
                {
                    params: {
                        learner_id: learnerId
                    }
                }
            );

            setClassrooms(res.data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return (
            <DashboardLayout role="learner">
                <h2>Loading Classrooms...</h2>
            </DashboardLayout>
        );

    }

    return (

        <DashboardLayout role="learner">

            <div className="learner-classrooms-page">

                <div className="learner-page-header">

                    <div>

                        <h1>My Classrooms</h1>

                        <p>
                            Access your classes,
                            lectures and learning materials.
                        </p>

                    </div>

                    <button
                        onClick={() =>
                            navigate(
                                "/learner/join-classroom"
                            )
                        }
                    >
                        + Join Classroom
                    </button>

                </div>

                {classrooms.length === 0 ? (

                    <div className="learner-empty-state">

                        <h2>No Classrooms Yet</h2>

                        <p>
                            Join a classroom using the
                            code provided by your educator.
                        </p>

                        <button
                            onClick={() =>
                                navigate(
                                    "/learner/join-classroom"
                                )
                            }
                        >
                            Join Classroom
                        </button>

                    </div>

                ) : (

                    <div className="learner-classroom-grid">

                        {classrooms.map((classroom) => (

                            <div
                                className="learner-classroom-card"
                                key={classroom.id}
                            >

                                <div className="learner-classroom-icon">
                                    🎓
                                </div>

                                <h2>
                                    {classroom.name}
                                </h2>

                                <p>
                                    {classroom.description ||
                                        "No description"}
                                </p>

                                <button
                                    onClick={() =>
                                        navigate(
                                            `/learner/classroom/${classroom.id}`
                                        )
                                    }
                                >
                                    Open Classroom →
                                </button>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </DashboardLayout>

    );

}

export default Classrooms;