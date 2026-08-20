import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


function ProcessingJobs() {

    const [jobs, setJobs] = useState([]);

    const [loading, setLoading] = useState(true);


    useEffect(() => {

        loadJobs();

        // Refresh every 5 seconds
        const interval = setInterval(
            loadJobs,
            5000
        );

        return () => clearInterval(
            interval
        );

    }, []);


    const loadJobs = async () => {

        try {

            const res = await api.get(
                "/admin/processing"
            );

            setJobs(res.data);

        }

        catch (err) {

            console.error(
                "Failed to load processing jobs:",
                err
            );

        }

        finally {

            setLoading(false);

        }

    };


    const getStatusClass = (status) => {

        switch (status) {

            case "Completed":
                return "job-status completed";

            case "Processing":
                return "job-status processing";

            case "Failed":
                return "job-status failed";

            default:
                return "job-status uploaded";

        }

    };


    const formatDate = (date) => {

        if (!date)
            return "-";

        return new Date(
            date
        ).toLocaleString(
            "en-IN",
            {
                timeZone:
                    "Asia/Kolkata"
            }
        );

    };


    if (loading) {

        return (

            <DashboardLayout role="admin">

                <h2>
                    Loading Processing Jobs...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="admin">

            <div className="admin-processing-page">

                <div className="admin-header">

                    <div>

                        <h1>
                            AI Processing Jobs
                        </h1>

                        <p>
                            Monitor video processing,
                            AI analysis and failures.
                        </p>

                    </div>

                    <div className="processing-live">

                        <span className="live-dot"></span>

                        Live

                    </div>

                </div>


                {/* =================================
                    SUMMARY
                ================================= */}

                <div className="processing-summary">

                    <div className="processing-summary-card">

                        <span>
                            Total
                        </span>

                        <strong>
                            {jobs.length}
                        </strong>

                    </div>


                    <div className="processing-summary-card">

                        <span>
                            Processing
                        </span>

                        <strong>
                            {
                                jobs.filter(
                                    (job) =>
                                        job.status ===
                                        "Processing"
                                ).length
                            }
                        </strong>

                    </div>


                    <div className="processing-summary-card">

                        <span>
                            Completed
                        </span>

                        <strong>
                            {
                                jobs.filter(
                                    (job) =>
                                        job.status ===
                                        "Completed"
                                ).length
                            }
                        </strong>

                    </div>


                    <div className="processing-summary-card">

                        <span>
                            Failed
                        </span>

                        <strong>
                            {
                                jobs.filter(
                                    (job) =>
                                        job.status ===
                                        "Failed"
                                ).length
                            }
                        </strong>

                    </div>

                </div>


                {/* =================================
                    JOBS
                ================================= */}

                <div className="processing-jobs">

                    {jobs.length === 0 ? (

                        <div className="admin-empty-state">

                            <div>
                                ⚙️
                            </div>

                            <h2>
                                No Processing Jobs
                            </h2>

                            <p>
                                No video processing
                                activity is available.
                            </p>

                        </div>

                    ) : (

                        jobs.map((job) => (

                            <div
                                className="processing-job-card"
                                key={job.id}
                            >

                                <div className="processing-job-header">

                                    <div>

                                        <h2>
                                            {job.title}
                                        </h2>

                                        <span>
                                            Job #{job.id}
                                        </span>

                                    </div>


                                    <span
                                        className={
                                            getStatusClass(
                                                job.status
                                            )
                                        }
                                    >
                                        {job.status}
                                    </span>

                                </div>


                                <div className="processing-stage">

                                    <div className="stage-header">

                                        <span>
                                            {
                                                job.processing_stage ||
                                                "Waiting"
                                            }
                                        </span>

                                        <strong>
                                            {
                                                Math.round(
                                                    job.progress ||
                                                    0
                                                )
                                            }%
                                        </strong>

                                    </div>


                                    <div className="processing-progress">

                                        <div
                                            className="processing-progress-fill"
                                            style={{
                                                width:
                                                    `${Math.min(
                                                        Math.max(
                                                            job.progress ||
                                                            0,
                                                            0
                                                        ),
                                                        100
                                                    )}%`
                                            }}
                                        />

                                    </div>

                                </div>


                                <div className="processing-job-meta">

                                    <div>

                                        <span>
                                            Started
                                        </span>

                                        <strong>
                                            {
                                                formatDate(
                                                    job.processing_started
                                                )
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Completed
                                        </span>

                                        <strong>
                                            {
                                                formatDate(
                                                    job.processing_completed
                                                )
                                            }
                                        </strong>

                                    </div>

                                </div>


                                {job.error_message && (

                                    <div className="processing-error">

                                        <strong>
                                            Processing Error
                                        </strong>

                                        <p>
                                            {job.error_message}
                                        </p>

                                    </div>

                                )}

                            </div>

                        ))

                    )}

                </div>

            </div>

        </DashboardLayout>

    );

}


export default ProcessingJobs;