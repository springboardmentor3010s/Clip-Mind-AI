// ==========================================
// ClipMind AI - Admin Role Management
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

// ==========================================
// Load Users
// ==========================================

async function loadUsers() {

    const tbody = document.getElementById("roleTableBody");

    if (!tbody) {
        console.error("roleTableBody not found.");
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;padding:20px;">
                Loading users...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(`${API_BASE_URL}/admin/users`);

        if (!response.ok) {
            throw new Error("Unable to fetch users");
        }

        const data = await response.json();

        tbody.innerHTML = "";

        const users = data.users || data;

        if (!users.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;">
                        No users found.
                    </td>
                </tr>
            `;
            return;
        }

        let total = 0;
        let learners = 0;
        let educators = 0;
        let creators = 0;

        users.forEach(user => {

            total++;

            switch ((user.role || "").toLowerCase()) {
                case "learner":
                    learners++;
                    break;
                case "educator":
                    educators++;
                    break;
                case "creator":
                case "content creator":
                    creators++;
                    break;
            }

            tbody.innerHTML += `
                <tr>

                    <td>${user.id}</td>

                    <td>${user.full_name || user.name}</td>

                    <td>${user.email}</td>

                    <td>${user.role}</td>

                    <td>

                        <select id="role-${user.id}" class="role-select">

                            <option value="admin"
                                ${user.role.toLowerCase()=="admin"?"selected":""}>
                                Admin
                            </option>

                            <option value="educator"
                                ${user.role.toLowerCase()=="educator"?"selected":""}>
                                Educator
                            </option>

                            <option value="learner"
                                ${user.role.toLowerCase()=="learner"?"selected":""}>
                                Learner
                            </option>

                            <option value="creator"
                                ${(user.role.toLowerCase()=="creator" || user.role.toLowerCase()=="content creator")?"selected":""}>
                                Creator
                            </option>

                        </select>

                    </td>

                    <td>

                        <button class="save-btn"
                            onclick="changeRole(${user.id})">
                            Save
                        </button>

                    </td>

                </tr>
            `;
        });

        document.getElementById("totalUsers").textContent = total;
        document.getElementById("learnerCount").textContent = learners;
        document.getElementById("educatorCount").textContent = educators;
        document.getElementById("creatorCount").textContent = creators;

    }
    catch (error) {

        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;color:red;">
                    Failed to load users
                </td>
            </tr>
        `;
    }

}

// ==========================================
// Change Role
// ==========================================

async function changeRole(userId) {

    const role = document.getElementById(`role-${userId}`).value;

    try {

        const response = await fetch(
            `${API_BASE_URL}/admin/users/${userId}/role?role=${encodeURIComponent(role)}`,
            {
                method: "PUT"
            }
        );

        if (!response.ok) {
            throw new Error("Update failed");
        }

        const result = await response.json();

        alert(result.message || "Role updated successfully.");

        loadUsers();

    }
    catch (error) {

        console.error(error);

        alert("Unable to update role.");

    }

}