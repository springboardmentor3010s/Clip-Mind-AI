fetch("../components/navbar.html")
.then(response => response.text())
.then(data => {

    document.getElementById("navbar").innerHTML = data;

    const user = JSON.parse(localStorage.getItem("user"));

    const role =
        localStorage.getItem("role") ||
        (user ? user.role : "");

    if (user) {
        document.getElementById("username").textContent =
            user.full_name || "User";
    }

    if (role) {
        document.getElementById("userRole").textContent =
            role.charAt(0).toUpperCase() + role.slice(1);
    }

    const toggle = document.getElementById("menuToggle");

    if (toggle) {
        toggle.addEventListener("click", () => {

            const sidebar = document.getElementById("sidebarContainer");

            if (sidebar) {
                sidebar.classList.toggle("collapsed");
            }

            document.body.classList.toggle("sidebar-collapsed");

        });
    }

});