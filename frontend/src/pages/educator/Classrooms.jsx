import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function Classrooms() {

    const navigate = useNavigate();

    const [classrooms, setClassrooms] = useState([]);

    const [showCreate, setShowCreate] = useState(false);

    const [name, setName] = useState("");

    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(true);

    const educatorId =
        localStorage.getItem("user_id");

    useEffect(() => {

        fetchClassrooms();

    }, []);

    const fetchClassrooms = async () => {

        try {

            const res = await api.get(
                "/classroom/educator",
                {
                    params: {
                        educator_id: educatorId
                    }
                }
            );

            setClassrooms(res.data);

        } catch (err) {

            console.error(err);

            alert("Unable to load classrooms.");

        } finally {

            setLoading(false);

        }

    };

    const createClassroom = async (e) => {

        e.preventDefault();

        if (!name.trim()) {

            alert("Enter classroom name.");

            return;

        }

        try {

            await api.post(
                "/classroom/",
                {
                    name,
                    description
                },
                {
                    params: {
                        educator_id: educatorId
                    }
                }
            );

            setName("");

            setDescription("");

            setShowCreate(false);

            fetchClassrooms();

        } catch (err) {

            console.error(err);

            alert("Unable to create classroom.");

        }

    };

    if (loading) {

        return (

            <DashboardLayout role="educator">

                <h2>Loading Classrooms...</h2>

            </DashboardLayout>

        );

    }

    return (

        <DashboardLayout role="educator">

            <div className="classrooms-page">

                <div className="classrooms-header">

                    <div>

                        <h1>My Classrooms</h1>

                        <p>
                            Create and manage learning
                            spaces for your learners.
                        </p>

                    </div>

                    <button
                        className="classroom-create-btn"
                        onClick={() =>
                            setShowCreate(!showCreate)
                        }
                    >
                        + Create Classroom
                    </button>

                </div>

                {showCreate && (

                    <form
                        className="classroom-create-card"
                        onSubmit={createClassroom}
                    >

                        <h2>Create Classroom</h2>

                        <input
                            type="text"
                            placeholder="Classroom name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                        />

                        <textarea
                            placeholder="Description"
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                        />

                        <div className="classroom-form-actions">

                            <button type="submit">
                                Create
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreate(false)
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                )}

                {classrooms.length === 0 ? (

                    <div className="empty-classrooms">

                        <h2>No Classrooms Yet</h2>

                        <p>
                            Create your first classroom
                            to start teaching learners.
                        </p>

                    </div>

                ) : (

                    <div className="classroom-grid">

                        {classrooms.map((classroom) => (

                            <div
                                className="classroom-card"
                                key={classroom.id}
                            >

                                <div className="classroom-card-icon">
                                    🎓
                                </div>

                                <h2>
                                    {classroom.name}
                                </h2>

                                <p>
                                    {classroom.description ||
                                        "No description"}
                                </p>

                                <div className="classroom-code">

                                    <span>
                                        Join Code
                                    </span>

                                    <strong>
                                        {classroom.join_code}
                                    </strong>

                                </div>

                                <div className="classroom-students">

                                    👥{" "}
                                    {classroom.student_count}
                                    {" "}
                                    Students

                                </div>

                                <button
                                    className="classroom-open-btn"
                                    onClick={() =>
                                        navigate(
                                            `/educator/classroom/${classroom.id}`
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