const user = JSON.parse(localStorage.getItem("user"));

const videoSelect = document.getElementById("videoSelect");
const learnerSelect = document.getElementById("learnerSelect");
const sharedTable = document.getElementById("sharedTable");
const shareBtn = document.getElementById("shareBtn");

document.addEventListener("DOMContentLoaded", () => {

    loadVideos();

    loadLearners();

    loadSharedLectures();

});

shareBtn.addEventListener("click", shareLecture);

async function loadVideos() {

    try {

        const res = await fetch(
            `${API_URL}/videos/user/${user.id}`
        );

        const data = await res.json();

        videoSelect.innerHTML = "";

        data.forEach(video => {

            videoSelect.innerHTML += `
                <option value="${video.id}">
                    ${video.title}
                </option>
            `;

        });

    }

    catch (err) {

        console.log(err);

    }

}

async function loadLearners() {

    try {

        const res = await fetch(
            `${API_URL}/users?role=learner`
        );

        const learners = await res.json();

        learnerSelect.innerHTML = "";

        learners.forEach(learner => {

            learnerSelect.innerHTML += `
                <option value="${learner.id}">
                    ${learner.full_name}
                </option>
            `;

        });

    }

    catch (err) {

        console.log(err);

    }

}

async function shareLecture() {

    const body = {

        educator_id: user.id,

        learner_id: parseInt(learnerSelect.value),

        video_id: parseInt(videoSelect.value)

    };

    try {

        const res = await fetch(`${API_URL}/share/`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(body)

        });

        const data = await res.json();

        alert(data.message);

        loadSharedLectures();

    }

    catch (err) {

        console.log(err);

    }

}

async function loadSharedLectures() {

    try {

        const res = await fetch(
            `${API_URL}/share/educator/${user.id}`
        );

        const data = await res.json();

        sharedTable.innerHTML = "";

        if (data.shared_videos.length === 0) {

            sharedTable.innerHTML = `

            <tr>

                <td colspan="3" align="center">

                    No Shared Lectures

                </td>

            </tr>

            `;

            return;

        }

        data.shared_videos.forEach(item => {

            sharedTable.innerHTML += `

            <tr>

                <td>${item.title}</td>

                <td>${item.learner_name}</td>

                <td>${new Date(item.shared_at).toLocaleString()}</td>

            </tr>

            `;

        });

    }

    catch (err) {

        console.log(err);

    }

}