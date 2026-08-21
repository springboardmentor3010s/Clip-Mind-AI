/* ==========================================
   ClipMind AI - Transcript API
========================================== */

const TRANSCRIPT_API = API_BASE_URL + "/transcript";
const EDUCATOR_API = API_BASE_URL + "/educator";

/* ==========================================
   Get Transcript
========================================== */

async function getTranscript(videoId) {

    const token = localStorage.getItem("token");

    const response = await fetch(`${TRANSCRIPT_API}/${videoId}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Unable to load transcript.");
    }

    return data;
}

/* ==========================================
   Regenerate Transcript
========================================== */

async function regenerateTranscript(videoId) {

    const token = localStorage.getItem("token");

    const response = await fetch(`${TRANSCRIPT_API}/${videoId}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Unable to regenerate transcript.");
    }

    return data;
}

/* ==========================================
   Edit Transcript (Educator Only)
========================================== */

async function updateTranscript(videoId, transcript) {

    const token = localStorage.getItem("token");

    const response = await fetch(
        `${EDUCATOR_API}/transcript/${videoId}`,
        {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                transcript: transcript
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Unable to update transcript.");
    }

    return data;
}