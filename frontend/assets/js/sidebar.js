/* ==========================================
   ClipMind AI - Sidebar
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadSidebar();
});

/* ==========================================
   Load Sidebar Component
========================================== */

async function loadSidebar() {
    try {
        const response = await fetch("../components/sidebar.html");

        if (!response.ok) {
            throw new Error("Unable to load sidebar.");
        }

        const html = await response.text();
        document.getElementById("sidebar").innerHTML = html;

        buildSidebar();

    } catch (err) {
        console.error("Sidebar Error:", err);
    }
}

/* ==========================================
   Build Sidebar
========================================== */

function buildSidebar() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return;

    document.getElementById("sidebarUsername").textContent =
        user.full_name || user.name || user.username || "User";

    document.getElementById("sidebarRole").textContent =
        user.role || "Member";

    const role = (user.role || "").toLowerCase();

    const menu = document.getElementById("sidebarMenu");
    menu.innerHTML = "";

    let items = [];

    switch (role) {

        /* ==========================================
           CONTENT CREATOR
        ========================================== */

        case "creator":
        case "content creator":

            items = [
                {
                    title: "Dashboard",
                    icon: "fa-chart-line",
                    page: "creator-dashboard.html"
                },
                {
                    title: "Upload Video",
                    icon: "fa-upload",
                    page: "upload.html"
                },
                {
                    title: "My Videos",
                    icon: "fa-video",
                    page: "my-videos.html"
                },
                {
                    title: "Transcript",
                    icon: "fa-file-lines",
                    page: "transcript.html"
                },
                {
                    title: "AI Summary",
                    icon: "fa-robot",
                    page: "summary.html"
                },
                {
                    title: "Key Moments",
                    icon: "fa-clock",
                    page: "key-moments.html"
                },
                {
                    title: "Keywords",
                    icon: "fa-tags",
                    page: "keywords.html"
                },
                {
                    title: "Analytics",
                    icon: "fa-chart-column",
                    page: "analytics.html"
                },
                {
                    title: "AI Chat",
                    icon: "fa-comments",
                    page: "chat.html"
                },
                {
                    title: "Smart Search",
                    icon: "fa-magnifying-glass",
                    page: "search.html"
                },
                {
                    title: "Settings",
                    icon: "fa-gear",
                    page: "settings.html"
                },
                {
                    title: "Profile",
                    icon: "fa-user",
                    page: "profile.html"
                }
            ];

            break;

        /* ==========================================
           LEARNER
        ========================================== */

        case "learner":

            items = [
                {
                    title: "Dashboard",
                    icon: "fa-chart-line",
                    page: "learner-dashboard.html"
                },
                {
                    title: "Available Videos",
                    icon: "fa-video",
                    page: "available-videos.html"
                },
                {
                    title: "Bookmarks",
                    icon: "fa-bookmark",
                    page: "bookmarks.html"
                },
                {
                    title: "Transcript",
                    icon: "fa-file-lines",
                    page: "transcript.html"
                },
                {
                    title: "Summary",
                    icon: "fa-robot",
                    page: "summary.html"
                },
                {
                    title: "Key Moments",
                    icon: "fa-clock",
                    page: "key-moments.html"
                },
                {
                    title: "AI Chat",
                    icon: "fa-comments",
                    page: "chat.html"
                },
                {
                    title: "Smart Search",
                    icon: "fa-magnifying-glass",
                    page: "search.html"
                },
               
                {
                    title: "Profile",
                    icon: "fa-user",
                    page: "profile.html"
                }
            ];

            break;

        /* ==========================================
   EDUCATOR
========================================== */

case "educator":

    items = [
        {
            title: "Dashboard",
            icon: "fa-chart-line",
            page: "educator-dashboard.html"
        },
        {
            title: "Upload Lecture",
            icon: "fa-upload",
            page: "upload.html"
        },
        {
            title: "My Lectures",
            icon: "fa-video",
            page: "my-videos.html"
        },
        
        {
            title: "Classroom Details",
            icon: "fa-chart-column",
            page: "classroom-details.html"
        },
        {
            title: "Transcript",
            icon: "fa-file-lines",
            page: "transcript.html"
        },
        {
            title: "Summary",
            icon: "fa-robot",
            page: "summary.html"
        },
        {
            title: "Key Moments",
            icon: "fa-clock",
            page: "key-moments.html"
        },
        {
            title: "Analytics",
            icon: "fa-chart-pie",
            page: "analytics.html"
        },
        {
            title: "AI Chat",
            icon: "fa-comments",
            page: "chat.html"
        },
        {
            title: "Smart Search",
            icon: "fa-magnifying-glass",
            page: "search.html"
        },
        {
            title: "Profile",
            icon: "fa-user",
            page: "profile.html"
        }
    ];

    break;

        /* ==========================================
           ADMIN
        ========================================== */

        case "admin":

            items = [
                {
                    title: "Dashboard",
                    icon: "fa-chart-line",
                    page: "admin-dashboard.html"
                },
                {
                    title: "Recent Users",
                    icon: "fa-user-clock",
                    page: "recent-users.html"
                },
                {
                    title: "All Users",
                    icon: "fa-users",
                    page: "users.html"
                },
                {
                    title: "Role Management",
                    icon: "fa-user-shield",
                    page: "admin-role-management.html"
                },
                {
                    title: "Analytics",
                    icon: "fa-chart-pie",
                    page: "analytics.html"
                },
                {
                    title: "AI Chat",
                    icon: "fa-comments",
                    page: "chat.html"
                },
                {
                    title: "Smart Search",
                    icon: "fa-magnifying-glass",
                    page: "search.html"
                },
                {
                    title: "Profile",
                    icon: "fa-user",
                    page: "profile.html"
                }
            ];

            break;

        /* ==========================================
           DEFAULT
        ========================================== */

        default:

            items = [
                {
                    title: "Profile",
                    icon: "fa-user",
                    page: "profile.html"
                }
            ];
    }

    const currentPage = window.location.pathname.split("/").pop();

    items.forEach(item => {

        const active = currentPage === item.page ? "active" : "";

        menu.innerHTML += `
            <li>
                <a href="${item.page}" class="${active}">
                    <i class="fa-solid ${item.icon}"></i>
                    <span>${item.title}</span>
                </a>
            </li>
        `;
    });
}