/* ==========================================
   ClipMind AI - Settings
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadProfile();

    loadPreferences();

    document
        .getElementById("profileForm")
        .addEventListener("submit", updateProfile);

    document
        .getElementById("passwordForm")
        .addEventListener("submit", updatePassword);

});

/* ==========================================
   Load Profile
========================================== */

async function loadProfile() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(

            API_BASE + "/user/profile",

            {

                headers: {

                    "Authorization": "Bearer " + token

                }

            }

        );

        if (!response.ok) {

            throw new Error("Unable to load profile.");

        }

        const user = await response.json();

        document.getElementById("fullName").value =
            user.name || "";

        document.getElementById("email").value =
            user.email || "";

        document.getElementById("role").value =
            user.role || "";

    }

    catch (err) {

        console.error(err);

    }

}

/* ==========================================
   Update Profile
========================================== */

async function updateProfile(e) {

    e.preventDefault();

    try {

        const token = localStorage.getItem("token");

        const body = {

            name: document.getElementById("fullName").value,

            email: document.getElementById("email").value

        };

        const response = await fetch(

            API_BASE + "/user/profile",

            {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json",

                    "Authorization": "Bearer " + token

                },

                body: JSON.stringify(body)

            }

        );

        if (!response.ok) {

            throw new Error("Profile update failed.");

        }

        alert("Profile updated successfully.");

    }

    catch (err) {

        alert(err.message);

    }

}

/* ==========================================
   Update Password
========================================== */

async function updatePassword(e) {

    e.preventDefault();

    const currentPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {

        alert("Passwords do not match.");

        return;

    }

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(

            API_BASE + "/user/change-password",

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json",

                    "Authorization": "Bearer " + token

                },

                body: JSON.stringify({

                    currentPassword,

                    newPassword

                })

            }

        );

        if (!response.ok) {

            throw new Error("Password update failed.");

        }

        alert("Password updated successfully.");

        document.getElementById("passwordForm").reset();

    }

    catch (err) {

        alert(err.message);

    }

}

/* ==========================================
   Preferences
========================================== */

function loadPreferences() {

    document.getElementById("darkMode").checked =
        localStorage.getItem("darkMode") === "true";

    document.getElementById("notifications").checked =
        localStorage.getItem("notifications") !== "false";

    document.getElementById("autosave").checked =
        localStorage.getItem("autosave") !== "false";

}

function savePreferences() {

    localStorage.setItem(

        "darkMode",

        document.getElementById("darkMode").checked

    );

    localStorage.setItem(

        "notifications",

        document.getElementById("notifications").checked

    );

    localStorage.setItem(

        "autosave",

        document.getElementById("autosave").checked

    );

    alert("Preferences saved successfully.");

}