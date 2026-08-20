import React from "react";

function KeyMomentsCard({ keyMoments }) {
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
      <h2>Important Key Moments</h2>

      <hr />

      <pre
        style={{
          whiteSpace: "pre-wrap",
          marginTop: "20px",
          lineHeight: "28px",
          fontSize: "16px",
        }}
      >
        {keyMoments}
      </pre>
    </div>
  );
}

export default KeyMomentsCard;