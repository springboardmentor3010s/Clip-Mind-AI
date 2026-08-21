/* ==========================================
   ClipMind AI - My Videos
========================================== */

const tableBody = document.getElementById("videoTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

let allVideos = [];

/* ==========================================
   Load Videos
========================================== */

async function loadVideos() {

    try {

        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user || !token) {
            window.location.href = "login.html";
            return;
        }

        const response = await fetch(
            `${API_BASE_URL}/videos?user_id=${user.id}`,
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Unable to load videos.");
        }

        allVideos = await response.json();

        console.log(allVideos);

        renderVideos(allVideos);

    } catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:30px;color:red;">
                    Failed to load videos.
                </td>
            </tr>
        `;
    }
}

/* ==========================================
   Render Videos
========================================== */

function renderVideos(videos) {

    tableBody.innerHTML = "";

    if (videos.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:30px;">
                    No videos uploaded.
                </td>
            </tr>
        `;

        return;
    }

    videos.forEach(video => {

        const videoURL = video.file_path
            ? API_BASE_URL + video.file_path
            : "";

        let thumbnailURL = "";

        if (video.thumbnail_path) {

            if (video.thumbnail_path.includes("/uploads")) {

                thumbnailURL =
                    API_BASE_URL +
                    video.thumbnail_path.substring(
                        video.thumbnail_path.indexOf("/uploads")
                    );
            }
        }

        tableBody.innerHTML += `

        <tr>

            <td>

                <video
                    width="220"
                    height="140"
                    controls
                    preload="metadata"
                    poster="${thumbnailURL}">

                    <source
                        src="${videoURL}"
                        type="video/mp4">

                    Your browser does not support HTML5 video.

                </video>

            </td>

            <td>${video.title}</td>

            <td>
                ${video.duration ? video.duration.toFixed(2) : "--"} sec
            </td>

            <td>

                <span class="status">
                    ${video.status}
                </span>

            </td>

            <td>${formatDate(video.created_at)}</td>

            <td>

                <button
                    class="action-btn"
                    onclick="viewTranscript(${video.id})">
                    Transcript
                </button>

                <button
                    class="action-btn"
                    onclick="viewSummary(${video.id})">
                    Summary
                </button>

                <button
                    class="action-btn"
                    onclick="viewKeyMoments(${video.id})">
                    Key Moments
                </button>

                <button
                    class="action-btn analytics-btn"
                    onclick="viewAnalytics(${video.id})">
                    Analytics
                </button>

                <button
                    class="action-btn chat-btn"
                    onclick="viewChat(${video.id})">
                    🤖 AI Chat
                </button>

            </td>

        </tr>

        `;

    });

}

/* ==========================================
   Search & Filter
========================================== */

function filterVideos() {

    const keyword = searchInput.value.toLowerCase();

    const status = statusFilter.value;

    const filtered = allVideos.filter(video => {

        const titleMatch =
            video.title.toLowerCase().includes(keyword);

        const statusMatch =
            status === "" ||
            video.status === status;

        return titleMatch && statusMatch;

    });

    renderVideos(filtered);

}

/* ==========================================
   Event Listeners
========================================== */

if (searchInput) {

    searchInput.addEventListener(
        "keyup",
        filterVideos
    );

}

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        filterVideos
    );

}

/* ==========================================
   Navigation
========================================== */

function viewTranscript(id) {

    window.location.href =
        `transcript.html?video_id=${id}`;

}

function viewSummary(id) {

    window.location.href =
        `summary.html?video_id=${id}`;

}

function viewKeyMoments(id) {

    window.location.href =
        `key-moments.html?video_id=${id}`;

}

function viewAnalytics(id) {

    window.location.href =
        `analytics.html?video_id=${id}`;

}

function viewChat(id) {

    window.location.href =
        `chat.html?video_id=${id}`;

}

/* ==========================================
   Format Date
========================================== */

function formatDate(date) {

    if (!date)
        return "--";

    return new Date(date).toLocaleString();

}

/* ==========================================
   Initialize
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    loadVideos
);