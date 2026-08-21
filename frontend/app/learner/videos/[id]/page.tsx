"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getClassroomVideos } from "@/services/classroom";

interface ClassroomVideo {
  id: number;
  filename: string;
  original_filename: string;
  status: string;
  classroom_id: number;
  transcript_available: boolean;
  summary_available: boolean;
}

export default function LearnerVideoPage() {
  const params = useParams();
  const router = useRouter();

  const videoId = Number(params.id);

  const [video, setVideo] =
    useState<ClassroomVideo | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!videoId || Number.isNaN(videoId)) {
      setError("Invalid video.");
      setLoading(false);
      return;
    }

    const loadVideo = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * The classroom ID is already stored
         * inside the video record.
         *
         * We currently know the learner opens
         * the video from a classroom page, so
         * first get the learner's classrooms.
         */

        const classrooms =
          await import("@/services/classroom").then(
            (module) =>
              module.getMyJoinedClassrooms()
          );

        let foundVideo: ClassroomVideo | null =
          null;

        for (const classroom of classrooms) {
          const videos =
            await getClassroomVideos(classroom.id);

          const matchingVideo = videos.find(
            (item: ClassroomVideo) =>
              item.id === videoId
          );

          if (matchingVideo) {
            foundVideo = matchingVideo;
            break;
          }
        }

        if (!foundVideo) {
          setError(
            "This lecture could not be found."
          );
          return;
        }

        setVideo(foundVideo);
      } catch (err: any) {
        console.error(
          "Error loading video:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load lecture."
        );
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId]);

  if (loading) {
    return (
      <div
        style={{
          color: "white",
          padding: "40px",
          fontSize: "18px",
        }}
      >
        Loading lecture...
      </div>
    );
  }

  if (error || !video) {
    return (
      <div
        style={{
          color: "white",
          padding: "40px",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "none",
            color: "#94A3B8",
            cursor: "pointer",
            fontSize: "15px",
            marginBottom: "25px",
          }}
        >
          ← Back
        </button>

        <div
          style={{
            background: "#451A1A",
            border: "1px solid #7F1D1D",
            color: "#FCA5A5",
            padding: "18px",
            borderRadius: "12px",
          }}
        >
          {error || "Lecture not found."}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "35px",
      }}
    >
      {/* Back button */}

      <button
        onClick={() => router.back()}
        style={{
          background: "transparent",
          border: "none",
          color: "#94A3B8",
          cursor: "pointer",
          fontSize: "15px",
          marginBottom: "25px",
        }}
      >
        ← Back to Classroom
      </button>

      {/* Header */}

      <div
        style={{
          marginBottom: "25px",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          🎥 {video.original_filename}
        </h1>

        <p
          style={{
            color: "#94A3B8",
          }}
        >
          Lecture Status:{" "}
          <span
            style={{
              color: "#22C55E",
              fontWeight: "600",
            }}
          >
            {video.status}
          </span>
        </p>
      </div>

      {/* Video */}

      <div
        style={{
          background: "#0F172A",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "20px",
          maxWidth: "1000px",
        }}
      >
        <video
          controls
          style={{
            width: "100%",
            maxHeight: "600px",
            borderRadius: "12px",
            background: "#000",
          }}
        >
          <source
            src={`http://127.0.0.1:8000/videos/stream/${video.filename}`}
            type="video/mp4"
          />

          Your browser does not support the video
          tag.
        </video>
      </div>

      {/* AI Features */}

      <div
        style={{
          marginTop: "30px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          maxWidth: "1000px",
        }}
      >
        {/* Transcript */}

        {video.transcript_available && (
          <div
            style={{
              background: "#0F172A",
              border: "1px solid #164E63",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "19px",
                marginBottom: "8px",
              }}
            >
              📝 Transcript
            </h3>

            <p
              style={{
                color: "#94A3B8",
                marginBottom: "15px",
              }}
            >
              Read the complete lecture transcript.
            </p>

            <button
              onClick={() =>
                router.push(
                  `/dashboard/transcript?videoId=${video.id}`
                )
              }
              style={{
                padding: "10px 15px",
                border: "none",
                borderRadius: "8px",
                background: "#0891B2",
                color: "white",
                cursor: "pointer",
              }}
            >
              View Transcript
            </button>
          </div>
        )}

        {/* Summary */}

        {video.summary_available && (
          <div
            style={{
              background: "#0F172A",
              border: "1px solid #4C1D95",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "19px",
                marginBottom: "8px",
              }}
            >
              🤖 AI Summary
            </h3>

            <p
              style={{
                color: "#94A3B8",
                marginBottom: "15px",
              }}
            >
              Get a quick AI-generated summary.
            </p>

            <button
              onClick={() =>
                router.push(
                  `/dashboard/summary?videoId=${video.id}`
                )
              }
              style={{
                padding: "10px 15px",
                border: "none",
                borderRadius: "8px",
                background: "#7C3AED",
                color: "white",
                cursor: "pointer",
              }}
            >
              View Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}