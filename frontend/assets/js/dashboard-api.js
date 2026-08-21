/* =========================================
   ClipMind AI - Dashboard API
========================================= */

const API_BASE = "http://127.0.0.1:8000";

async function fetchDashboard(endpoint) {

    try {

        const token = localStorage.getItem("token");

        if (!token) {

            window.location.href = "login.html";
            return null;

        }

        const response = await fetch(API_BASE + endpoint, {

            method: "GET",

            headers: {

                "Content-Type": "application/json",
                "Authorization": "Bearer " + token

            }

        });

        if (response.status === 401) {

            localStorage.clear();

            window.location.href = "login.html";

            return null;

        }

        if (response.status === 403) {

            window.location.href = "access-denied.html";

            return null;

        }

        if (!response.ok) {

            throw new Error("Failed to fetch dashboard.");

        }

        return await response.json();

    }

    catch (error) {

        console.error("Dashboard Error:", error);

        return {

            uploaded_videos: 0,
            processed_videos: 0,
            processing_videos: 0,
            transcripts: 0,
            recent_videos: []

        };

    }

}

/* =========================================
   Recent Videos
========================================= */

async function fetchRecentVideos() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(API_BASE + "/videos/recent", {

            headers: {

                "Authorization": "Bearer " + token

            }

        });

        if (!response.ok) {

            return [];

        }

        return await response.json();

    }

    catch (error) {

        console.error(error);

        return [];

    }

}

/* =========================================
   Generic GET API
========================================= */

async function getData(endpoint) {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(API_BASE + endpoint, {

            headers: {

                "Authorization": "Bearer " + token

            }

        });

        return await response.json();

    }

    catch (error) {

        console.error(error);

        return null;

    }

}

/* =========================================
   Generic POST API
========================================= */

async function postData(endpoint, body) {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(API_BASE + endpoint, {

            method: "POST",

            headers: {

                "Content-Type": "application/json",
                "Authorization": "Bearer " + token

            },

            body: JSON.stringify(body)

        });

        return await response.json();

    }

    catch (error) {

        console.error(error);

        return null;

    }

}