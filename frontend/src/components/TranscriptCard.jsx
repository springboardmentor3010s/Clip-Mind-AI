import React from "react";

function TranscriptCard({ transcript }) {
  return (
    <div
      style={{
        background: "#ffffff",
        padding: "25px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,.1)",
        marginTop: "20px",
      }}
    >
      <h2>Generated Transcript</h2>

      <hr />

      <div
        style={{
          marginTop: "20px",
          maxHeight: "500px",
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          lineHeight: "28px",
          fontSize: "16px",
        }}
      >
        {transcript}
      </div>
    </div>
  );
}

export default TranscriptCard;