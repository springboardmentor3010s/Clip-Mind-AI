import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function TranscriptEditor() {

    const { videoId } = useParams();

    const [transcript, setTranscript] = useState("");

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        fetchTranscript();

    }, []);

    const fetchTranscript = async () => {

        try {

            const res = await api.get(
                `/educator/transcript/${videoId}`
            );

            setTranscript(
                res.data.transcript || ""
            );

        }

        catch (err) {

            console.log(err);

        }

        finally {

            setLoading(false);

        }

    };

    const saveTranscript = async () => {

        try {

            await api.put(

                `/educator/transcript/${videoId}`,

                {
                    transcript
                }

            );

            alert("Transcript Updated Successfully");

        }

        catch (err) {

            console.log(err);

            alert("Update Failed");

        }

    };

    return (

        <DashboardLayout role="educator">

            <h1>

                Edit Transcript

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
    value={transcript}
    onChange={(e)=>setTranscript(e.target.value)}
/>

            }

            <div className="summary-buttons">

                <button
    onClick={saveTranscript}
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
    Save Transcript
</button>

            </div>

        </DashboardLayout>

    );

}

export default TranscriptEditor;