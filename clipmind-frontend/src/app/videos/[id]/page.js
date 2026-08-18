"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  getVideoById,
  getTranscript,
  getTranscriptSegments,
  getSummary,
  downloadTranscript,
  downloadSummary,
  getKeyMoments,
  generateKeyMoments,
  getHighlightReport,
  getKeywords,
} from "@/services/videoService";

export default function VideoDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [video, setVideo] = useState(null);

  const [transcript, setTranscript] = useState(null);
  const [transcriptSegments, setTranscriptSegments] = useState([]);

  const [shortSummary, setShortSummary] = useState(null);
  const [detailedSummary, setDetailedSummary] = useState(null);

  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [transcriptError, setTranscriptError] = useState("");
  const [summaryError, setSummaryError] = useState("");

  const [keyMoments, setKeyMoments] = useState([]);
  const [highlightReport, setHighlightReport] = useState(null);
  const [keywords, setKeywords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [keyMomentsLoading, setKeyMomentsLoading] = useState(true);
  const [highlightLoading, setHighlightLoading] = useState(true);
  const [keywordsLoading, setKeywordsLoading] = useState(true);

  const [generatingKeyMoments, setGeneratingKeyMoments] = useState(false);

  const [keyMomentError, setKeyMomentError] = useState("");
  const [highlightError, setHighlightError] = useState("");
  const [keywordError, setKeywordError] = useState("");

  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
  if (id) {
    loadVideo();
    loadTranscript();
    loadTranscriptSegments();
    loadSummaries();
    loadKeyMoments();
    loadHighlightReport();
    loadKeywords();
  }
}, [id]);

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
      onClick={() => setActiveSection("transcript")}
      className={`px-5 py-4 rounded-2xl font-semibold transition-all ${
        activeSection === "transcript"
          ? "bg-violet-600 text-white shadow-lg"
          : "bg-violet-50 text-violet-700 hover:bg-violet-100"
      }`}
    >
      📝 Transcript
    </button>

    <button
      onClick={() => setActiveSection("summary")}
      className={`px-5 py-4 rounded-2xl font-semibold transition-all ${
        activeSection === "summary"
          ? "bg-emerald-600 text-white shadow-lg"
          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      }`}
    >
      🤖 AI Summaries
    </button>

    <button
      onClick={() => setActiveSection("keyMoments")}
      className={`px-5 py-4 rounded-2xl font-semibold transition-all ${
        activeSection === "keyMoments"
          ? "bg-purple-600 text-white shadow-lg"
          : "bg-purple-50 text-purple-700 hover:bg-purple-100"
      }`}
    >
      ⭐ Key Moments
    </button>

    <button
      onClick={() => setActiveSection("highlights")}
      className={`px-5 py-4 rounded-2xl font-semibold transition-all ${
        activeSection === "highlights"
          ? "bg-sky-600 text-white shadow-lg"
          : "bg-sky-50 text-sky-700 hover:bg-sky-100"
      }`}
    >
      🎯 Highlights
    </button>

    <button
      onClick={() => setActiveSection("keywords")}
      className={`px-5 py-4 rounded-2xl font-semibold transition-all ${
        activeSection === "keywords"
          ? "bg-orange-600 text-white shadow-lg"
          : "bg-orange-50 text-orange-700 hover:bg-orange-100"
      }`}
    >
      🔑 Keywords
    </button>

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
    <button
      onClick={handleDownloadTranscript}
      className="px-5 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition"
    >
      ⬇ Download Transcript
    </button>
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

      {!transcriptLoading && !transcriptError && transcript && (
        <div className="mt-8 bg-slate-50 rounded-2xl p-6">

          <p className="text-slate-700 leading-8 whitespace-pre-wrap">
            {transcript.transcript_text}
          </p>

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

    <button
      onClick={() => handleDownloadSummary("short")}
      className="mt-4 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
    >
      ⬇ Download Short Summary
    </button>

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

    <button
      onClick={() => handleDownloadSummary("detailed")}
      className="mt-4 px-5 py-3 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition"
    >
      ⬇ Download Detailed Summary
    </button>

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

            {keyMoments.length === 0 &&
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
              )}

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

                  </div>

                ))}

              </div>
            )}

        </div>
            )}


        {/* HIGHLIGHT REPORT */}

            {activeSection === "highlights" && (
  <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Highlight Report
            </h2>

            <p className="mt-2 text-slate-500">
              AI-generated highlights and important sections from this video.
            </p>
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

                {highlightReport.highlights?.map(
                  (highlight, index) => (

                    <div
                      key={index}
                      className="border border-slate-200 rounded-2xl p-6 hover:border-violet-300 hover:shadow-md transition-all"
                    >

                      <div className="flex flex-col md:flex-row md:justify-between gap-4">

                        <div>

                          <h3 className="text-xl font-bold text-slate-800">
                            {highlight.title}
                          </h3>

                          <p className="mt-3 text-slate-600 leading-7">
                            {highlight.segment_text}
                          </p>

                        </div>


                        <span className="flex-shrink-0 h-fit px-4 py-2 rounded-full bg-violet-100 text-violet-700 font-semibold text-sm">
                          Importance:{" "}
                          {Number(
                            highlight.importance_score
                          ).toFixed(3)}
                        </span>

                      </div>


                      {/* Timestamp */}

                      <div className="mt-5 flex flex-wrap gap-3">

                        <span className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                          {formatTime(highlight.start_time)}
                        </span>

                        <span className="flex items-center text-slate-400">
                          →
                        </span>

                        <span className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                          {formatTime(highlight.end_time)}
                        </span>

                        <span className="px-4 py-2 rounded-lg bg-sky-100 text-sky-700 font-semibold">
                          Duration:{" "}
                          {Number(
                            highlight.duration ??
                            highlight.end_time - highlight.start_time
                          ).toFixed(1)}
                          s
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

                </div>
                )}

        {/* KEYWORDS */}

            {activeSection === "keywords" && (
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

