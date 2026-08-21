if (!isLoggedIn()) {

    window.location.href = "login.html";

}

const role = getRole();

const page = window.location.pathname.split("/").pop();

const pages = {

    "admin-dashboard.html": "admin",

    "creator-dashboard.html": "creator",

    "educator-dashboard.html": "educator",

    "learner-dashboard.html": "learner"

};

if (pages[page]) {

    if (pages[page] !== role) {

        window.location.href = "access-denied.html";

    }

}