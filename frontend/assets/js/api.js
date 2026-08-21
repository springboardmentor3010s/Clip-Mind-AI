/* ==========================================
   ClipMind AI - API Configuration
========================================== */

const API_BASE_URL = "http://127.0.0.1:8000";

/* ==========================================
   Authentication
========================================== */

const LOGIN_API = "/auth/login";
const REGISTER_API = "/auth/register";

/* ==========================================
   Dashboard
========================================== */

const CREATOR_DASHBOARD_API = "/dashboard/creator";
const LEARNER_DASHBOARD_API = "/dashboard/learner";
const EDUCATOR_DASHBOARD_API = "/dashboard/educator";
const ADMIN_DASHBOARD_API = "/dashboard/admin";

/* ==========================================
   Videos
========================================== */

const VIDEO_UPLOAD_API = "/videos/upload";
const VIDEOS_API = "/videos";

/* ==========================================
   Transcript
========================================== */

const TRANSCRIPT_API = "/transcript";

/* ==========================================
   AI Summary
========================================== */

const SUMMARY_API = "/summary";

/* ==========================================
   Key Moments
========================================== */

const KEY_MOMENTS_API = "/key-moments";

/* ==========================================
   Analytics
========================================== */

const ANALYTICS_API = "/analytics";

/* ==========================================
   Generic API Request
========================================== */

async function apiRequest(
    endpoint,
    method = "GET",
    data = null,
    token = null
) {

    const headers = {
        "Accept": "application/json"
    };

    if (!(data instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (data) {
        options.body =
            data instanceof FormData
                ? data
                : JSON.stringify(data);
    }

    const response = await fetch(
        API_BASE_URL + endpoint,
        options
    );

    let result = {};

    try {
        result = await response.json();
    } catch (e) {
        result = {};
    }

    if (!response.ok) {
        throw result;
    }

    return result;
}

/* ==========================================
   Authentication APIs
========================================== */

function login(data) {
    return apiRequest(LOGIN_API, "POST", data);
}

function register(data) {
    return apiRequest(REGISTER_API, "POST", data);
}

/* ==========================================
   Dashboard APIs
========================================== */

function getCreatorDashboard(token) {
    return apiRequest(
        CREATOR_DASHBOARD_API,
        "GET",
        null,
        token
    );
}

/* ==========================================
   Upload Video
========================================== */

async function uploadVideo(formData, token) {

    const response = await fetch(
        API_BASE_URL + VIDEO_UPLOAD_API,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw result;
    }

    return result;
}

/* ==========================================
   Videos
========================================== */

function getVideos(token) {
    return apiRequest(
        VIDEOS_API,
        "GET",
        null,
        token
    );
}

function getVideo(videoId, token) {
    return apiRequest(
        `${VIDEOS_API}/${videoId}`,
        "GET",
        null,
        token
    );
}

/* ==========================================
   Transcript
========================================== */

function getTranscript(videoId, token) {
    return apiRequest(
        `${TRANSCRIPT_API}/${videoId}`,
        "GET",
        null,
        token
    );
}

function generateTranscript(videoId, token) {
    return apiRequest(
        `${TRANSCRIPT_API}/${videoId}`,
        "POST",
        null,
        token
    );
}

function regenerateTranscript(videoId, token) {
    return apiRequest(
        `${TRANSCRIPT_API}/${videoId}`,
        "PUT",
        null,
        token
    );
}

/* ==========================================
   AI Summary
========================================== */

function getSummary(videoId, token) {
    return apiRequest(
        `${SUMMARY_API}/${videoId}`,
        "GET",
        null,
        token
    );
}

function generateSummary(videoId, token) {
    return apiRequest(
        `${SUMMARY_API}/${videoId}`,
        "POST",
        null,
        token
    );
}

function regenerateSummary(videoId, token) {
    return apiRequest(
        `${SUMMARY_API}/${videoId}`,
        "PUT",
        null,
        token
    );
}

/* ==========================================
   Key Moments
========================================== */

function getKeyMoments(videoId, token) {
    return apiRequest(
        `${KEY_MOMENTS_API}/${videoId}`,
        "GET",
        null,
        token
    );
}

function generateKeyMoments(videoId, token) {
    return apiRequest(
        `${KEY_MOMENTS_API}/${videoId}`,
        "POST",
        null,
        token
    );
}

/* ==========================================
   Analytics
========================================== */

function getAnalytics(videoId, token) {
    return apiRequest(
        `${ANALYTICS_API}/${videoId}`,
        "GET",
        null,
        token
    );
}

/* ==========================================
   Toast Notification
========================================== */

function showToast(message, success = true) {

    const toast = document.getElementById("toast");

    if (!toast) {
        alert(message);
        return;
    }

    toast.innerText = message;

    toast.style.background =
        success ? "#28a745" : "#dc3545";

    toast.style.color = "#fff";

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}