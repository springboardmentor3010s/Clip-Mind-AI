/* ==========================================
   ClipMind AI - Smart Search
========================================== */

const resultTable = document.getElementById("resultTable");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const dateFilter = document.getElementById("dateFilter");
const searchBtn = document.getElementById("searchBtn");

/* ==========================================
   Search Videos
========================================== */

async function searchVideos() {

    const token = localStorage.getItem("token");

    const q = searchInput.value.trim();
    const status = statusFilter.value;
    const date = dateFilter.value;

    let url = `${API_BASE_URL}/search?`;

    if (q !== "") {
        url += `q=${encodeURIComponent(q)}&`;
    }

    if (status !== "") {
        url += `status=${encodeURIComponent(status)}&`;
    }

    if (date !== "") {
        url += `date=${encodeURIComponent(date)}&`;
    }

    resultTable.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;padding:25px;">
                Searching...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Search failed");
        }

        const videos = await response.json();

        renderResults(videos);

    }
    catch (error) {

        console.error(error);

        resultTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;color:red;padding:25px;">
                    Failed to search videos.
                </td>
            </tr>
        `;

    }

}

/* ==========================================
   Render Results
========================================== */

function renderResults(videos) {

    resultTable.innerHTML = "";

    if (videos.length === 0) {

        resultTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:25px;">
                    No videos found.
                </td>
            </tr>
        `;

        return;
    }

    videos.forEach(video => {

        let thumbnail = "";

        if (video.thumbnail_path) {

            if (video.thumbnail_path.includes("/uploads")) {

                thumbnail =
                    API_BASE_URL +
                    video.thumbnail_path.substring(
                        video.thumbnail_path.indexOf("/uploads")
                    );

            }

        }

        resultTable.innerHTML += `

        <tr>

            <td>

                <img
                    src="${thumbnail}"
                    width="160"
                    style="border-radius:8px;">

            </td>

            <td>${video.title}</td>

            <td>${video.duration ? video.duration.toFixed(2) + " sec" : "--"}</td>

            <td>${video.status}</td>

            <td>${formatDate(video.created_at)}</td>

            <td>

                <button
                    class="action-btn"
                    onclick="viewVideo(${video.id})">

                    Open

                </button>

            </td>

        </tr>

        `;

    });

}

/* ==========================================
   Open Video
========================================== */

function viewVideo(id) {

    window.location.href =
        `analytics.html?video_id=${id}`;

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
   Events
========================================== */

searchBtn.addEventListener(
    "click",
    searchVideos
);

searchInput.addEventListener(
    "keypress",
    function (e) {

        if (e.key === "Enter") {
            searchVideos();
        }

    }
);

statusFilter.addEventListener(
    "change",
    searchVideos
);

dateFilter.addEventListener(
    "change",
    searchVideos
);

/* ==========================================
   Load All Videos Initially
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    searchVideos
);