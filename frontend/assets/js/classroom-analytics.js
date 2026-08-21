/* ==========================================
   Classroom Analytics
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadAnalytics();
});

async function loadAnalytics() {

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/classroom/${user.id}`,
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Unable to load analytics.");
        }

        const data = await response.json();

        document.getElementById("totalLearners").textContent =
            data.total_learners || 0;

        document.getElementById("totalVideos").textContent =
            data.total_videos || 0;

        document.getElementById("sharedVideos").textContent =
            data.shared_videos || 0;

        document.getElementById("processedVideos").textContent =
            data.processed_videos || 0;

        document.getElementById("uploadedVideos").textContent =
            data.uploaded_videos || 0;

        document.getElementById("transcriptsGenerated").textContent =
            data.transcripts_generated || 0;

        document.getElementById("summariesGenerated").textContent =
            data.summaries_generated || 0;

        document.getElementById("totalDuration").textContent =
            data.total_duration || 0;

        document.getElementById("averageDuration").textContent =
            data.average_duration || 0;

        loadLearners(data.learners || []);

    } catch (error) {
        console.error(error);
        alert("Unable to load Classroom Analytics.");
    }
}

function loadLearners(learners) {

    const tbody = document.getElementById("learnerTable");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (learners.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center;">
                    No learners found.
                </td>
            </tr>
        `;
        return;
    }

    learners.forEach(learner => {

        tbody.innerHTML += `
            <tr>
                <td>${learner.learner_name}</td>
                <td>${learner.shared_videos}</td>
                <td>${learner.videos.length}</td>
            </tr>
        `;

    });
}