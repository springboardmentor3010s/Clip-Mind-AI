import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import MyVideos from "../../components/MyVideos";
import ProcessingStatus from "../../components/ProcessingStatus";

import api from "../../api/axios";

function CreatorDashboard() {

    const [stats, setStats] = useState(null);

    const userId = localStorage.getItem("user_id");

    useEffect(() => {

        fetchStats();

    }, []);

    const fetchStats = async () => {

        try {

            const res = await api.get(
                `/creator/dashboard/${userId}`
            );

            setStats(res.data);

        }

        catch(err){

            console.log(err);

        }

    };

    if(!stats){

        return(

            <DashboardLayout role="creator">

                <h2>Loading Dashboard...</h2>

            </DashboardLayout>

        );

    }

    return(

        <DashboardLayout role="creator">

            <h1>

                Welcome, Content Creator 👋

            </h1>

            <p>

                Manage your uploaded videos and AI-generated results.

            </p>

            <div className="stats-grid">

                <StatCard

                    title="Videos"

                    value={stats.videos}

                    color="#2563eb"

                />

                <StatCard

                    title="Summaries"

                    value={stats.summaries}

                    color="#16a34a"

                />

                <StatCard

                    title="Transcripts"

                    value={stats.transcripts}

                    color="#9333ea"

                />

                <StatCard

                    title="Storage"

                    value={stats.storage}

                    color="#f97316"

                />

            </div>

            <MyVideos />

            <ProcessingStatus />

        </DashboardLayout>

    );

}

export default CreatorDashboard;