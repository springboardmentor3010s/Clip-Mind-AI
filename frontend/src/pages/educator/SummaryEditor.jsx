import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function SummaryEditor() {

    const { videoId } = useParams();

    const [summary, setSummary] = useState("");

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        fetchSummary();

    }, []);

    const fetchSummary = async () => {

        try {

            const res = await api.get(
                `/educator/summary/${videoId}`
            );

            setSummary(
                res.data.summary
            );

        }

        catch (err) {

            console.log(err);

        }

        finally {

            setLoading(false);

        }

    };

    const saveSummary = async () => {

        try {

            await api.put(

                `/educator/summary/${videoId}`,

                {
                    summary
                }

            );

            alert("Summary Updated Successfully");

        }

        catch (err) {

            console.log(err);

            alert("Update Failed");

        }

    };

    return (

        <DashboardLayout role="educator">

            <h1>

                Edit Summary

            </h1>

            {

                loading ?

                <p>

                    Loading...

                </p>

                :

                <textarea
    className="editor-textarea"
    rows={25}
    style={{
        width: "100%",
        padding: "15px",
        fontSize: "16px",
        borderRadius: "10px",
        border: "1px solid #ccc",
        resize: "vertical",
        marginTop: "20px"
    }}
    value={summary}
    onChange={(e)=>setSummary(e.target.value)}
/>

            }

            <div className="summary-buttons">

                <button
    onClick={saveSummary}
    style={{
        marginTop: "20px",
        padding: "12px 24px",
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer"
    }}
>
    Save Summary
</button>

            </div>

        </DashboardLayout>

    );

}

export default SummaryEditor;