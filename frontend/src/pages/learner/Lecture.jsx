import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";

import api from "../../api/axios";

function Lecture(){

    const { videoId } = useParams();

    const [lecture,setLecture]=useState(null);

    useEffect(()=>{

        fetchLecture();

    },[]);

    const fetchLecture=async()=>{

        try{

            const res=await api.get(

                `/creator/video/${videoId}`

            );

            setLecture(res.data);

        }

        catch(err){

            console.log(err);

        }

    };

    if(!lecture){

        return(

            <DashboardLayout role="learner">

                Loading...

            </DashboardLayout>

        );

    }

    return(

        <DashboardLayout role="learner">

            <h1>

                {lecture.title}

            </h1>

            <video

                controls

                width="700"

            >

                <source

                    src={`http://127.0.0.1:8000/uploads/videos/${lecture.filename}`}

                    type="video/mp4"

                />

            </video>

            <h2>

                Summary

            </h2>

            <div className="summary-box">

                {lecture.summary}

            </div>

        </DashboardLayout>

    );

}

export default Lecture;