import Link from "next/link";
export default function Hero() {
  return (
    <section
      style={{
        backgroundColor: "#111827",
        color: "white",
        textAlign: "center",
        padding: "100px 20px",
      }}
    >
      <p
        style={{
          color: "#38bdf8",
          fontWeight: "bold",
          marginBottom: "20px",
        }}
      >
        🚀 AI Powered Video Platform
      </p>

      <h1
        style={{
          fontSize: "60px",
          marginBottom: "20px",
          lineHeight: "1.2",
        }}
      >
        Transform Long Videos
        <br />
        Into <span style={{ color: "#38bdf8" }}>Smart AI Summaries</span>
      </h1>

      <p
        style={{
          fontSize: "20px",
          color: "#cbd5e1",
          maxWidth: "800px",
          margin: "0 auto 40px",
        }}
      >
        Upload videos, generate transcripts, detect key moments, and create
        AI-powered summaries within seconds.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
        }}
      >
       <Link href="/login">
  <button
    style={{
      padding: "16px 40px",
      backgroundColor: "#0ea5e9",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "18px",
      cursor: "pointer",
      marginRight: "20px",
    }}
  >
    Upload Video
  </button>
</Link>

       <Link href="/signup">
  <button
    style={{
      padding: "16px 40px",
      background: "transparent",
      color: "white",
      border: "2px solid #38bdf8",
      borderRadius: "12px",
      fontSize: "18px",
      cursor: "pointer",
    }}
  >
    Get Started
  </button>
</Link>
      </div>
    </section>
  );
}
