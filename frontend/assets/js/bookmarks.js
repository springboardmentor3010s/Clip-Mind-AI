// ==========================================
// ClipMind AI - Bookmarks
// ==========================================

// API_BASE_URL is already defined in api.js

const USER_ID = localStorage.getItem("user_id") || 1;

// ==========================================
// Load Bookmarks
// ==========================================

async function loadBookmarks() {

    const container = document.getElementById("bookmarkContainer");

    container.innerHTML = `
        <div class="loading">
            Loading bookmarks...
        </div>
    `;

    try {

        const response = await fetch(
            `${API_BASE_URL}/bookmarks/${USER_ID}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Failed to load bookmarks");
        }

        if (!data.bookmarks || data.bookmarks.length === 0) {

            container.innerHTML = `
                <div class="loading">
                    <i class="fa-solid fa-bookmark"></i>
                    <br><br>
                    No bookmarked videos found.
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        data.bookmarks.forEach(video => {

            let thumbnail = "../assets/images/video.png";

            if (video.thumbnail) {
                thumbnail = `${API_BASE_URL}/${video.thumbnail.replace(/^\/+/, "")}`;
            }

            container.innerHTML += `
                <div class="bookmark-card">

                    <img
                        src="${thumbnail}"
                        alt="${video.title}"
                        onerror="this.src='../assets/images/video.png'">

                    <div class="bookmark-body">

                        <h3>${video.title}</h3>

                        <p>
                            <strong>Duration:</strong>
                            ${video.duration ?? "N/A"}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${video.status}
                        </p>

                        <p>
                            <strong>Uploaded:</strong>
                            ${new Date(video.created_at).toLocaleDateString()}
                        </p>

                        <div class="action-btn">

                            <button
                                class="btn watch"
                                onclick="watchVideo(${video.video_id})">

                                <i class="fa-solid fa-play"></i>
                                Watch

                            </button>

                            <button
                                class="btn remove"
                                onclick="removeBookmark(${video.video_id})">

                                <i class="fa-solid fa-trash"></i>
                                Remove

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
                Failed to load bookmarks.
            </div>
        `;

    }

}

// ==========================================
// Watch Video
// ==========================================

function watchVideo(videoId) {

    window.location.href = `watch-video.html?id=${videoId}`;

}

// ==========================================
// Remove Bookmark
// ==========================================

async function removeBookmark(videoId) {

    const confirmDelete = confirm(
        "Are you sure you want to remove this bookmark?"
    );

    if (!confirmDelete) return;

    try {

        const response = await fetch(
            `${API_BASE_URL}/bookmarks/${USER_ID}/${videoId}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        alert(result.message);

        loadBookmarks();

    }

    catch (error) {

        console.error(error);

        alert("Failed to remove bookmark.");

    }

}

// ==========================================
// Initialize
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadBookmarks();

});