export default function Footer() {
  return (
    <footer
      style={{
        background: "#111827",
        color: "white",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#38bdf8" }}>ClipMind AI</h2>

      <p style={{ marginTop: "10px", color: "#94a3b8" }}>
        AI Powered Video Summarization Platform
      </p>

      <hr
        style={{
          margin: "30px auto",
          width: "80%",
          borderColor: "#334155",
        }}
      />

      <p style={{ color: "#64748b" }}>
        © 2026 ClipMind AI. All Rights Reserved.
      </p>
    </footer>
  );
}