"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import {
  getTranscript,
  getVideo,
  updateTranscript,
} from "@/services/video";

import VideoPlayer from "@/components/Dashboard/VideoPlayer";
import { useAuth } from "@/context/AuthContext";

export default function TranscriptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { user } = useAuth();
  console.log("TRANSCRIPT USER:", user);
  console.log("TRANSCRIPT USER ROLE:", user?.role);

  const [transcript, setTranscript] = useState("Loading...");
  const [videoName, setVideoName] = useState("");
  const [videoFilename, setVideoFilename] = useState("");
  const [videoId, setVideoId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const isEducator = user?.role === "educator";

  useEffect(() => {
    const id = searchParams.get("videoId");

    if (!id) {
      setTranscript("No video selected.");
      return;
    }

    const numericId = Number(id);

    if (isNaN(numericId)) {
      setTranscript("Invalid video ID.");
      return;
    }

    setVideoId(numericId);

    const loadTranscript = async () => {
      try {
        console.log(
          "Loading video details for:",
          numericId
        );

        const video = await getVideo(numericId);

        setVideoName(
          video.original_filename || ""
        );

        setVideoFilename(
          video.filename || ""
        );

        const data =
          await getTranscript(numericId);

        const loadedTranscript =
          data.transcript ||
          "Transcript not available.";

        setTranscript(loadedTranscript);
        setEditedTranscript(loadedTranscript);

      } catch (error) {
        console.error(
          "Transcript Error:",
          error
        );

        setTranscript(
          "Failed to load transcript."
        );

        setEditedTranscript("");
      }
    };

    loadTranscript();
  }, [searchParams]);

  const downloadTranscript = () => {
    const blob = new Blob(
      [transcript],
      { type: "text/plain" }
    );

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `${videoName || "transcript"}.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  const goToSummary = () => {
    if (!videoId) return;

    router.push(
      `/dashboard/summary?videoId=${videoId}`
    );
  };

  const startEditing = () => {
    setEditedTranscript(transcript);
    setIsEditing(true);
    setSaveMessage("");
  };

  const cancelEditing = () => {
    setEditedTranscript(transcript);
    setIsEditing(false);
    setSaveMessage("");
  };

  const saveTranscript = async () => {
    if (!videoId) return;

    if (!editedTranscript.trim()) {
      setSaveMessage(
        "Transcript cannot be empty."
      );
      return;
    }

    try {
      setSaving(true);
      setSaveMessage("");

      await updateTranscript(
        videoId,
        editedTranscript
      );

      setTranscript(editedTranscript);
      setIsEditing(false);

      setSaveMessage(
        "Transcript updated successfully."
      );

    } catch (error) {
      console.error(
        "Failed to update transcript:",
        error
      );

      setSaveMessage(
        "Failed to update transcript."
      );

    } finally {
      setSaving(false);
    }
  };

  const highlightText = (
    text: string,
    term: string
  ) => {
    if (!term.trim()) {
      return text;
    }

    const parts = text.split(
      new RegExp(`(${term})`, "gi")
    );

    return parts.map((part, index) =>
      part.toLowerCase() ===
      term.toLowerCase() ? (
        <mark
          key={index}
          className="bg-yellow-300 text-black px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        <span key={index}>
          {part}
        </span>
      )
    );
  };

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        📝 Transcript
      </h1>

      {videoFilename && (
        <VideoPlayer
          filename={videoFilename}
          videoName={videoName}
        />
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">

        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">

          <h2 className="font-semibold text-lg text-black">
            {videoName}
          </h2>

          {isEducator && !isEditing && (
            <button
              onClick={startEditing}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow transition"
            >
              ✏️ Edit Transcript
            </button>
          )}

        </div>

        {/* Search */}
        {!isEditing && (
          <div className="mb-6">

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🔍 Search within Transcript
            </h3>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              placeholder="Search for a keyword or phrase..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {searchTerm.trim() && (
              <p className="mt-2 text-sm text-gray-500">
                Searching for: "{searchTerm}"
              </p>
            )}

          </div>
        )}

        {/* Transcript */}
        {isEditing ? (
          <div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              ✏️ Edit Transcript
            </h3>

            <textarea
              value={editedTranscript}
              onChange={(e) =>
                setEditedTranscript(
                  e.target.value
                )
              }
              className="w-full min-h-[400px] p-4 border border-gray-300 rounded-lg text-black leading-8 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Edit the transcript here..."
            />

            <div className="mt-4 flex gap-3">

              <button
                onClick={saveTranscript}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg shadow transition"
              >
                {saving
                  ? "Saving..."
                  : "💾 Save Changes"}
              </button>

              <button
                onClick={cancelEditing}
                disabled={saving}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg shadow transition"
              >
                Cancel
              </button>

            </div>

          </div>
        ) : (
          <div className="whitespace-pre-wrap leading-8 text-black">
            {highlightText(
              transcript,
              searchTerm
            )}
          </div>
        )}

        {/* Save message */}
        {saveMessage && (
          <p
            className={`mt-4 text-sm font-semibold ${
              saveMessage.includes(
                "successfully"
              )
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {saveMessage}
          </p>
        )}

        {/* Bottom buttons */}
        <div className="mt-6 flex justify-between items-center gap-4 flex-wrap">

          <button
            onClick={goToSummary}
            disabled={!videoId || isEditing}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg shadow transition"
          >
            🤖 View Summary →
          </button>

          <button
            onClick={downloadTranscript}
            disabled={isEditing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg shadow transition"
          >
            ⬇ Download Transcript
          </button>

        </div>

      </div>

    </div>
  );
}
