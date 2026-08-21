/* =========================================
   ClipMind AI - Creator Dashboard
========================================= */

const user = JSON.parse(localStorage.getItem("user"));

if (user) {

    document.getElementById("creatorName").textContent =
        user.full_name || "Creator";

}

async function loadDashboard() {

    try {

        const data = await fetchDashboard("/dashboard/creator");

        if (!data) return;

        document.getElementById("uploadedVideos").textContent =
            data.uploaded_videos || 0;

        document.getElementById("processedVideos").textContent =
            data.processed_videos || 0;

        document.getElementById("processingVideos").textContent =
            data.processing_videos || 0;

        document.getElementById("transcripts").textContent =
            data.transcripts || 0;

        loadRecentVideos(data.recent_videos || []);

    }

    catch (error) {

        console.error(error);

    }

}

function loadRecentVideos(videos) {

    const tbody = document.getElementById("recentVideos");

    tbody.innerHTML = "";

    if (videos.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5" style="text-align:center;padding:30px;">
                    No videos uploaded yet.
                </td>

            </tr>

        `;

        return;

    }

    videos.forEach(video => {

        tbody.innerHTML += `

            <tr>

                <td>

                    <img
                        src="${video.thumbnail || '../assets/images/video.png'}"
                        width="80"
                        height="45"
                        style="border-radius:8px;object-fit:cover;">

                </td>

                <td>${video.title}</td>

                <td>

                    <span class="status ${video.status.toLowerCase()}">
                        ${video.status}
                    </span>

                </td>

                <td>

                    ${video.summary
                        ? video.summary.substring(0, 60) + "..."
                        : "--"}

                </td>

                <td>

                    <button
                        class="action-btn"
                        onclick="window.location.href='summary.html?id=${video.id}'">

                        View

                    </button>

                </td>

            </tr>

        `;

    });

}

loadDashboard();