import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function Summaries() {

    const navigate = useNavigate();

    const [items, setItems] = useState([]);

    useEffect(() => {

        load();

    }, []);

    async function load() {

    try {

        const userId = localStorage.getItem("user_id");

        const res = await api.get(
            `/educator/summaries?user_id=${userId}`
        );

        setItems(res.data);

    }

    catch (err) {

        console.log(err);

    }

}

    return (

        <DashboardLayout role="educator">

            <h1>Summaries</h1>

            <div className="content-page">



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
        item.has_summary
            ? "status available"
            : "status missing"
    }
>
    {
        item.has_summary
            ? "Available"
            : "Missing"
    }
</span>

</td>

                                <td>

                                    <button className="edit-btn"

                                        onClick={() =>

                                            navigate(

                                                `/educator/summary/${item.video_id}`

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

export default Summaries;