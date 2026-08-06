import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";


function Courses() {

    const [lectures, setLectures] = useState([]);
    const navigate = useNavigate();
    
    useEffect(() => {

        fetchLectures();

    }, []);

    const fetchLectures = async () => {

        try {

            const res = await api.get(
                "/educator/shared"
            );

            setLectures(res.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    return (

        <DashboardLayout role="learner">

            <h1>

                Shared Lectures

            </h1>

            {

                lectures.length === 0 ?

                (

                    <p>

                        No lectures have been shared yet.

                    </p>

                )

                :

                (

                    lectures.map((lecture) => (

                        <div
                            className="video-card"
                            key={lecture.id}
                        >

                            <h2>

                                {lecture.title}

                            </h2>

                            <p>

                                {lecture.description}

                            </p>

                            <button

                                onClick={() => {

                                    navigate(`/learner/lecture/${lecture.id}`);

                                }}

                            >

                                Open Lecture

                            </button>

                        </div>

                    ))

                )

            }

        </DashboardLayout>

    );

}

export default Courses;