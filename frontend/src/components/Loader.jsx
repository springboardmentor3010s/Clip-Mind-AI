import React from "react";

function Loader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "60px",
          height: "60px",
          border: "8px solid #e5e7eb",
          borderTop: "8px solid #2563eb",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      ></div>

      <style>
        {`
          @keyframes spin {
            0%{
              transform:rotate(0deg);
            }

            100%{
              transform:rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

export default Loader;