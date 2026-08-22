"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  getVideoById,
  getTranscript,
  updateTranscript,
  getTranscriptSegments,
  getSummary,
  downloadTranscript,
  downloadSummary,
  getKeyMoments,
  generateKeyMoments,
  getHighlightReport,
  generateHighlightReport,
  getKeywords,
  generateKeywords,
  createBookmark,
} from "@/services/videoService";

import { getEducatorClassrooms } from "@/services/classroomService";

import { shareSummary } from "@/services/summaryShareService";

export default function VideoDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);

  const [transcript, setTranscript] = useState(null);
  const [transcriptSegments, setTranscriptSegments] = useState([]);

  const [isEditingTranscript, setIsEditingTranscript] =
    useState(false);

  const [editedTranscriptText, setEditedTranscriptText] =
    useState("");

  const [savingTranscript, setSavingTranscript] =
    useState(false);

  const [saveTranscriptError, setSaveTranscriptError] =
    useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchCount, setSearchMatchCount] = useState(0);

  const [shortSummary, setShortSummary] = useState(null);
  const [detailedSummary, setDetailedSummary] = useState(null);

  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [transcriptError, setTranscriptError] = useState("");
  const [summaryError, setSummaryError] = useState("");

  const [keyMoments, setKeyMoments] = useState([]);
  const [highlightReport, setHighlightReport] = useState(null);
  const [keywords, setKeywords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [keyMomentsLoading, setKeyMomentsLoading] = useState(false);
  const [highlightLoading, setHighlightLoading] = useState(false);
  const [keywordsLoading, setKeywordsLoading] = useState(false);

  const [generatingKeyMoments, setGeneratingKeyMoments] = useState(false);

  const [keyMomentError, setKeyMomentError] = useState("");
  const [highlightError, setHighlightError] = useState("");
  const [keywordError, setKeywordError] = useState("");

  const [activeSection, setActiveSection] = useState(null);

  const [role, setRole] = useState("");
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  const [sharingSummaryId, setSharingSummaryId] = useState(null);

  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState("");

  useEffect(() => {
  const storedRole = localStorage.getItem("role") || "";
  setRole(storedRole);
}, []);

// ============================================================
// LOAD EDUCATOR CLASSROOMS
// ============================================================

useEffect(() => {
  const loadClassrooms = async () => {
    if (role !== "EDUCATOR") {
      return;
    }

    try {
      const data = await getEducatorClassrooms();

      setClassrooms(data);
    } catch (error) {
      console.error(
        "Failed to load educator classrooms:",
        error
      );
    }
  };

  loadClassrooms();
}, [role]);


//   useEffect(() => {
//   if (id) {
//     loadVideo();
//     loadTranscript();
//     loadTranscriptSegments();
//     loadSummaries();
//     loadKeyMoments();
//     loadHighlightReport();
//     loadKeywords();
//   }
// }, [id]);

    useEffect(() => {
  if (id) {
    loadVideo();
  }
}, [id]);

useEffect(() => {
  if (!searchQuery.trim() || !transcript?.transcript_text) {
    setSearchMatchCount(0);
    return;
  }

  const escapedQuery = searchQuery.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(escapedQuery, "gi");
  const matches = transcript.transcript_text.match(regex);

  setSearchMatchCount(matches ? matches.length : 0);
}, [searchQuery, transcript]);


  async function loadVideo() {
    try {
      const data = await getVideoById(id);
      setVideo(data);
    } catch (error) {
      console.error("Failed to load video:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTranscript() {
  try {
    setTranscriptLoading(true);
    setTranscriptError("");

    const data = await getTranscript(id);

    setTranscript(data);

    setEditedTranscriptText(
      data.transcript_text || ""
    );

  } catch (error) {
    console.error("Failed to load transcript:", error);

    setTranscriptError(
      error.response?.data?.detail ||
        "Unable to load transcript."
    );
  } finally {
    setTranscriptLoading(false);
  }
}

const handleEditTranscript = () => {
  if (role !== "EDUCATOR" || !transcript) {
    return;
  }

  setEditedTranscriptText(
    transcript.transcript_text || ""
  );

  setSaveTranscriptError("");
  setIsEditingTranscript(true);
};


const handleCancelEditTranscript = () => {
  setEditedTranscriptText(
    transcript?.transcript_text || ""
  );

  setSaveTranscriptError("");
  setIsEditingTranscript(false);
};

const handleSaveTranscript = async () => {
  const trimmedTranscript =
    editedTranscriptText.trim();

  if (!trimmedTranscript) {
    setSaveTranscriptError(
      "Transcript cannot be empty."
    );
    return;
  }

  try {
    setSavingTranscript(true);
    setSaveTranscriptError("");

    const updatedTranscript =
      await updateTranscript(
        id,
        trimmedTranscript
      );

    setTranscript(updatedTranscript);

    setEditedTranscriptText(
      updatedTranscript.transcript_text
    );

    setIsEditingTranscript(false);

  } catch (error) {
    console.error(
      "Failed to update transcript:",
      error
    );

    setSaveTranscriptError(
      error.response?.data?.detail ||
      "Failed to update transcript."
    );

  } finally {
    setSavingTranscript(false);
  }
};


async function loadTranscriptSegments() {
  try {
    const data = await getTranscriptSegments(id);

    setTranscriptSegments(data);
  } catch (error) {
    console.error(
      "Failed to load transcript segments:",
      error
    );

    setTranscriptSegments([]);
  }
}


async function loadSummaries() {
  try {
    setSummaryLoading(true);
    setSummaryError("");

    const [shortData, detailedData] = await Promise.all([
      getSummary(id, "short"),
      getSummary(id, "detailed"),
    ]);

    setShortSummary(shortData);
    setDetailedSummary(detailedData);
  } catch (error) {
    console.error("Failed to load summaries:", error);

    setSummaryError(
      error.response?.data?.detail ||
        "Unable to load summaries."
    );
  } finally {
    setSummaryLoading(false);
  }
}

  async function loadKeyMoments() {
    try {
      setKeyMomentsLoading(true);
      setKeyMomentError("");

      const data = await getKeyMoments(id);

      setKeyMoments(data);
    } catch (error) {
      console.error("Failed to load key moments:", error);
      setKeyMomentError("Unable to load key moments.");
    } finally {
      setKeyMomentsLoading(false);
    }
  }


  async function loadHighlightReport() {
  try {
    setHighlightLoading(true);
    setHighlightError("");

    const data = await getHighlightReport(id);

    setHighlightReport(data);
  } catch (error) {
    console.error("Failed to load highlight report:", error);

    setHighlightError(
      error.response?.data?.detail ||
        "Unable to load highlight report."
    );
  } finally {
    setHighlightLoading(false);
  }
}

async function loadKeywords() {
  try {
    setKeywordsLoading(true);
    setKeywordError("");

    const data = await getKeywords(id);

    setKeywords(data);
  } catch (error) {
    console.error("Failed to load keywords:", error);

    setKeywordError(
      error.response?.data?.detail ||
        "Unable to load keywords."
    );
  } finally {
    setKeywordsLoading(false);
  }
}

async function handleSectionChange(section) {
  setActiveSection(section);

  if (section === "transcript") {
    await Promise.all([
      loadTranscript(),
      loadTranscriptSegments(),
    ]);
  }

  if (section === "summary") {
    await loadSummaries();
  }

  if (section === "keyMoments") {
    await loadOrGenerateKeyMoments();
  }

  if (section === "highlights") {
    await loadOrGenerateHighlights();
  }

  if (section === "keywords") {
  if (role !== "CONTENT_CREATOR") {
    return;
  }

  await loadOrGenerateKeywords();
}

}

async function loadOrGenerateKeyMoments() {
  try {
    setKeyMomentsLoading(true);
    setKeyMomentError("");

    const existingKeyMoments = await getKeyMoments(id);

    // If key moments already exist, everyone can view them
    if (
      existingKeyMoments &&
      existingKeyMoments.length > 0
    ) {
      setKeyMoments(existingKeyMoments);
      return existingKeyMoments;
    }

    // Learners can only view existing key moments
    if (role === "LEARNER") {
      setKeyMomentError(
        "Key moments have not been generated for this lecture yet."
      );

      return [];
    }

    // Authorized roles can generate key moments
    const generatedKeyMoments =
      await generateKeyMoments(id, 5);

    setKeyMoments(generatedKeyMoments);

    return generatedKeyMoments;

  } catch (error) {
    console.error(
      "Failed to load or generate key moments:",
      error
    );

    setKeyMomentError(
      error.response?.data?.detail ||
      "Unable to load key moments."
    );

    return [];

  } finally {
    setKeyMomentsLoading(false);
  }
}

const handleDownloadTranscript = async () => {
  try {
    const response = await downloadTranscript(id);

    const blob = new Blob(
      [response.data],
      { type: "text/plain" }
    );

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "transcript.txt";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error(
      "Failed to download transcript:",
      error
    );

    alert("Failed to download transcript.");
  }
};


const handleDownloadSummary = async (summaryType) => {
  try {
    const response = await downloadSummary(
      id,
      summaryType
    );

    const blob = new Blob(
      [response.data],
      { type: "text/plain" }
    );

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    const filename =
      summaryType === "short"
        ? "short_summary.txt"
        : "detailed_summary.txt";

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error(
      "Failed to download summary:",
      error
    );

    alert("Failed to download summary.");
  }
};


// ============================================================
// SHARE SUMMARY WITH CLASSROOM
// Educator only
// ============================================================

const handleShareSummary = async (summary) => {
  if (role !== "EDUCATOR") {
    return;
  }

  if (!summary?.id) {
    setShareError("Invalid summary selected.");
    return;
  }

  if (!selectedClassroomId) {
    setShareError(
      "Please select a classroom before sharing."
    );

    setShareMessage("");

    return;
  }

  try {
    setSharingSummaryId(summary.id);

    setShareError("");
    setShareMessage("");

    await shareSummary(
      summary.id,
      Number(selectedClassroomId)
    );

    setShareMessage(
      "Summary shared successfully with the classroom."
    );

  } catch (error) {
    console.error(
      "Failed to share summary:",
      error
    );

    setShareError(
      error.response?.data?.detail ||
      "Failed to share summary."
    );

  } finally {
    setSharingSummaryId(null);
  }
};

const handleBookmarkSummary = async (summary) => {
  if (role !== "LEARNER") {
    return;
  }

  if (!summary?.id) {
    alert("Unable to bookmark this summary.");
    return;
  }

  try {
    setBookmarkLoading(true);

    await createBookmark(
      "SUMMARY",
      summary.id
    );

    alert("Summary bookmarked successfully.");

  } catch (error) {
    console.error(
      "Failed to bookmark summary:",
      error
    );

    alert(
      error.response?.data?.detail ||
      "Failed to bookmark summary."
    );

  } finally {
    setBookmarkLoading(false);
  }
};


const handleBookmarkHighlights = async () => {
  if (role !== "LEARNER") {
    return;
  }

  if (!highlightReport) {
    alert("No highlight report available to bookmark.");
    return;
  }

  try {
    setBookmarkLoading(true);

    await createBookmark(
      "HIGHLIGHT",
      Number(id)
    );

    alert("Highlights bookmarked successfully.");

  } catch (error) {
    console.error(
      "Failed to bookmark highlights:",
      error
    );

    alert(
      error.response?.data?.detail ||
      "Failed to bookmark highlights."
    );

  } finally {
    setBookmarkLoading(false);
  }
};


  async function handleGenerateKeyMoments() {
    try {
      setGeneratingKeyMoments(true);
      setKeyMomentError("");

      const data = await generateKeyMoments(id, 5);

      setKeyMoments(data);
    } catch (error) {
      console.error("Failed to generate key moments:", error);

      setKeyMomentError(
        error.response?.data?.detail ||
          "Failed to generate key moments."
      );
    } finally {
      setGeneratingKeyMoments(false);
    }
  }

  const playKeyMoment = async (startTime) => {
  const videoElement = videoRef.current;

  if (!videoElement) {
    return;
  }

  const timestamp = Number(startTime);

  if (Number.isNaN(timestamp)) {
    console.error("Invalid key moment timestamp:", startTime);
    return;
  }

  videoElement.currentTime = timestamp;

  videoElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  try {
    await videoElement.play();
  } catch (error) {
    console.error(
      "Unable to automatically play video:",
      error
    );
  }
};

  async function loadOrGenerateKeywords() {
  try {
    setKeywordsLoading(true);
    setKeywordError("");

    const existingKeywords = await getKeywords(id);

    if (existingKeywords && existingKeywords.length > 0) {
      setKeywords(existingKeywords);
      return;
    }

    const generatedKeywords = await generateKeywords(id, 15);

    setKeywords(generatedKeywords);

  } catch (error) {
    console.error(
      "Failed to load or generate keywords:",
      error
    );

    setKeywordError(
      error.response?.data?.detail ||
      "Unable to load or generate keywords."
    );

  } finally {
    setKeywordsLoading(false);
  }
}


async function loadOrGenerateHighlights() {
  try {
    setHighlightLoading(true);
    setHighlightError("");

    console.log("Current user role:", role);

    // ----------------------------------------
    // LEARNER
    // Can only VIEW an existing highlight report
    // ----------------------------------------
    if (role === "LEARNER") {
      const report = await getHighlightReport(id);

      setHighlightReport(report);

      return;
    }

    // ----------------------------------------
    // CONTENT CREATOR / EDUCATOR / ADMIN
    // Can generate highlights
    // ----------------------------------------

    let moments = await getKeyMoments(id);

    if (!moments || moments.length === 0) {
      moments = await generateKeyMoments(id, 5);
      setKeyMoments(moments);
    }

    const report = await generateHighlightReport(id);

    setHighlightReport(report);

  } catch (error) {
    console.error(
      "Failed to load or generate highlight report:",
      error
    );

    setHighlightError(
      error.response?.data?.detail ||
      "Unable to load or generate highlight report."
    );

  } finally {
    setHighlightLoading(false);
  }
}


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh] text-xl font-semibold">
          Loading video details...
        </div>
      </DashboardLayout>
    );
  }

  if (!video) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800">
              Video not found
            </h2>

            <button
              onClick={() => router.push("/videos")}
              className="mt-6 px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold"
            >
              Back to My Videos
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Back Button */}

        <button
          onClick={() => router.push("/videos")}
          className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-lg transition"
        >
          ← Back to My Videos
        </button>


        {/* Video */}

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

          <video
            ref={videoRef}
            controls
            className="w-full h-[500px] bg-black"
            poster={`http://127.0.0.1:8000/${video.thumbnail_path?.replace(
              /\\/g,
              "/"
            )}`}
          >
            <source
              src={`http://127.0.0.1:8000/${video.filepath?.replace(
                /\\/g,
                "/"
              )}`}
              type="video/mp4"
            />

            Your browser does not support the video tag.
          </video>


          {/* Video Information */}

          <div className="p-8">

            <h1 className="text-3xl font-bold break-words text-slate-900">
              {video.filename}
            </h1>

            <div className="grid md:grid-cols-2 gap-8 mt-8">

              <div className="space-y-4">

                <p>
                  <strong>Video ID:</strong> {video.id}
                </p>

                <p>
                  <strong>Status:</strong>{" "}

                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                    {video.status}
                  </span>
                </p>

                <p>
                  <strong>Duration:</strong>{" "}
                  {Number(video.duration).toFixed(2)} seconds
                </p>

                <p>
                  <strong>File Size:</strong>{" "}
                  {(video.file_size / 1024 / 1024).toFixed(2)} MB
                </p>

              </div>


              <div className="space-y-4">

                <p>
                  <strong>Owner ID:</strong> {video.owner_id}
                </p>

                <p>
                  <strong>Uploaded On:</strong>
                  <br />

                  {new Date(
                    video.created_at
                  ).toLocaleString()}
                </p>

                <p className="break-all">
                  <strong>File Path:</strong>
                  <br />

                  {video.filepath}
                </p>

                <p className="break-all">
                  <strong>Audio Path:</strong>
                  <br />

                  {video.audio_path}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* AI ANALYSIS NAVIGATION */}

