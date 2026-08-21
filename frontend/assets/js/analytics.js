/* ==========================================
   ClipMind AI - Analytics Page
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadAnalytics();

    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            window.print();
        });
    }
});

/* ==========================================
   Load Analytics
========================================== */

async function loadAnalytics() {
    try {

        const token = localStorage.getItem("token");

        const videoId =
            localStorage.getItem("selectedVideoId") ||
            new URLSearchParams(window.location.search).get("video_id") ||
            new URLSearchParams(window.location.search).get("id");

        if (!videoId) {
            alert("No video selected.");
            return;
        }

        // Uses api.js
        const data = await getAnalytics(videoId, token);

        renderVideoInfo(data.video);
        renderStatistics(data.statistics);
        renderTranscript(data.transcript);
        renderSummary(data.summary);
        renderKeyMoments(data.key_moments);
        renderKeywords(data.keywords);
        renderInsights(data.insights);
        renderQuality(data.quality);
        renderTimeline(data.timeline);

    } catch (err) {

        console.error(err);

        document.querySelector(".analytics-container").innerHTML = `
            <div class="section-card">
                <h2 style="color:red;">
                    Failed to load analytics.
                </h2>
            </div>
        `;
    }
}

/* ==========================================
   Video Information
========================================== */

function renderVideoInfo(video) {

    document.getElementById("videoInfo").innerHTML = `

        <table class="analytics-table">

            <tr>
                <th>Title</th>
                <td>${video.title}</td>
            </tr>

            <tr>
                <th>Duration</th>
                <td>${video.duration.toFixed(2)} sec</td>
            </tr>

            <tr>
                <th>Resolution</th>
                <td>${video.resolution}</td>
            </tr>

            <tr>
                <th>Codec</th>
                <td>${video.codec}</td>
            </tr>

            <tr>
                <th>Status</th>
                <td>${video.status}</td>
            </tr>

            <tr>
                <th>Created</th>
                <td>${new Date(video.created_at).toLocaleString()}</td>
            </tr>

        </table>

    `;
}

/* ==========================================
   Statistics
========================================== */

function renderStatistics(stats) {

    document.getElementById("statistics").innerHTML = `

        <div class="stat-card">
            <h3>${stats.transcript_words}</h3>
            <p>Transcript Words</p>
        </div>

        <div class="stat-card">
            <h3>${stats.summary_words}</h3>
            <p>Summary Words</p>
        </div>

        <div class="stat-card">
            <h3>${stats.keyword_count}</h3>
            <p>Keywords</p>
        </div>

        <div class="stat-card">
            <h3>${stats.key_moment_count}</h3>
            <p>Key Moments</p>
        </div>

        <div class="stat-card">
            <h3>${stats.reading_time}</h3>
            <p>Reading Time</p>
        </div>

        <div class="stat-card">
            <h3>${stats.speaking_speed}</h3>
            <p>Speaking Speed</p>
        </div>

    `;
}

/* ==========================================
   Transcript
========================================== */

function renderTranscript(transcript) {

    document.getElementById("transcript").innerHTML = `

        <div class="content-box">
            ${transcript.text}
        </div>

    `;
}

/* ==========================================
   Summary
========================================== */

function renderSummary(summary) {

    document.getElementById("summary").innerHTML = `

        <div class="content-box">
            ${summary.text}
        </div>

    `;
}

/* ==========================================
   Key Moments
========================================== */

function renderKeyMoments(data) {

    let html = "";

    if (!data.items || data.items.length === 0) {

        html = "<p>No key moments found.</p>";

    } else {

        data.items.forEach(item => {

            html += `

                <div class="moment-card">

                    <strong>${item.timestamp}</strong>

                    <p>${item.text}</p>

                </div>

            `;

        });

    }

    document.getElementById("keyMoments").innerHTML = html;
}

/* ==========================================
   Keywords
========================================== */

function renderKeywords(data) {

    let html = "";

    if (!data.items || data.items.length === 0) {

        html = "<p>No keywords found.</p>";

    } else {

        data.items.forEach(keyword => {

            html += `
                <span class="keyword">${keyword}</span>
            `;

        });

    }

    document.getElementById("keywords").innerHTML = html;
}

/* ==========================================
   AI Insights
========================================== */

function renderInsights(insights) {

    document.getElementById("insights").innerHTML = insights
        .map(item => `<li>${item}</li>`)
        .join("");
}

/* ==========================================
   Quality Score
========================================== */

function renderQuality(q) {

    document.getElementById("quality").innerHTML = `

        <div class="quality-grid">

            <div class="stat-card">
                <h3>${q.overall}%</h3>
                <p>Overall</p>
            </div>

            <div class="stat-card">
                <h3>${q.transcript_accuracy}%</h3>
                <p>Transcript Accuracy</p>
            </div>

            <div class="stat-card">
                <h3>${q.summary_quality}%</h3>
                <p>Summary Quality</p>
            </div>

            <div class="stat-card">
                <h3>${q.keyword_coverage}%</h3>
                <p>Keyword Coverage</p>
            </div>

            <div class="stat-card">
                <h3>${q.key_moment_detection}%</h3>
                <p>Key Moment Detection</p>
            </div>

        </div>

    `;
}

/* ==========================================
   Timeline
========================================== */

function renderTimeline(timeline) {

    let html = "";

    timeline.forEach(step => {

        html += `

            <div class="timeline-item">

                <strong>${step.step}</strong>

                <span>${step.status}</span>

            </div>

        `;

    });

    document.getElementById("timeline").innerHTML = html;
}