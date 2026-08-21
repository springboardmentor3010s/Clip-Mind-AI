function showToast(message, type = "success") {

    const toast = document.getElementById("toast");

    toast.innerHTML = message;

    toast.className = "toast show " + type;

    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

function logout() {

    localStorage.removeItem("access_token");

    window.location.href = "login.html";
}

function getToken() {

    return localStorage.getItem("access_token");
}

function isLoggedIn() {

    return getToken() !== null;
}