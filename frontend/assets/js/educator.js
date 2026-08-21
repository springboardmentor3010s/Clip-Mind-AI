/* ==========================================
   ClipMind AI - Educator Dashboard
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});

/* ==========================================
   Load Dashboard
========================================== */

async function loadDashboard() {
    try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        if (!token || !user) {
            window.location.href = "login.html";
            return;
        }

        // Correct API endpoint
        const response = await fetch(
            `${API_BASE_URL}/classroom/${user.id}`,
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Unable to load dashboard.");
        }

        const data = await response.json();

        // Dashboard Cards
        document.getElementById("totalClassrooms").textContent =
            data.total_classrooms || 0;

        document.getElementById("totalLearners").textContent =
            data.total_learners || 0;

        document.getElementById("totalLectures").textContent =
            data.total_videos || 0;

        document.getElementById("sharedLectures").textContent =
            data.shared_videos || 0;

        document.getElementById("transcripts").textContent =
            data.transcripts_generated || 0;

        document.getElementById("summaries").textContent =
            data.summaries_generated || 0;

        loadRecentActivity(data.learners || []);

    } catch (err) {
        console.error(err);
        alert("Unable to load Educator Dashboard.");
    }
}

/* ==========================================
   Recent Activity Table
========================================== */

function loadRecentActivity(learners) {

    const tbody = document.getElementById("activityTable");

    tbody.innerHTML = "";

    if (learners.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
                    No classroom activity found.
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
                <td>Recently Shared</td>
            </tr>
        `;

    });

}

/* ==========================================
   Navigation
========================================== */

function goUpload() {
    window.location.href = "upload.html";
}

function goClassrooms() {
    window.location.href = "classrooms.html";
}

function goMaterials() {
    window.location.href = "study-materials.html";
}

function goShareLecture() {
    window.location.href = "share-lecture.html";
}

function goLearners() {
    window.location.href = "learners.html";
}

function goAnalytics() {
    window.location.href = "classroom-analytics.html";
}