/* ==========================================
   ClipMind AI - Learner Dashboard
========================================== */

let progressChart = null;
let activityChart = null;

const USER_ID = localStorage.getItem("user_id") || 1;

document.addEventListener("DOMContentLoaded", () => {
    loadLearnerDashboard();
});

/* ==========================================
   Load Dashboard
========================================== */

async function loadLearnerDashboard() {

    try {

        // Dashboard
        const dashboardResponse = await fetch(
            `${API_BASE_URL}/dashboard/learner`
        );

        let dashboard = {};

        if (dashboardResponse.ok) {
            dashboard = await dashboardResponse.json();
        }

        // Available Videos
        const videosResponse = await fetch(
            `${API_BASE_URL}/learner/videos`
        );

        let videos = [];

        if (videosResponse.ok) {
            videos = await videosResponse.json();
        }

        // Bookmarks
        const bookmarkResponse = await fetch(
            `${API_BASE_URL}/bookmarks/${USER_ID}`
        );

        let bookmarkData = { bookmarks: [] };

        if (bookmarkResponse.ok) {
            bookmarkData = await bookmarkResponse.json();
        }

        document.getElementById("videosWatched").textContent =
            dashboard.videosWatched || 0;

        document.getElementById("summariesRead").textContent =
            dashboard.summariesRead || 0;

        document.getElementById("bookmarks").textContent =
            bookmarkData.bookmarks.length;

        document.getElementById("progress").textContent =
            `${dashboard.progress || 0}%`;

        renderVideos(videos);

        renderBookmarks(bookmarkData.bookmarks);

        renderProgressChart(
            dashboard.progressChart || []
        );

        renderActivityChart(
            dashboard.activityChart || []
        );

    }

    catch (err) {

        console.error(err);

        alert("Unable to load learner dashboard.");

    }

}

/* ==========================================
   Available Videos
========================================== */

function renderVideos(videos) {

    const table = document.getElementById("videoTable");

    table.innerHTML = "";

    if (!videos || videos.length === 0) {

        table.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center;padding:40px;">
                No videos available.
            </td>
        </tr>
        `;

        return;

    }

    videos.forEach(video => {

        let thumbnail = "../assets/images/video.png";

        if (video.thumbnail) {

            const filename = video.thumbnail
                .replace(/\\/g, "/")
                .split("/")
                .pop();

            thumbnail =
                `${API_BASE_URL}/uploads/thumbnails/${filename}`;

        }

        table.innerHTML += `

        <tr>

            <td>

                <img
                    src="${thumbnail}"
                    width="120"
                    height="70"
                    style="object-fit:cover;border-radius:8px;"
                    onerror="this.src='../assets/images/video.png';"
                >

            </td>

            <td>${video.title}</td>

            <td>${video.duration || "-"}</td>

            <td>

                <div class="progress-bar">

                    <div
                        class="progress-fill"
                        style="width:${video.progress || 0}%">
                    </div>

                </div>

                <small>${video.progress || 0}%</small>

            </td>

            <td>

                <button
                    class="btn btn-primary"
                    onclick="watchVideo(${video.id})">

                    Watch

                </button>

            </td>

        </tr>

        `;

    });

}

/* ==========================================
   Watch Video
========================================== */

function watchVideo(id) {

    window.location.href =
        `watch-video.html?id=${id}`;

}

/* ==========================================
   Bookmarks
========================================== */

function renderBookmarks(bookmarks) {

    const container =
        document.getElementById("bookmarkContainer");

    container.innerHTML = "";

    if (!bookmarks || bookmarks.length === 0) {

        container.innerHTML =
            "<p>No bookmarked videos.</p>";

        return;

    }

    bookmarks.forEach(video => {

        container.innerHTML += `

        <div class="bookmark-card">

            <h4>${video.title}</h4>

            <p>

                Duration :
                ${video.duration || "-"}

            </p>

            <button
                class="btn btn-primary"
                onclick="watchVideo(${video.video_id})">

                Open Video

            </button>

        </div>

        `;

    });

}

/* ==========================================
   Progress Chart
========================================== */

function renderProgressChart(data) {

    const ctx =
        document.getElementById("progressChart").getContext("2d");

    if (progressChart)
        progressChart.destroy();

    progressChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: data.map(x => x.week),

            datasets: [

                {

                    label: "Progress",

                    data: data.map(x => x.progress),

                    borderColor: "#2563eb",

                    backgroundColor:
                        "rgba(37,99,235,.2)",

                    fill: true,

                    tension: .4

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false

        }

    });

}

/* ==========================================
   Activity Chart
========================================== */

function renderActivityChart(data) {

    const ctx =
        document.getElementById("activityChart").getContext("2d");

    if (activityChart)
        activityChart.destroy();

    activityChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: data.map(x => x.day),

            datasets: [

                {

                    label: "Minutes Studied",

                    data: data.map(x => x.minutes),

                    backgroundColor: "#22c55e"

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            scales: {

                y: {

                    beginAtZero: true

                }

            }

        }

    });

}