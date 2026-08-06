import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function Transcripts() {

    const navigate = useNavigate();

    const [items, setItems] = useState([]);

    useEffect(() => {

        load();

    }, []);

    async function load() {

    try {

        const userId = localStorage.getItem("user_id");

        const res = await api.get(
            `/educator/transcripts?user_id=${userId}`
        );

        setItems(res.data);

    }

    catch (err) {

        console.log(err);

    }

}

    return (

        <DashboardLayout role="educator">

            <h1>Transcripts</h1>

            <div className="content-page">

<h1>Transcripts</h1>

<table className="educator-table">

                <thead>

                    <tr>

                        <th>Lecture</th>

                        <th>Status</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        items.map(item => (

                            <tr key={item.video_id}>

                                <td>{item.title}</td>

                                <td>

<span

className={

item.has_transcript

?

"status available"

:

"status missing"

}

>

{

item.has_transcript

?

"Available"

:

"Missing"

}

</span>

</td>

                                <td>

                                    <button className="edit-btn"

                                        onClick={() =>

                                            navigate(

                                                `/educator/transcript/${item.video_id}`

                                            )

                                        }

                                    >

                                        Edit

                                    </button>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

            </div>

        </DashboardLayout>

    );

}

export default Transcripts;