// src/components/Navbar.jsx

import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {

    const navigate = useNavigate();

    const logout = () => {

        localStorage.clear();

        navigate("/");

    };

    return (

        <nav
            style={{
                background: "#2563eb",
                color: "#fff",
                padding: "15px 30px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}
        >

            <h2>ClipMind AI</h2>

            <div
                style={{
                    display: "flex",
                    gap: "20px",
                    alignItems: "center"
                }}
            >

                <Link
                    to="/dashboard"
                    style={{
                        color: "white",
                        textDecoration: "none"
                    }}
                >
                    Dashboard
                </Link>

                <Link
                    to="/upload"
                    style={{
                        color: "white",
                        textDecoration: "none"
                    }}
                >
                    Upload
                </Link>

                <Link
                    to="/transcript"
                    style={{
                        color: "white",
                        textDecoration: "none"
                    }}
                >
                    Transcript
                </Link>

                <Link
                    to="/summary"
                    style={{
                        color: "white",
                        textDecoration: "none"
                    }}
                >
                    Summary
                </Link>

                <Link
                    to="/keymoments"
                    style={{
                        color: "white",
                        textDecoration: "none"
                    }}
                >
                    Key Moments
                </Link>

                <Link
                    to="/analytics"
                    style={{
                        color: "white",
                        textDecoration: "none"
                    }}
                >
                    Analytics
                </Link>

                <Link
                    to="/profile"
                    style={{
                        color: "white",
                        textDecoration: "none"
                    }}
                >
                    Profile
                </Link>

                <button

                    onClick={logout}

                    style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        padding: "8px 15px",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}

                >

                    Logout

                </button>

            </div>

        </nav>

    );

}

export default Navbar;