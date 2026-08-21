/* ==========================================
   ClipMind AI - Classrooms
========================================== */

const classroomTable = document.getElementById("classroomTable");
const classroomForm = document.getElementById("classroomForm");
const classroomName = document.getElementById("classroomName");

let classrooms = [];

/* ==========================================
   Load Classrooms
========================================== */

async function loadClassrooms() {

    try {

        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        if (!token || !user) {
            window.location.href = "login.html";
            return;
        }

        const response = await fetch(
            `${API_BASE_URL}/classrooms/educator/${user.id}`,
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Unable to load classrooms.");
        }

        classrooms = await response.json();

        renderClassrooms(classrooms);

    }

    catch (error) {

        console.error(error);

        classroomTable.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    Failed to load classrooms.
                </td>
            </tr>
        `;

    }

}

/* ==========================================
   Render Classrooms
========================================== */

function renderClassrooms(data) {

    classroomTable.innerHTML = "";

    if (data.length === 0) {

        classroomTable.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No classrooms found.
                </td>
            </tr>
        `;

        return;

    }

    data.forEach(room => {

        classroomTable.innerHTML += `

        <tr>

            <td>${room.name}</td>

            <td>${room.class_code || "-"}</td>

            <td>${room.total_learners || 0}</td>

            <td>${room.total_lectures || 0}</td>

            <td>

                <button
                    class="action-btn view-btn"
                    onclick="viewClassroom(${room.id})">

                    View

                </button>

                <button
                    class="action-btn share-btn"
                    onclick="shareLecture(${room.id})">

                    Share

                </button>

            </td>

        </tr>

        `;

    });

}

/* ==========================================
   Create Classroom
========================================== */

classroomForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    try {

        const response = await fetch(
            `${API_BASE_URL}/classrooms`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    educator_id: user.id,
                    name: classroomName.value
                })
            }
        );

        if (!response.ok) {
            throw new Error();
        }

        classroomName.value = "";

        loadClassrooms();

        alert("Classroom created successfully.");

    }

    catch {

        alert("Unable to create classroom.");

    }

});

/* ==========================================
   Navigation
========================================== */

function viewClassroom(id) {

    window.location.href = `classroom-details.html?id=${id}`;

}

function shareLecture(id) {

    window.location.href = `share-lecture.html?classroom_id=${id}`;

}

/* ==========================================
   Initialize
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    loadClassrooms
);