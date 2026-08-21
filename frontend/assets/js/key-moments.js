/* ==========================================
   ClipMind AI - Key Moments
========================================== */

const params = new URLSearchParams(window.location.search);
const videoId = params.get("video_id");
const token = localStorage.getItem("token");

const videoTitle = document.getElementById("videoTitle");
const videoPlayer = document.getElementById("videoPlayer");
const keyMomentsDiv = document.getElementById("keyMoments");
const generateBtn = document.getElementById("generateBtn");

/* ==========================================
   Load Video
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

        videoTitle.innerText = video.title;

        if (video.file_path) {

            const videoURL = API_BASE_URL + video.file_path;

            videoPlayer.innerHTML = `
                <source src="${videoURL}" type="video/mp4">
                Your browser does not support HTML5 video.
            `;

            videoPlayer.load();

        } else {

            keyMomentsDiv.innerHTML =
                "<p class='error'>Video not found.</p>";

        }

    }

    catch (error) {

        console.error(error);

        keyMomentsDiv.innerHTML =
            "<p class='error'>Unable to load video.</p>";

    }

}

/* ==========================================
   Generate Key Moments
========================================== */

async function generateKeyMoments() {

    generateBtn.disabled = true;
    generateBtn.innerHTML = "Generating...";

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

        await loadKeyMoments();

    }

    catch (error) {

        console.error(error);
        alert("Unable to generate key moments.");

    }

    generateBtn.disabled = false;
    generateBtn.innerHTML = "Generate Key Moments";

}

/* ==========================================
   Load Key Moments
========================================== */

async function loadKeyMoments() {

    keyMomentsDiv.innerHTML =
        "<div class='loading'>Loading...</div>";

    try {

        const response = await fetch(
            `${API_BASE_URL}/key-moments/${videoId}`,
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {

            keyMomentsDiv.innerHTML =
                "<p>No key moments generated yet.</p>";

            return;

        }

        const data = await response.json();

        console.log("Key Moments Response:", data);

        let moments = data.key_moments;

        // Backend returns JSON string
        if (typeof moments === "string") {

            moments = JSON.parse(moments);

        }

        if (!Array.isArray(moments) || moments.length === 0) {

            keyMomentsDiv.innerHTML =
                "<p>No key moments found.</p>";

            return;

        }

        let html = "";

        moments.forEach(moment => {

            html += `

            <div class="moment-card">

                <div class="timestamp">
                    ${moment.timestamp}
                </div>

                <div class="moment-text">
                    ${moment.text}
                </div>

                <button
                    class="play-btn"
                    onclick="seekVideo('${moment.timestamp}')">

                    <i class="fa-solid fa-play"></i>

                </button>

            </div>

            `;

        });

        keyMomentsDiv.innerHTML = html;

    }

    catch (error) {

        console.error(error);

        keyMomentsDiv.innerHTML =
            "<p class='error'>Unable to load key moments.</p>";

    }

}

/* ==========================================
   Jump To Timestamp
========================================== */

function seekVideo(timestamp) {

    const time = timestamp.split(":");

    const seconds =
        parseInt(time[0]) * 3600 +
        parseInt(time[1]) * 60 +
        parseInt(time[2]);

    videoPlayer.currentTime = seconds;
    videoPlayer.play();

}

/* ==========================================
   Initialize
========================================== */

if (!videoId) {

    keyMomentsDiv.innerHTML =
        "<p class='error'>Video ID missing.</p>";

}
else {

    loadVideo();
    loadKeyMoments();

}