<div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">

  <h2 className="text-2xl font-bold text-slate-900">
    Video Analysis
  </h2>

  <p className="mt-2 text-slate-500">
    Select an option below to explore the AI-generated analysis.
  </p>

  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

    <button
      onClick={() => handleSectionChange("transcript")}
      className={`px-5 py-4 rounded-2xl font-semibold transition-all ${
        activeSection === "transcript"
          ? "bg-violet-600 text-white shadow-lg"
          : "bg-violet-50 text-violet-700 hover:bg-violet-100"
      }`}
    >
      📝 Transcript
    </button>

    <button
      onClick={() => handleSectionChange("summary")}
      className={`px-5 py-4 rounded-2xl font-semibold transition-all ${
        activeSection === "summary"
          ? "bg-emerald-600 text-white shadow-lg"
          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      }`}
    >
      🤖 AI Summaries
    </button>

    <button
      onClick={() => handleSectionChange("keyMoments")}
      className={`px-5 py-4 rounded-2xl font-semibold transition-all ${
        activeSection === "keyMoments"
          ? "bg-purple-600 text-white shadow-lg"
          : "bg-purple-50 text-purple-700 hover:bg-purple-100"
      }`}
    >
      ⭐ Key Moments
    </button>

    <button
      onClick={() => handleSectionChange("highlights")}
      className={`px-5 py-4 rounded-2xl font-semibold transition-all ${
        activeSection === "highlights"
          ? "bg-sky-600 text-white shadow-lg"
          : "bg-sky-50 text-sky-700 hover:bg-sky-100"
      }`}
    >
      🎯 Highlights
    </button>

    {role === "CONTENT_CREATOR" && (
  <button
    onClick={() => handleSectionChange("keywords")}
    className={`px-5 py-4 rounded-2xl font-semibold transition-all ${
      activeSection === "keywords"
        ? "bg-orange-600 text-white shadow-lg"
        : "bg-orange-50 text-orange-700 hover:bg-orange-100"
    }`}
  >
    🔑 Keywords
  </button>
)}

    

    

  </div>

