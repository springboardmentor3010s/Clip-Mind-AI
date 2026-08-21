import { useState } from "react";

function SummaryCard({ shortSummary, detailedSummary }) {
  const [activeTab, setActiveTab] = useState("short");

  // Robust Text Sanitizer Function
  const cleanContent = (text, type) => {
    if (!text) return "";
    let str = text;

    // If string contains both delimiters due to old cache, split them correctly
    if (str.includes("===DETAILED SUMMARY===")) {
      const parts = str.split("===DETAILED SUMMARY===");
      if (type === "short") {
        str = parts[0].replace("===SHORT SUMMARY===", "");
      } else {
        str = parts[1];
      }
    } else if (str.includes("===SHORT SUMMARY===")) {
      str = str.replace("===SHORT SUMMARY===", "");
    }

    return str
      .replace(/Short Summary:?/gi, "")
      .replace(/Detailed Summary:?/gi, "")
      .replace(/\*\*/g, "")
      .replace(/^\+\s*/gm, "• ")
      .trim();
  };

  // Fallback to detailedSummary if shortSummary is missing, and vice-versa
  const rawShort = shortSummary || detailedSummary || "";
  const rawDetailed = detailedSummary || shortSummary || "";

  const cleanShort = cleanContent(rawShort, "short");
  const cleanDetailed = cleanContent(rawDetailed, "detailed");

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb"
      }}
    >
      <div
        style={{
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          borderBottom: "2px solid #f1f5f9",
          paddingBottom: "12px",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        <h2 style={{ color: "#2563eb", margin: 0, fontSize: "22px" }}>
          AI Generated Summary
        </h2>

        {/* Tab Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setActiveTab("short")}
            style={{
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "short" ? "#2563eb" : "#f1f5f9",
              color: activeTab === "short" ? "#ffffff" : "#475569",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease",
              boxShadow: activeTab === "short" ? "0 2px 6px rgba(37,99,235,0.3)" : "none"
            }}
          >
            ⚡ Short Summary
          </button>

          <button
            onClick={() => setActiveTab("detailed")}
            style={{
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "detailed" ? "#2563eb" : "#f1f5f9",
              color: activeTab === "detailed" ? "#ffffff" : "#475569",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease",
              boxShadow: activeTab === "detailed" ? "0 2px 6px rgba(37,99,235,0.3)" : "none"
            }}
          >
            📄 Detailed Summary
          </button>
        </div>
      </div>

      {/* Render Selected Tab Exclusively */}
      <div
        style={{
          fontSize: "15.5px",
          lineHeight: "28px",
          color: "#1e293b",
          whiteSpace: "pre-wrap",
          minHeight: "120px",
          padding: "10px 5px"
        }}
      >
        {activeTab === "short" ? (
          <div
            style={{
              background: "#f8fafc",
              padding: "18px",
              borderRadius: "8px",
              borderLeft: "4px solid #2563eb"
            }}
          >
            <p style={{ margin: 0, fontWeight: "500", color: "#1e293b" }}>
              {cleanShort || "No short summary available."}
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#f8fafc",
              padding: "18px",
              borderRadius: "8px",
              borderLeft: "4px solid #16a34a"
            }}
          >
            <div style={{ margin: 0, color: "#1e293b" }}>
              {cleanDetailed || "No detailed summary available."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SummaryCard;