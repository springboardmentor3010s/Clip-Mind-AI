"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { uploadVideo } from "@/services/video";
import { getMyClassrooms } from "@/services/classroom";

interface Classroom {
  id: number;
  name: string;
  code: string;
  student_count?: number;
}

interface UploadedVideo {
  id: number;
  filename: string;
  original_filename: string;
  status: string;
}

export default function UploadVideo() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] =
    useState<number | "">("");

  const [loadingClassrooms, setLoadingClassrooms] =
    useState(true);

  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");

  const [uploadedVideo, setUploadedVideo] =
    useState<UploadedVideo | null>(null);

  // -----------------------------------------
  // LOAD EDUCATOR CLASSROOMS
  // -----------------------------------------

  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        setLoadingClassrooms(true);

        const data = await getMyClassrooms();

        console.log(
          "EDUCATOR CLASSROOMS:",
          data
        );

        if (Array.isArray(data)) {
          setClassrooms(data);
        } else {
          setClassrooms([]);
        }
      } catch (error: any) {
        console.error(
          "Error loading classrooms:",
          error
        );

        setMessage(
          error?.response?.data?.detail ||
            "Unable to load classrooms."
        );
      } finally {
        setLoadingClassrooms(false);
      }
    };

    loadClassrooms();
  }, []);

  // -----------------------------------------
  // UPLOAD VIDEO
  // -----------------------------------------

  const handleUpload = async () => {
    setMessage("");

    if (!file) {
      setMessage("❌ Please select a video.");
      return;
    }

    if (selectedClassroomId === "") {
      setMessage(
        "❌ Please select a classroom first."
      );
      return;
    }

    try {
      setUploading(true);

      const response = await uploadVideo(
        file,
        Number(selectedClassroomId)
      );

      console.log(
        "UPLOAD RESPONSE:",
        response
      );

      setUploadedVideo({
        id: response.id,
        filename: response.filename,
        original_filename:
          response.original_filename,
        status: response.status,
      });

      setMessage(
        `✅ Video uploaded successfully: ${response.original_filename}`
      );

      setFile(null);
    } catch (error: any) {
      console.error(
        "Video upload error:",
        error
      );

      setMessage(
        error?.response?.data?.detail ||
          "❌ Upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <div
      style={{
        padding: "30px",
        color: "white",
        maxWidth: "800px",
      }}
    >
      {/* Header */}

      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          marginBottom: "8px",
        }}
      >
        📤 Upload Lecture
      </h1>

      <p
        style={{
          color: "#94A3B8",
          marginBottom: "30px",
          fontSize: "16px",
        }}
      >
        Upload a lecture and assign it to one
        of your classrooms.
      </p>

      {/* ----------------------------------- */}
      {/* CLASSROOM SELECTION */}
      {/* ----------------------------------- */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "25px",
          marginBottom: "25px",
        }}
      >
        <h2
          style={{
            fontSize: "21px",
            marginBottom: "10px",
          }}
        >
          🏫 Select Classroom
        </h2>

        <p
          style={{
            color: "#94A3B8",
            marginBottom: "15px",
          }}
        >
          Choose which classroom should receive
          this lecture.
        </p>

        <select
          value={selectedClassroomId}
          onChange={(e) => {
            setSelectedClassroomId(
              e.target.value === ""
                ? ""
                : Number(e.target.value)
            );

            setMessage("");
          }}
          disabled={loadingClassrooms}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #475569",
            background: "#273449",
            color: "white",
            fontSize: "16px",
            outline: "none",
          }}
        >
          <option value="">
            {loadingClassrooms
              ? "Loading classrooms..."
              : "Select a classroom"}
          </option>

          {classrooms.map(
            (classroom) => (
              <option
                key={classroom.id}
                value={classroom.id}
              >
                {classroom.name} —{" "}
                {classroom.code}
              </option>
            )
          )}
        </select>

        {!loadingClassrooms &&
          classrooms.length === 0 && (
            <p
              style={{
                marginTop: "15px",
                color: "#FCA5A5",
              }}
            >
              You don't have any classrooms yet.
              Create a classroom before uploading
              a lecture.
            </p>
          )}
      </div>

      {/* ----------------------------------- */}
      {/* VIDEO SELECTION */}
      {/* ----------------------------------- */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "25px",
        }}
      >
        <h2
          style={{
            fontSize: "21px",
            marginBottom: "15px",
          }}
        >
          🎥 Select Lecture Video
        </h2>

        <input
          id="videoFile"
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            if (
              e.target.files &&
              e.target.files.length > 0
            ) {
              setFile(
                e.target.files[0]
              );

              setMessage("");
              setUploadedVideo(null);
            }
          }}
        />

        <label
          htmlFor="videoFile"
          style={{
            display: "inline-block",
            padding: "12px 20px",
            background: "#2563EB",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          📂 Choose Video
        </label>

        {file && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              background: "#0F172A",
              borderRadius: "8px",
              color: "#38BDF8",
            }}
          >
            Selected: {file.name}
          </div>
        )}

        {/* Upload Button */}

        <button
          onClick={handleUpload}
          disabled={
            uploading ||
            loadingClassrooms ||
            classrooms.length === 0
          }
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "14px",
            border: "none",
            borderRadius: "10px",
            background:
              uploading ||
              loadingClassrooms ||
              classrooms.length === 0
                ? "#475569"
                : "#22C55E",
            color: "white",
            cursor:
              uploading ||
              loadingClassrooms ||
              classrooms.length === 0
                ? "not-allowed"
                : "pointer",
            fontSize: "16px",
            fontWeight: "700",
          }}
        >
          {uploading
            ? "Uploading..."
            : "🚀 Upload Lecture"}
        </button>

        {/* Message */}

        {message && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              borderRadius: "10px",
              background: "#0F172A",
              color: "#CBD5E1",
            }}
          >
            {message}
          </div>
        )}
      </div>

      {/* ----------------------------------- */}
      {/* UPLOADED VIDEO */}
      {/* ----------------------------------- */}

      {uploadedVideo && (
        <div
          style={{
            marginTop: "30px",
            background: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "16px",
            padding: "25px",
          }}
        >
          <h2
            style={{
              color: "#38BDF8",
              marginBottom: "15px",
            }}
          >
            🎥 Uploaded Lecture
          </h2>

          <video
            controls
            style={{
              width: "100%",
              maxHeight: "450px",
              borderRadius: "12px",
              backgroundColor: "#000",
            }}
          >
            <source
              src={`http://127.0.0.1:8000/videos/stream/${uploadedVideo.filename}`}
              type="video/mp4"
            />

            Your browser does not support
            the video tag.
          </video>

          <p
            style={{
              marginTop: "10px",
              color: "#CBD5E1",
            }}
          >
            {uploadedVideo.original_filename}
          </p>

          <div
            style={{
              marginTop: "15px",
              padding: "12px 16px",
              background: "#0F172A",
              borderRadius: "10px",
              color: "#22C55E",
              fontWeight: "600",
            }}
          >
            ⚙️ Processing Status:{" "}
            {uploadedVideo.status}
          </div>

          {/* Actions */}

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <button
              onClick={() =>
                router.push(
                  `/dashboard/transcript?videoId=${uploadedVideo.id}`
                )
              }
              style={{
                padding: "12px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#2563EB",
                color: "white",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              📝 View Transcript
            </button>

            <button
              onClick={() =>
                router.push(
                  `/dashboard/summary?videoId=${uploadedVideo.id}`
                )
              }
              style={{
                padding: "12px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#7C3AED",
                color: "white",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              🤖 View Summary
            </button>

            <button
              onClick={() =>
                router.push(
                  `/dashboard/keywords?videoId=${uploadedVideo.id}`
                )
              }
              style={{
                padding: "12px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#0EA5E9",
                color: "white",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              🏷 View Keywords
            </button>

            <button
              onClick={() =>
                router.push(
                  `/dashboard/key-moments?videoId=${uploadedVideo.id}`
                )
              }
              style={{
                padding: "12px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#EAB308",
                color: "white",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              ⭐ View Key Moments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}