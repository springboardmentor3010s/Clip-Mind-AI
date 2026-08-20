import { useEffect, useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";


function AuditLogs() {

    const [logs, setLogs] = useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");


    useEffect(() => {

        loadLogs();

    }, []);


    const loadLogs = async () => {

        try {

            const res = await api.get(
                "/admin/audit-logs"
            );

            setLogs(res.data);

        }

        catch (err) {

            console.error(
                "Failed to load audit logs:",
                err
            );

        }

        finally {

            setLoading(false);

        }

    };


    const formatDate = (date) => {

        if (!date)
            return "-";

        return new Date(date).toLocaleString(
            "en-IN",
            {
                timeZone: "Asia/Kolkata"
            }
        );

    };


    const filteredLogs = logs.filter(
        (log) =>

            log.action
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                ) ||

            log.username
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                ) ||

            log.description
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                )
    );


    if (loading) {

        return (

            <DashboardLayout role="admin">

                <h2>
                    Loading Audit Logs...
                </h2>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout role="admin">

            <div className="admin-audit-page">

                <div className="admin-header">

                    <div>

                        <h1>
                            Audit Logs
                        </h1>

                        <p>
                            Monitor important activity
                            across the platform.
                        </p>

                    </div>

                </div>


                <input
                    className="admin-search"
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                />


                <div className="audit-log-list">

                    {filteredLogs.length === 0 ? (

                        <div className="admin-empty-state">

                            <div>
                                📜
                            </div>

                            <h2>
                                No Audit Logs
                            </h2>

                            <p>
                                Platform activity will
                                appear here.
                            </p>

                        </div>

                    ) : (

                        filteredLogs.map(
                            (log) => (

                            <div
                                className="audit-log-card"
                                key={log.id}
                            >

                                <div className="audit-log-icon">
                                    📋
                                </div>


                                <div className="audit-log-content">

                                    <div className="audit-log-top">

                                        <div>

                                            <span className="audit-action">

                                                {log.action
                                                    ?.replace(
                                                        /_/g,
                                                        " "
                                                    )}

                                            </span>

                                            <h3>
                                                {log.description}
                                            </h3>

                                        </div>

                                        <span className="audit-date">

                                            {formatDate(
                                                log.created_at
                                            )}

                                        </span>

                                    </div>


                                    <div className="audit-log-meta">

                                        <span>
                                            User:{" "}
                                            {log.username ||
                                                "System"}
                                        </span>

                                        {log.entity_type && (

                                            <span>
                                                Entity:{" "}
                                                {
                                                    log.entity_type
                                                }
                                                {" #"}
                                                {
                                                    log.entity_id
                                                }
                                            </span>

                                        )}

                                    </div>

                                </div>

                            </div>

                        )

                    ))}

                </div>

            </div>

        </DashboardLayout>

    );

}


export default AuditLogs;