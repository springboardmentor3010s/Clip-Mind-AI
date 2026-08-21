document.addEventListener("DOMContentLoaded", loadUsers);

async function loadUsers() {

    const tbody = document.getElementById("usersTableBody");

    try {

        const response = await fetch(`${API_BASE_URL}/admin/users`);
        const data = await response.json();

        tbody.innerHTML = "";

        data.users.forEach(user => {

            tbody.innerHTML += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                </tr>
            `;

        });

    } catch (err) {

        console.error(err);

        tbody.innerHTML = `
            <tr>
                <td colspan="4">Failed to load users.</td>
            </tr>
        `;

    }

}