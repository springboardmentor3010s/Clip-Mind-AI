/* =====================================
   ClipMind AI - Login
===================================== */

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", loginUser);

async function loginUser(e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {

        const response = await apiRequest(
            LOGIN_API,
            "POST",
            {
                email,
                password
            }
        );

        console.log("Login Response:", response);

        // Save token
        if (response.access_token) {
            saveToken(response.access_token);
        }

        // Save user
        if (response.user) {
            saveUser(response.user);
        }

        console.log("Saved Token:", localStorage.getItem("token"));
        console.log("Saved Role:", localStorage.getItem("role"));
        console.log("Saved User:", localStorage.getItem("user"));

        showToast("Login Successful", true);

        setTimeout(() => {

            const role = getRole();

            switch (role) {

                case "admin":
                    window.location.href = "admin-dashboard.html";
                    break;

                case "creator":
                    window.location.href = "creator-dashboard.html";
                    break;

                case "educator":
                    window.location.href = "educator-dashboard.html";
                    break;

                case "learner":
                    window.location.href = "learner-dashboard.html";
                    break;

                default:
                    alert("Role not found.");
                    console.log(response);
            }

        }, 1000);

    }
    catch (error) {

        console.error(error);

        showToast(
            error.detail || "Invalid Email or Password",
            false
        );

    }

}