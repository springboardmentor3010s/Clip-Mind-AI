// ==========================================
// ClipMind AI - Admin Dashboard
// ==========================================

const dashboardURL = `${API_BASE_URL}/admin/dashboard`;
const usersURL = `${API_BASE_URL}/admin/recent-users`;
const videosURL = `${API_BASE_URL}/admin/recent-videos`;
const distributionURL = `${API_BASE_URL}/admin/user-distribution`;
const statusURL = `${API_BASE_URL}/admin/video-status`;

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    loadRecentUsers();
    loadRecentVideos();
    loadUserDistribution();
    loadVideoStatus();
});

// ==========================================
// Dashboard Cards
// ==========================================

async function loadDashboard() {
    try {
        const res = await fetch(dashboardURL);
        const data = await res.json();

        document.getElementById("totalUsers").textContent = data.total_users;
        document.getElementById("totalVideos").textContent = data.total_videos;
        document.getElementById("uploadedVideos").textContent = data.uploaded_videos;
        document.getElementById("processingVideos").textContent = data.processing_videos;
        document.getElementById("completedVideos").textContent = data.completed_videos;

        document.getElementById("admins").textContent = data.admins;
        document.getElementById("creators").textContent = data.content_creators;
        document.getElementById("educators").textContent = data.educators;
        document.getElementById("learners").textContent = data.learners;

    } catch (err) {
        console.error(err);
    }
}

// ==========================================
// Recent Users
// ==========================================

async function loadRecentUsers() {

    try {

        const res = await fetch(usersURL);
        const data = await res.json();

        const tbody = document.getElementById("recentUsers");

        if (!tbody) return;

        tbody.innerHTML = "";

        data.users.forEach(user => {

            tbody.innerHTML += `

            <tr>

                <td>${user.id}</td>

                <td>${user.name}</td>

                <td>${user.email}</td>

                <td>${user.role}</td>

            </tr>

            `;

        });

    }

    catch(err){

        console.error(err);

    }

}

// ==========================================
// Recent Videos
// ==========================================

async function loadRecentVideos(){

    try{

        const res = await fetch(videosURL);
        const data = await res.json();

        const tbody = document.getElementById("recentVideos");

        if(!tbody) return;

        tbody.innerHTML = "";

        data.videos.forEach(video=>{

            tbody.innerHTML += `

            <tr>

                <td>${video.id}</td>

                <td>${video.title}</td>

                <td>${video.status}</td>

                <td>${video.duration ?? "-"}</td>

            </tr>

            `;

        });

    }

    catch(err){

        console.error(err);

    }

}

// ==========================================
// User Distribution Chart
// ==========================================

async function loadUserDistribution(){

    try{

        const res = await fetch(distributionURL);
        const data = await res.json();

        const canvas = document.getElementById("userChart");

        if(!canvas) return;

        new Chart(canvas,{

            type:"pie",

            data:{

                labels:[
                    "Admin",
                    "Content Creator",
                    "Educator",
                    "Learner"
                ],

                datasets:[{

                    data:[
                        data.admin,
                        data.content_creator,
                        data.educator,
                        data.learner
                    ],

                    backgroundColor:[
                        "#2563EB",
                        "#22C55E",
                        "#F97316",
                        "#EC4899"
                    ]

                }]

            }

        });

    }

    catch(err){

        console.error(err);

    }

}

// ==========================================
// Video Status Chart
// ==========================================

async function loadVideoStatus(){

    try{

        const res = await fetch(statusURL);
        const data = await res.json();

        const canvas = document.getElementById("videoChart");

        if(!canvas) return;

        new Chart(canvas,{

            type:"bar",

            data:{

                labels:[
                    "Uploaded",
                    "Processing",
                    "Processed"
                ],

                datasets:[{

                    label:"Videos",

                    data:[
                        data.uploaded,
                        data.processing,
                        data.processed
                    ],

                    backgroundColor:[
                        "#3B82F6",
                        "#F59E0B",
                        "#22C55E"
                    ]

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false

            }

        });

    }

    catch(err){

        console.error(err);

    }

}