</div>



       {/* TRANSCRIPT */}

{activeSection === "transcript" && (
  <div className="space-y-8">

    {/* Transcript */}

    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

  <div>
    <h2 className="text-3xl font-bold text-slate-900">
      Transcript
    </h2>

    <p className="mt-2 text-slate-500">
      AI-generated transcription of the uploaded video.
    </p>
  </div>

  {!transcriptLoading && transcript && (
  <div className="flex flex-wrap gap-3">

    {role === "EDUCATOR" && !isEditingTranscript && (
      <button
        onClick={handleEditTranscript}
        className="px-5 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition"
      >
        ✏️ Edit Transcript
      </button>
    )}

    {(role === "CONTENT_CREATOR" ||
      role === "EDUCATOR") &&
      !isEditingTranscript && (
      <button
        onClick={handleDownloadTranscript}
        className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition"
      >
        ⬇ Download Transcript
      </button>
    )}

  </div>
)}

</div>
<div className="mt-6">
  <div className="relative">
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search within transcript..."
      className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500"
    />

    {searchQuery && (
      <button
        type="button"
        onClick={() => setSearchQuery("")}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
      >
        ✕
      </button>
    )}
  </div>

  {searchQuery.trim() && (
    <p className="mt-2 text-sm text-slate-500">
      {searchMatchCount > 0
        ? `${searchMatchCount} match${searchMatchCount !== 1 ? "es" : ""} found`
        : "No matches found"}
    </p>
  )}
</div>

      {transcriptLoading && (
        <div className="mt-8 text-center py-10 text-slate-500">
          Loading transcript...
        </div>
      )}

      {transcriptError && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
          {transcriptError}
        </div>
      )}

      {!transcriptLoading &&
  !transcriptError &&
  transcript && (

  <div className="mt-8">

    {isEditingTranscript ? (

      <div className="space-y-4">

        <textarea
          value={editedTranscriptText}
          onChange={(e) =>
            setEditedTranscriptText(e.target.value)
          }
          className="w-full min-h-[400px] border border-slate-300 rounded-2xl p-5 text-slate-700 leading-8 resize-y focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="Edit transcript..."
          disabled={savingTranscript}
        />

        {saveTranscriptError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
            {saveTranscriptError}
          </div>
        )}

        <div className="flex flex-wrap gap-3">

          <button
            onClick={handleSaveTranscript}
            disabled={savingTranscript}
            className="px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {savingTranscript
              ? "Saving..."
              : "💾 Save Changes"}
          </button>

          <button
            onClick={handleCancelEditTranscript}
            disabled={savingTranscript}
            className="px-6 py-3 rounded-xl bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 disabled:opacity-50 transition"
          >
            Cancel
          </button>

        </div>

      </div>

    ) : (

      <div className="bg-slate-50 rounded-2xl p-6">

        <p className="text-slate-700 leading-8 whitespace-pre-wrap">
          {highlightSearchText(
            transcript.transcript_text,
            searchQuery
          )}
        </p>

      </div>

    )}

  </div>
)}

      {!transcriptLoading && !transcriptError && !transcript && (
        <div className="mt-8 text-center py-10 text-slate-500">
          No transcript available.
        </div>
      )}

    </div>



    {/* Transcript Segments */}

    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">

      <h2 className="text-3xl font-bold text-slate-900">
        Transcript Segments
      </h2>

      <p className="mt-2 text-slate-500">
        Timestamped segments extracted from the transcript.
      </p>

      {transcriptSegments.length === 0 ? (

        <div className="mt-8 text-center py-10 text-slate-500">
          No transcript segments available.
        </div>

      ) : (

        <div className="mt-8 space-y-4">

          {transcriptSegments.map((segment) => (

            <div
              key={segment.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200"
            >

              <div className="flex justify-between items-center mb-3">

                <span className="font-semibold text-violet-600">
                  Segment {segment.segment_index + 1}
                </span>

                <span className="text-sm text-slate-500">
                  {segment.start_time.toFixed(2)}s →{" "}
                  {segment.end_time.toFixed(2)}s
                </span>

              </div>

              <p className="text-slate-700 leading-7">
                {segment.segment_text}
              </p>

            </div>

          ))}

        </div>

      )}

    </div>

  </div>
)}



        {/* AI Summaries */}

