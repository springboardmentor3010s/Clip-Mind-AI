/* ==========================================
   ClipMind AI - AI Chat
========================================== */

// API_BASE_URL comes from api.js

// Get video ID from URL
const params = new URLSearchParams(window.location.search);
const videoId = params.get("video_id");

if (!videoId) {
    alert("Video ID not found.");
    throw new Error("Missing video_id");
}

// DOM Elements
const chatBox = document.getElementById("chatBox");
const questionInput = document.getElementById("question");
const sendBtn = document.getElementById("sendBtn");
const videoTitle = document.getElementById("videoTitle");

// ==========================================
// Load Video Title
// ==========================================

async function loadVideo() {
    try {

        const response = await fetch(
            `${API_BASE_URL}/videos/${videoId}`
        );

        if (!response.ok) {
            throw new Error("Failed to load video");
        }

        const video = await response.json();

        console.log("Video:", video);

        videoTitle.textContent = video.title;

    } catch (error) {

        console.error(error);
        videoTitle.textContent = "Unknown Video";

    }
}

// ==========================================
// Add Message
// ==========================================

function addMessage(text, type) {

    const div = document.createElement("div");

    div.className = `message ${type}`;

    div.textContent = text;

    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;

}

// ==========================================
// Send Question
// ==========================================

async function sendQuestion() {

    console.log("Send button clicked");

    const question = questionInput.value.trim();

    if (question === "") return;

    addMessage(question, "user");

    questionInput.value = "";

    addMessage("Thinking...", "bot");

    try {

        console.log("Sending request to:", `${API_BASE_URL}/chat/${videoId}`);

        const response = await fetch(
            `${API_BASE_URL}/chat/${videoId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: question
                })
            }
        );

        console.log("Status:", response.status);

        // Remove Thinking...
        const bots = document.querySelectorAll(".bot");
        if (bots.length > 0) {
            bots[bots.length - 1].remove();
        }

        if (!response.ok) {
            throw new Error("API Error");
        }

        const result = await response.json();

        console.log(result);

        addMessage(result.answer, "bot");

    }
    catch (error) {

        console.error(error);

        const bots = document.querySelectorAll(".bot");
        if (bots.length > 0) {
            bots[bots.length - 1].remove();
        }

        addMessage("Sorry, something went wrong.", "bot");

    }

}

// ==========================================
// Events
// ==========================================

sendBtn.addEventListener("click", sendQuestion);

questionInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        sendQuestion();
    }

});

// ==========================================
// Initialize
// ==========================================

loadVideo();