"use client";

import { useEffect, useState } from "react";
import {
  getAdminVideos,
  deleteAdminVideo,
} from "@/services/admin";

export default function ManageVideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminVideos();

      setVideos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load videos."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this video? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(videoId);
      setError("");
      setSuccess("");

      await deleteAdminVideo(videoId);

      setVideos((previousVideos) =>
        previousVideos.filter(
          (video) => video.id !== videoId
        )
      );

      setSuccess(
        "Video deleted successfully."
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to delete video."
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* Header */}

      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Manage Videos 🎥
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          View uploaded videos and manage platform content.
        </p>
      </div>

      {/* Error */}

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            borderRadius: "10px",
            background: "#451A1A",
            border: "1px solid #7F1D1D",
            color: "#FCA5A5",
          }}
        >
          {error}
        </div>
      )}

      {/* Success */}

      {success && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            borderRadius: "10px",
            background: "#064E3B",
            border: "1px solid #047857",
            color: "#A7F3D0",
          }}
        >
          {success}
        </div>
      )}

      {/* Videos */}

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
          overflowX: "auto",
        }}
      >
        {loading ? (
          <p
            style={{
              color: "#94A3B8",
              padding: "20px",
            }}
          >
            Loading videos...
          </p>
        ) : videos.length === 0 ? (
          <p
            style={{
              color: "#94A3B8",
              padding: "20px",
            }}
          >
            No uploaded videos found.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>File</th>
                <th style={thStyle}>Original Name</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Uploaded By</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {videos.map((video) => (
                <tr key={video.id}>
                  <td style={tdStyle}>
                    {video.id}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      maxWidth: "280px",
                      wordBreak: "break-all",
                    }}
                  >
                    {video.filename}
                  </td>

                  <td style={tdStyle}>
                    {video.original_filename}
                  </td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "7px 12px",
                        borderRadius: "8px",
                        background:
                          video.status === "Completed"
                            ? "#065F46"
                            : video.status === "Failed"
                            ? "#7F1D1D"
                            : "#334155",
                        color: "white",
                        fontSize: "14px",
                      }}
                    >
                      {video.status}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    {video.uploaded_by}
                  </td>

                  <td style={tdStyle}>
                    <button
                      onClick={() =>
                        handleDelete(video.id)
                      }
                      disabled={
                        deleting === video.id
                      }
                      style={{
                        padding: "9px 15px",
                        borderRadius: "8px",
                        border: "none",
                        background:
                          deleting === video.id
                            ? "#475569"
                            : "#DC2626",
                        color: "white",
                        cursor:
                          deleting === video.id
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: "600",
                      }}
                    >
                      {deleting === video.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left" as const,
  padding: "14px",
  borderBottom: "1px solid #475569",
  color: "#CBD5E1",
};

const tdStyle = {
  padding: "16px 14px",
  borderBottom: "1px solid #334155",
  color: "#E2E8F0",
};