{activeSection === "summary" && (
  <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">

    <h2 className="text-3xl font-bold text-slate-900">
      AI Summaries
    </h2>

    <p className="mt-2 text-slate-500">
      AI-generated summaries of this video.
    </p>

    {role === "EDUCATOR" && (
  <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
    <h3 className="font-bold text-violet-900">
      Share with Learners
    </h3>

    <p className="mt-1 text-sm text-violet-700">
      Select one of your classrooms. Learners enrolled
      in that classroom will be able to view the shared summary.
    </p>

    <select
      value={selectedClassroomId}
      onChange={(e) =>
        setSelectedClassroomId(e.target.value)
      }
      className="mt-4 w-full rounded-xl border border-violet-300 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
    >
      <option value="">
        Select a classroom
      </option>

      {classrooms.map((classroom) => (
        <option
          key={classroom.id}
          value={classroom.id}
        >
          {classroom.name}
        </option>
      ))}
    </select>

    {classrooms.length === 0 && (
      <p className="mt-3 text-sm text-red-600">
        You do not have any classrooms yet.
      </p>
    )}

    {shareMessage && (
      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
        {shareMessage}
      </div>
    )}

    {shareError && (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {shareError}
      </div>
    )}
  </div>
)}

    {summaryLoading ? (

      <div className="mt-8 text-center py-10 text-slate-500">
        Loading summaries...
      </div>

    ) : summaryError ? (

      <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
        {summaryError}
      </div>

    ) : (

      <div className="mt-8 space-y-6">

        {/* Short Summary */}

        {shortSummary && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">

            <h3 className="text-xl font-bold text-emerald-900">
              Short Summary
            </h3>

            <p className="mt-4 text-emerald-800 leading-8 whitespace-pre-wrap">
              {shortSummary.summary_text}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">

              {role === "EDUCATOR" && (
  <button
    onClick={() =>
      handleShareSummary(shortSummary)
    }
    disabled={
      sharingSummaryId === shortSummary.id
    }
    className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
  >
    {sharingSummaryId === shortSummary.id
      ? "Sharing..."
      : "📤 Share Short Summary"}
  </button>
)}

              {/* Learner: Bookmark only */}

              {role === "LEARNER" && (
                <button
                  onClick={() =>
                    handleBookmarkSummary(shortSummary)
                  }
                  disabled={bookmarkLoading}
                  className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
                >
                  🔖 {bookmarkLoading
                    ? "Saving..."
                    : "Bookmark Summary"}
                </button>
              )}

              {/* Content Creator: Download */}

              {role === "CONTENT_CREATOR" && (
                <button
                  onClick={() =>
                    handleDownloadSummary("short")
                  }
                  className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                >
                  ⬇ Download Short Summary
                </button>
              )}

            </div>

          </div>
        )}


        {/* Detailed Summary */}

        {detailedSummary && (
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6">

            <h3 className="text-xl font-bold text-sky-900">
              Detailed Summary
            </h3>

            <p className="mt-4 text-sky-800 leading-8 whitespace-pre-wrap">
              {detailedSummary.summary_text}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">

              {role === "EDUCATOR" && (
  <button
    onClick={() =>
      handleShareSummary(detailedSummary)
    }
    disabled={
      sharingSummaryId === detailedSummary.id
    }
    className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
  >
    {sharingSummaryId === detailedSummary.id
      ? "Sharing..."
      : "📤 Share Detailed Summary"}
  </button>
)}

              {/* Learner: Bookmark only */}

              {role === "LEARNER" && (
                <button
                  onClick={() =>
                    handleBookmarkSummary(detailedSummary)
                  }
                  disabled={bookmarkLoading}
                  className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
                >
                  🔖 {bookmarkLoading
                    ? "Saving..."
                    : "Bookmark Summary"}
                </button>
              )}

              {/* Content Creator: Download */}

              {role === "CONTENT_CREATOR" && (
                <button
                  onClick={() =>
                    handleDownloadSummary("detailed")
                  }
                  className="px-5 py-3 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
                >
                  ⬇ Download Detailed Summary
                </button>
              )}

            </div>

          </div>
        )}

      </div>
    )}

  </div>
)}

        {/* KEY MOMENTS */}

        {activeSection === "keyMoments" && (
  <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h2 className="text-3xl font-bold text-slate-900">
                Key Moments
              </h2>

              <p className="mt-2 text-slate-500">
                Important moments automatically detected from this video.
              </p>

            </div>
            

            {/* Generate Button */}

            {/* {keyMoments.length === 0 &&
              !keyMomentsLoading && (
                <button
                  onClick={handleGenerateKeyMoments}
                  disabled={generatingKeyMoments}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingKeyMoments
                    ? "Generating..."
                    : "Generate Key Moments"}
                </button>
              )} */}

          </div>


          {/* Error */}

          {keyMomentError && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
              {keyMomentError}
            </div>
          )}


          {/* Loading */}

          {keyMomentsLoading && (
            <div className="mt-8 text-center py-10 text-slate-500">
              Loading key moments...
            </div>
          )}


          {/* Empty */}

          {!keyMomentsLoading &&
            keyMoments.length === 0 &&
            !keyMomentError && (
              <div className="mt-8 bg-slate-50 rounded-2xl p-8 text-center">

                <p className="text-slate-500">
                  No key moments have been generated for this video yet.
                </p>

              </div>
            )}


          {/* Key Moment List */}

          {!keyMomentsLoading &&
            keyMoments.length > 0 && (
              <div className="mt-8 space-y-5">

                {keyMoments.map((moment, index) => (

                  <div
                    key={moment.id}
                    onClick={() => playKeyMoment(moment.start_time)}
                    className="border border-slate-200 rounded-2xl p-6 hover:border-violet-300 hover:shadow-md transition-all"
                  >

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                      <div className="flex gap-4">

                        <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>

                        <div>

                          <h3 className="text-xl font-bold text-slate-800">
                            {moment.title}
                          </h3>

                          <p className="mt-2 text-slate-600 leading-7">
                            {moment.segment_text}
                          </p>

                        </div>

                      </div>


                      <div className="flex-shrink-0">

                        <span className="inline-flex px-4 py-2 rounded-full bg-violet-100 text-violet-700 font-semibold text-sm">
                          Importance:{" "}
                          {Number(
                            moment.importance_score
                          ).toFixed(3)}
                        </span>

                      </div>

                    </div>


                    {/* Timestamp */}

                    <div className="mt-5 flex flex-wrap gap-3 text-sm">

                      <span className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                        {formatTime(moment.start_time)}
                      </span>

                      <span className="text-slate-400 flex items-center">
                        →
                      </span>

                      <span className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                        {formatTime(moment.end_time)}
                      </span>

                      <span className="px-4 py-2 rounded-lg bg-sky-100 text-sky-700 font-semibold">
                        Duration:{" "}
                        {(
                          moment.end_time -
                          moment.start_time
                        ).toFixed(1)}
                        s
                      </span>

                    </div>
                    <p className="mt-4 text-sm font-medium text-violet-600">
                      ▶ Click this key moment to play from {formatTime(moment.start_time)}
                    </p>

                  </div>

                ))}

              </div>
            )}

        </div>
            )}


        {/* HIGHLIGHT REPORT */}

            {activeSection === "highlights" && (
  <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

  <div>
    <h2 className="text-3xl font-bold text-slate-900">
      Highlight Report
    </h2>

    <p className="mt-2 text-slate-500">
      AI-generated highlights and important sections from this video.
    </p>
  </div>

  {role === "LEARNER" && highlightReport && (
    <button
      onClick={handleBookmarkHighlights}
      disabled={bookmarkLoading}
      className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 transition"
    >
      🔖 {bookmarkLoading
        ? "Saving..."
        : "Bookmark Highlights"}
    </button>
  )}

</div>


          {/* Loading */}

          {highlightLoading && (
            <div className="mt-8 text-center py-10 text-slate-500">
              Loading highlight report...
            </div>
          )}


          {/* Error */}

          {highlightError && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
              {highlightError}
            </div>
          )}


          {/* Highlight Report */}

          {!highlightLoading &&
            !highlightError &&
            highlightReport && (

              <div className="mt-8 space-y-6">

                {/* Summary */}

                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6">

                  <h3 className="text-xl font-bold text-violet-900">
                    AI Highlight Summary
                  </h3>

                  <p className="mt-3 text-violet-800 leading-7">
                    {highlightReport.summary}
                  </p>

                </div>


                {/* Total Highlights */}

                <div className="flex items-center gap-4">

                  <div className="px-5 py-3 rounded-xl bg-slate-100">

                    <span className="text-slate-500">
                      Total Highlights
                    </span>

                    <span className="ml-3 text-2xl font-bold text-slate-900">
                      {highlightReport.total_highlights}
                    </span>

                  </div>

                </div>


                {/* Highlights */}

                <div className="space-y-4">
              {highlightReport.highlights?.map((highlight, index) => (
    <div
      key={index}
      className="border border-slate-200 rounded-2xl p-6 hover:border-violet-300 hover:shadow-md transition-all"
    >
      <div className="flex gap-4 items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
          {index + 1}
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Highlight {index + 1}
          </h3>

          <p className="mt-2 text-slate-600 leading-7">
            {highlight}
          </p>
        </div>
      </div>
    </div>
  ))}
</div>


              </div>

            )}

                </div>
                )}

        {/* KEYWORDS */}

            {role === "CONTENT_CREATOR" &&
                activeSection === "keywords" && (
  <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Keywords
            </h2>

            <p className="mt-2 text-slate-500">
              Important keywords and phrases extracted from this video.
            </p>
          </div>


          {/* Loading */}

          {keywordsLoading && (
            <div className="mt-8 text-center py-10 text-slate-500">
              Loading keywords...
            </div>
          )}


          {/* Error */}

          {keywordError && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
              {keywordError}
            </div>
          )}


          {/* Empty */}

          {!keywordsLoading &&
            keywords.length === 0 &&
            !keywordError && (
              <div className="mt-8 bg-slate-50 rounded-2xl p-8 text-center">

                <p className="text-slate-500">
                  No keywords have been extracted for this video yet.
                </p>

              </div>
            )}


          {/* Keyword List */}

          {!keywordsLoading &&
            keywords.length > 0 && (

              <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">

                {keywords.map((item, index) => (

                  <div
                    key={item.id ?? index}
                    className="border border-slate-200 rounded-2xl p-6 hover:border-violet-300 hover:shadow-md transition-all"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <span className="text-xs font-semibold text-slate-400">
                          #{index + 1}
                        </span>

                        <h3 className="mt-1 text-xl font-bold text-slate-800">
                          {item.keyword}
                        </h3>

                      </div>

                      <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold">
                        {Number(item.relevance_score).toFixed(3)}
                      </span>

                    </div>


                    <div className="mt-5 flex justify-between items-center">

                      <span className="text-slate-500">
                        Frequency
                      </span>

                      <span className="font-bold text-slate-800">
                        {item.frequency}
                      </span>

                    </div>


                    <div className="mt-3 flex justify-between items-center">

                      <span className="text-slate-500">
                        Relevance
                      </span>

                      <span className="font-semibold text-violet-600">
                        {Number(item.relevance_score).toFixed(3)}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            )}

        </div>
        )}


      </div>
    </DashboardLayout>
      
  );
}


/**
 * Convert seconds into MM:SS or HH:MM:SS
 */
function formatTime(seconds) {
  const totalSeconds = Math.floor(Number(seconds));

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const remainingSeconds =
    totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function highlightSearchText(text, searchQuery) {
  if (!searchQuery || !searchQuery.trim()) {
    return text;
  }

  const escapedQuery = searchQuery.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(`(${escapedQuery})`, "gi");

  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch =
      part.toLowerCase() === searchQuery.toLowerCase();

    return isMatch ? (
      <mark
        key={index}
        className="bg-yellow-300 text-slate-900 px-1 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    );
  });
}









