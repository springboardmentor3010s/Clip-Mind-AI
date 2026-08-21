/* ==========================================
   ClipMind AI - Summary Page
========================================== */

const params = new URLSearchParams(window.location.search);
const videoId = params.get("video_id");
const token = localStorage.getItem("token");

const videoTitle = document.getElementById("videoTitle");
const videoPlayer = document.getElementById("videoPlayer");
const transcriptDiv = document.getElementById("transcript");
const summaryDiv = document.getElementById("summary");
const keyMomentsDiv = document.getElementById("keyMoments");

/* ==========================================
   Load Video Details
========================================== */

async function loadVideo() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/videos/${videoId}`,
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Unable to load video.");
        }

        const video = await response.json();

        console.log(video);

        // Title
        videoTitle.innerText = video.title;

        // Transcript
        transcriptDiv.innerHTML = video.transcript
            ? video.transcript.replace(/\n/g, "<br>")
            : "Transcript not available.";

        // Video
        if (video.file_path) {

            const videoURL = API_BASE_URL + video.file_path;

            videoPlayer.innerHTML = `
                <source src="${videoURL}" type="video/mp4">
                Your browser does not support HTML5 video.
            `;

            videoPlayer.load();

        } else {

            videoPlayer.outerHTML = `
                <div style="
                    text-align:center;
                    padding:70px;
                    color:#888;">
                    Video not available.
                </div>
            `;

        }

    }

    catch (err) {

        console.error(err);

        transcriptDiv.innerHTML =
            `<span style="color:red">${err.message}</span>`;

    }

}

/* ==========================================
   Load Summary
========================================== */

async function loadSummary() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/summary/${videoId}`,
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (response.status === 404) {

            summaryDiv.innerHTML = `
                <button onclick="generateSummary()">
                    Generate Summary
                </button>
            `;

            return;

        }

        const data = await response.json();

        summaryDiv.innerHTML = data.summary
            ? data.summary.replace(/\n/g, "<br>")
            : "Summary not available.";

    }

    catch (err) {

        summaryDiv.innerHTML =
            "<span style='color:red'>Unable to load summary.</span>";

    }

}

/* ==========================================
   Generate Summary
========================================== */

async function generateSummary() {

    summaryDiv.innerHTML = "Generating AI Summary...";

    try {

        const response = await fetch(
            `${API_BASE_URL}/summary/${videoId}`,
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Summary generation failed.");
        }

        const data = await response.json();

        summaryDiv.innerHTML =
            data.summary.replace(/\n/g, "<br>");

    }

    catch (err) {

        summaryDiv.innerHTML =
            `<span style="color:red">${err.message}</span>`;

    }

}

/* ==========================================
   Load Key Moments
========================================== */

async function loadKeyMoments() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/key-moments/${videoId}`,
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (response.status === 404) {

            keyMomentsDiv.innerHTML = `
                <button onclick="generateKeyMoments()">
                    Generate Key Moments
                </button>
            `;

            return;

        }

        if (!response.ok) {
            throw new Error("Unable to load key moments.");
        }

        const data = await response.json();

        if (!Array.isArray(data.key_moments) || data.key_moments.length === 0) {

            keyMomentsDiv.innerHTML = "No key moments found.";
            return;

        }

        let html = "";

        data.key_moments.forEach(moment => {

            html += `
                <div class="key-moment-card"
                     style="
                        border-left:4px solid #4CAF50;
                        padding:12px;
                        margin-bottom:12px;
                        background:#f8f9fa;
                        border-radius:6px;">

                    <div style="
                        color:#2196F3;
                        font-weight:bold;
                        margin-bottom:8px;">

                        ${moment.timestamp}

                    </div>

                    <div>

                        ${moment.text}

                    </div>

                </div>
            `;

        });

        keyMomentsDiv.innerHTML = html;

    }

    catch (err) {

        keyMomentsDiv.innerHTML =
            `<span style="color:red">${err.message}</span>`;

    }

}

/* ==========================================
   Generate Key Moments
========================================== */

async function generateKeyMoments() {

    keyMomentsDiv.innerHTML = "Generating Key Moments...";

    try {

        const response = await fetch(
            `${API_BASE_URL}/key-moments/${videoId}`,
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Generation failed.");
        }

        loadKeyMoments();

    }

    catch (err) {

        keyMomentsDiv.innerHTML =
            `<span style="color:red">${err.message}</span>`;

    }

}

/* ==========================================
   Initialize
========================================== */

loadVideo();
loadSummary();
loadKeyMoments();