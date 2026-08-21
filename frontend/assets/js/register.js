/* ==========================================
   ClipMind AI - Register
========================================== */

// Do NOT declare API_BASE_URL here.
// It is already defined in api.js

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", registerUser);

async function registerUser(e) {
    e.preventDefault();

    const full_name = document.getElementById("full_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    const roleMap = {
        creator: 2,
        educator: 3,
        learner: 4
    };

    const userData = {
        full_name,
        email,
        password,
        role_id: roleMap[role]
    };

    try {

        const response = await apiRequest(
            REGISTER_API,
            "POST",
            userData
        );

        console.log(response);

        showToast("Registration Successful", true);

        registerForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);

    } catch (error) {

        console.error(error);

        showToast(error.detail || "Registration Failed", false);
    }
}