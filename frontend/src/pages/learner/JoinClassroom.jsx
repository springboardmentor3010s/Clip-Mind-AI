import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function JoinClassroom() {

    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState("");

    const [loading, setLoading] = useState(false);

    const joinClassroom = async (e) => {

        e.preventDefault();

        if (!joinCode.trim()) {

            alert("Enter the classroom code.");

            return;

        }

        try {

            setLoading(true);

            const res = await api.post(
                "/classroom/join",
                {
                    join_code:
                        joinCode.trim().toUpperCase()
                },
                {
                    params: {
                        learner_id:
                            localStorage.getItem("user_id")
                    }
                }
            );

            alert(
                res.data.message ||
                "Joined classroom successfully."
            );

            navigate("/learner/classrooms");

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Unable to join classroom."
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <DashboardLayout role="learner">

            <div className="join-classroom-page">

                <div className="join-classroom-card">

                    <div className="join-classroom-icon">
                        🎓
                    </div>

                    <h1>
                        Join a Classroom
                    </h1>

                    <p>
                        Enter the 6-character code
                        provided by your educator.
                    </p>

                    <form onSubmit={joinClassroom}>

                        <input
                            type="text"
                            placeholder="Example: AI7K92"
                            value={joinCode}
                            maxLength={6}
                            onChange={(e) =>
                                setJoinCode(
                                    e.target.value
                                        .toUpperCase()
                                )
                            }
                        />

                        <button
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Joining..."
                                : "Join Classroom"}
                        </button>

                    </form>

                </div>

            </div>

        </DashboardLayout>

    );

}

export default JoinClassroom;