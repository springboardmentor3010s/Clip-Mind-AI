/* ==========================================
   ClipMind AI - Watch Video
========================================== */

const USER_ID = localStorage.getItem("user_id") || 1;

const params = new URLSearchParams(window.location.search);
const VIDEO_ID = params.get("id");

let bookmarked = false;

/* ==========================================
   Load Page
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    if (!VIDEO_ID) {
        alert("Invalid video.");
        return;
    }

    loadVideo();
});

/* ==========================================
   Load Video
========================================== */

async function loadVideo() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/learner/videos/${VIDEO_ID}`
        );

        if (!response.ok) {
            throw new Error("Video not found");
        }

        const data = await response.json();

        const player = document.getElementById("videoPlayer");

        // Build correct video URL
        const videoPath = data.video_path
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");

        const videoURL = `${API_BASE_URL}/${videoPath}`;

        console.log("API:", API_BASE_URL);
        console.log("Video Path:", data.video_path);
        console.log("Final URL:", videoURL);

        player.src = videoURL;
        player.load();

        player.onerror = () => {
            console.error("Video failed to load:", videoURL);
            alert("Unable to load video.");
        };

        document.getElementById("videoTitle").textContent =
            data.title || "Untitled Video";

        document.getElementById("videoDescription").textContent =
            data.description || "No description available.";

        document.getElementById("transcript").textContent =
            data.transcript || "Transcript not available.";

        document.getElementById("summary").textContent =
            data.summary || "Summary not available.";

        renderKeyMoments(data.key_moments);

        checkBookmarkStatus();

    }
    catch (err) {

        console.error(err);
        alert("Unable to load video.");

    }

}

/* ==========================================
   Key Moments
========================================== */

function renderKeyMoments(keyMoments) {

    const list = document.getElementById("keyMoments");

    list.innerHTML = "";

    if (!keyMoments) {
        list.innerHTML = "<li>No key moments available.</li>";
        return;
    }

    if (typeof keyMoments === "string") {

        try {

            keyMoments = JSON.parse(keyMoments);

            if (typeof keyMoments === "string") {
                keyMoments = JSON.parse(keyMoments);
            }

        }
        catch {

            keyMoments = [];

        }

    }

    if (!Array.isArray(keyMoments) || keyMoments.length === 0) {

        list.innerHTML = "<li>No key moments available.</li>";

        return;

    }

    keyMoments.forEach(item => {

        list.innerHTML += `
            <li style="margin-bottom:15px;">
                <strong>${item.timestamp}</strong>
                <br>
                ${item.text}
            </li>
        `;

    });

}

/* ==========================================
   Bookmark Status
========================================== */

async function checkBookmarkStatus() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/bookmarks/${USER_ID}/${VIDEO_ID}/status`
        );

        const data = await response.json();

        bookmarked = data.bookmarked;

        updateBookmarkButton();

    }
    catch (err) {

        console.error(err);

    }

}

/* ==========================================
   Update Bookmark Button
========================================== */

function updateBookmarkButton() {

    const btn = document.querySelector(".bookmark-btn");

    if (!btn) return;

    if (bookmarked) {

        btn.innerHTML = `
            <i class="fa-solid fa-bookmark"></i>
            Remove Bookmark
        `;

    } else {

        btn.innerHTML = `
            <i class="fa-regular fa-bookmark"></i>
            Bookmark
        `;

    }

}

/* ==========================================
   Bookmark / Remove Bookmark
========================================== */

async function bookmarkVideo() {

    try {

        let response;

        if (bookmarked) {

            response = await fetch(
                `${API_BASE_URL}/bookmarks/${USER_ID}/${VIDEO_ID}`,
                {
                    method: "DELETE"
                }
            );

        } else {

            response = await fetch(
                `${API_BASE_URL}/bookmarks/${USER_ID}/${VIDEO_ID}`,
                {
                    method: "POST"
                }
            );

        }

        const result = await response.json();

        alert(result.message);

        bookmarked = !bookmarked;

        updateBookmarkButton();

    }
    catch (err) {

        console.error(err);

        alert("Bookmark operation failed.");

    }

}