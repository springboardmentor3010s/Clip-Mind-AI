/* ==========================================
   ClipMind AI - Transcript Page
========================================== */

const params = new URLSearchParams(window.location.search);
const videoId = params.get("video_id");

const transcriptText = document.getElementById("transcriptText");
const videoTitle = document.getElementById("videoTitle");

const loading = document.getElementById("loading");
const errorBox = document.getElementById("errorBox");

const searchInput = document.getElementById("searchInput");

const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const refreshBtn = document.getElementById("refreshBtn");

const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");

const user = JSON.parse(localStorage.getItem("user"));

let transcript = "";

/* ==========================================
   Load Transcript
========================================== */

async function loadTranscript() {

    loading.style.display = "block";
    errorBox.style.display = "none";

    try {

        const data = await getTranscript(videoId);

        transcript = data.transcript || "";

        videoTitle.innerText = data.title || "Video";

        transcriptText.value = transcript;

    } catch (err) {

        errorBox.style.display = "block";
        errorBox.innerText = err.message;

        transcriptText.value = "";

    }

    loading.style.display = "none";
}

/* ==========================================
   Educator Permission
========================================== */

if (
    !user ||
    user.role.toLowerCase() !== "educator"
) {
    editBtn.style.display = "none";
    saveBtn.style.display = "none";
}

/* ==========================================
   Edit
========================================== */

editBtn.onclick = () => {

    transcriptText.removeAttribute("readonly");

    transcriptText.focus();

    editBtn.style.display = "none";

    saveBtn.style.display = "inline-block";
};

/* ==========================================
   Save
========================================== */

saveBtn.onclick = async () => {

    try {

        await updateTranscript(
            videoId,
            transcriptText.value
        );

        transcript = transcriptText.value;

        transcriptText.setAttribute(
            "readonly",
            true
        );

        editBtn.style.display = "inline-block";

        saveBtn.style.display = "none";

        alert("Transcript updated successfully.");

    } catch (err) {

        alert(err.message);

    }

};

/* ==========================================
   Regenerate
========================================== */

refreshBtn.onclick = async () => {

    loading.style.display = "block";

    try {

        await regenerateTranscript(videoId);

        await loadTranscript();

        alert("Transcript regenerated successfully.");

    } catch (err) {

        alert(err.message);

    }

    loading.style.display = "none";

};

/* ==========================================
   Copy
========================================== */

copyBtn.onclick = () => {

    navigator.clipboard.writeText(
        transcriptText.value
    );

    alert("Transcript copied.");

};

/* ==========================================
   Download
========================================== */

downloadBtn.onclick = () => {

    const blob = new Blob(
        [transcriptText.value],
        {
            type: "text/plain"
        }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "transcript.txt";

    a.click();

    URL.revokeObjectURL(url);

};

/* ==========================================
   Search
========================================== */

searchInput.addEventListener("keyup", () => {

    const keyword = searchInput.value.toLowerCase();

    if (keyword === "") {

        transcriptText.value = transcript;

        return;

    }

    const lines = transcript
        .split("\n")
        .filter(line =>
            line.toLowerCase().includes(keyword)
        );

    transcriptText.value = lines.join("\n");

});

/* ==========================================
   Start
========================================== */

loadTranscript();