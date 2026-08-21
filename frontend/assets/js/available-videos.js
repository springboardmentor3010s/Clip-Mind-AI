/* ==========================================
   ClipMind AI - Available Videos
========================================== */

const USER_ID = localStorage.getItem("user_id") || 1;

/* ==========================================
   Load Videos
========================================== */

async function loadVideos() {

    const container = document.getElementById("videoContainer");

    container.innerHTML = `
        <div class="loading">
            Loading videos...
        </div>
    `;

    try {

        // Correct backend route
        const response = await fetch(
            `${API_BASE_URL}/learner/videos`
        );

        if (!response.ok) {
            throw new Error("Unable to load videos");
        }

        const videos = await response.json();

        if (!videos || videos.length === 0) {

            container.innerHTML = `
                <div class="loading">
                    No videos available.
                </div>
            `;

            return;
        }

        container.innerHTML = "";

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

            container.innerHTML += `

            <div class="video-card">

                <img
                    src="${thumbnail}"
                    alt="${video.title}"
                    onerror="this.src='../assets/images/video.png';"
                >

                <div class="video-body">

                    <h3>${video.title}</h3>

                    <p>
                        <strong>Duration:</strong>
                        ${video.duration || "-"}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${video.status}
                    </p>

                    <p>
                        <strong>Uploaded:</strong>
                        ${video.created_at
                            ? new Date(video.created_at).toLocaleDateString()
                            : "-"}
                    </p>

                    <div class="action-btn">

                        <button
                            class="btn watch"
                            onclick="watchVideo(${video.id})">

                            <i class="fa-solid fa-play"></i>
                            Watch

                        </button>

                        <button
                            class="btn bookmark"
                            onclick="bookmarkVideo(${video.id})">

                            <i class="fa-solid fa-bookmark"></i>
                            Bookmark

                        </button>

                    </div>

                </div>

            </div>

            `;

        });

    }

    catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="loading">
                Failed to load videos.
            </div>
        `;

    }

}

/* ==========================================
   Watch Video
========================================== */

function watchVideo(videoId) {

    window.location.href =
        `watch-video.html?id=${videoId}`;

}

/* ==========================================
   Bookmark Video
========================================== */

async function bookmarkVideo(videoId) {

    try {

        const statusResponse = await fetch(
            `${API_BASE_URL}/bookmarks/${USER_ID}/${videoId}/status`
        );

        const status = await statusResponse.json();

        let response;

        if (status.bookmarked) {

            response = await fetch(
                `${API_BASE_URL}/bookmarks/${USER_ID}/${videoId}`,
                {
                    method: "DELETE"
                }
            );

        } else {

            response = await fetch(
                `${API_BASE_URL}/bookmarks/${USER_ID}/${videoId}`,
                {
                    method: "POST"
                }
            );

        }

        const result = await response.json();

        alert(result.message);

    }

    catch (error) {

        console.error(error);

        alert("Unable to update bookmark.");

    }

}

/* ==========================================
   Initialize
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    loadVideos
);