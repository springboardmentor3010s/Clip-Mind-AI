/* ==========================================
   ClipMind AI - Summary API
========================================== */

const SUMMARY_API = API_BASE_URL + "/summary";

async function getSummary(videoId) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${SUMMARY_API}/${videoId}`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json"
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Unable to load summary.");
    }

    return data;
}

async function generateSummary(videoId) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${SUMMARY_API}/${videoId}`, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Unable to generate summary.");
    }

    return data;
}

async function regenerateSummary(videoId) {
    const token = localStorage.getItem("token");

    const response = await fetch(`${SUMMARY_API}/${videoId}`, {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Unable to regenerate summary.");
    }

    return data;
}