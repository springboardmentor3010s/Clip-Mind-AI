/* ==========================================
   ClipMind AI - Upload Video
========================================== */

const uploadForm = document.getElementById("uploadForm");
const videoFile = document.getElementById("videoFile");
const dropZone = document.getElementById("dropZone");
const fileName = document.getElementById("fileName");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

let selectedFile = null;

/* ==========================================
   Choose File
========================================== */

videoFile.addEventListener("change", () => {

    if (videoFile.files.length > 0) {

        selectedFile = videoFile.files[0];
        fileName.textContent = selectedFile.name;

    }

});

/* ==========================================
   Drag & Drop
========================================== */

dropZone.addEventListener("dragover", (e) => {

    e.preventDefault();
    dropZone.classList.add("dragover");

});

dropZone.addEventListener("dragleave", () => {

    dropZone.classList.remove("dragover");

});

dropZone.addEventListener("drop", (e) => {

    e.preventDefault();

    dropZone.classList.remove("dragover");

    if (e.dataTransfer.files.length > 0) {

        selectedFile = e.dataTransfer.files[0];

        videoFile.files = e.dataTransfer.files;

        fileName.textContent = selectedFile.name;

    }

});

/* ==========================================
   Upload Video
========================================== */

uploadForm.addEventListener("submit", function (e) {

    e.preventDefault();

    if (!selectedFile) {

        showToast("Please select a video.", false);
        return;

    }

    const token = localStorage.getItem("token");

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {

        showToast("User not found. Please login again.", false);
        return;

    }

    if (!user.id) {

        showToast("User ID not found.", false);
        console.log(user);
        return;

    }

    const formData = new FormData();

    // Backend expects these names
    formData.append("user_id", user.id);
    formData.append("file", selectedFile);

    const xhr = new XMLHttpRequest();

    xhr.open(
        "POST",
        API_BASE_URL + "/videos/upload",
        true
    );

    if (token) {

        xhr.setRequestHeader(
            "Authorization",
            "Bearer " + token
        );

    }

    /* Upload Progress */

    xhr.upload.onprogress = function (event) {

        if (event.lengthComputable) {

            const percent = Math.round(
                (event.loaded / event.total) * 100
            );

            progressFill.style.width = percent + "%";
            progressText.innerText = percent + "%";

        }

    };

    /* Upload Success */

    xhr.onload = function () {

        console.log("Status :", xhr.status);
        console.log("Response :", xhr.responseText);

        if (xhr.status === 200 || xhr.status === 201) {

            progressFill.style.width = "100%";
            progressText.innerText = "100%";

            showToast("Video uploaded successfully.");

            setTimeout(() => {

                window.location.href = "my-videos.html";

            }, 1000);

        }

        else {

            try {

                const error = JSON.parse(xhr.responseText);

                showToast(
                    error.detail || "Upload failed.",
                    false
                );

            }

            catch {

                showToast("Upload failed.", false);

            }

        }

    };

    /* Upload Error */

    xhr.onerror = function () {

        showToast("Unable to connect to backend.", false);

    };

    xhr.send(formData);

});