import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";

import api from "../../api/axios";

function Summary(){

    const {videoId}=useParams();

    const navigate = useNavigate();

    const [summary,setSummary]=useState("");

    useEffect(()=>{

        fetchSummary();

    },[]);

    const fetchSummary=async()=>{

        try{

            const res=await api.get(

                `/creator/summary/${videoId}`

            );

            setSummary(

                res.data.summary

            );

        }

        catch(err){

            console.log(err);

        }

    };

    return(

        <DashboardLayout role="creator">

            <h1>AI Summary</h1>

            <div className="summary-box">

                {summary || "Generating Summary..."}

            </div>

            <div className="summary-buttons">
    <button
        onClick={() =>
            navigate(`/creator/keymoments/${videoId}`)
        }
    >
        Next → Key Moments
    </button>
</div>

        </DashboardLayout>

    );

}

export default Summary;