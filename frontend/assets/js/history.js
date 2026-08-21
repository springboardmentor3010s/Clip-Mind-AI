// API_BASE_URL comes from api.js

const USER_ID = localStorage.getItem("user_id") || 1;

async function loadHistory() {

    const container = document.getElementById("historyContainer");

    container.innerHTML = "Loading...";

    try {

        const response = await fetch(
            `${API_BASE_URL}/learning-history/${USER_ID}`
        );

        const data = await response.json();

        if (!data.history || data.history.length === 0) {

            container.innerHTML = `
                <div class="loading">
                    No learning history found.
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        data.history.forEach(item => {

            container.innerHTML += `

            <div class="history-card">

                <img src="${API_BASE_URL}/${item.thumbnail}">

                <div class="history-body">

                    <h3>${item.title}</h3>

                    <p><strong>Status:</strong> ${item.status}</p>

                    <p><strong>Progress:</strong> ${item.progress}%</p>

                    <div class="progress-bar">

                        <div
                            class="progress-fill"
                            style="width:${item.progress}%">
                        </div>

                    </div>

                    <p>
                        <strong>Last Watched:</strong>
                        ${new Date(item.watched_at).toLocaleString()}
                    </p>

                    <div class="action-btn">

                        <button
                            class="btn watch"
                            onclick="watchVideo(${item.video_id})">

                            Watch Again

                        </button>

                        <button
                            class="btn delete"
                            onclick="deleteHistory(${item.history_id})">

                            Delete

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
                Failed to load history.
            </div>
        `;

    }

}

function watchVideo(videoId){

    window.location.href =
    `watch-video.html?id=${videoId}`;

}

async function deleteHistory(historyId){

    if(!confirm("Delete this history record?"))
        return;

    await fetch(

        `${API_BASE_URL}/learning-history/${historyId}`,

        {
            method:"DELETE"
        }

    );

    loadHistory();

}

async function clearHistory(){

    if(!confirm("Clear all learning history?"))
        return;

    await fetch(

        `${API_BASE_URL}/learning-history/user/${USER_ID}`,

        {
            method:"DELETE"
        }

    );

    loadHistory();

}

document.addEventListener("DOMContentLoaded", loadHistory);