/* =====================================
   ClipMind AI - Authentication Helper
===================================== */

function saveToken(token) {
    localStorage.setItem("token", token);
}

function getToken() {
    return localStorage.getItem("token");
}

function saveUser(user) {

    localStorage.setItem("user", JSON.stringify(user));

    if (user.role) {
        localStorage.setItem("role", user.role);
    } else if (user.role_id) {

        switch (user.role_id) {
            case 1:
                localStorage.setItem("role", "admin");
                break;

            case 2:
                localStorage.setItem("role", "creator");
                break;

            case 3:
                localStorage.setItem("role", "educator");
                break;

            case 4:
                localStorage.setItem("role", "learner");
                break;
        }
    }
}

function getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}

function getRole() {

    const role = localStorage.getItem("role");

    if (role) return role;

    const user = getUser();

    if (!user) return "";

    switch (user.role_id) {
        case 1:
            return "admin";
        case 2:
            return "creator";
        case 3:
            return "educator";
        case 4:
            return "learner";
        default:
            return "";
    }
}

function isLoggedIn() {
    return getToken() !== null;
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}

function showToast(message, success = true) {

    const toast = document.getElementById("toast");

    if (!toast) {
        alert(message);
        return;
    }

    toast.innerHTML = message;

    toast.style.borderLeft = success
        ? "5px solid #22C55E"
        : "5px solid #EF4444";

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}