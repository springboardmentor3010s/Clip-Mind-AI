import Link from "next/link";
export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 60px",
        backgroundColor: "#111827",
        color: "white",
      }}
    >
      <h2 style={{ color: "#38bdf8" }}>ClipMind AI</h2>

      <div style={{ display: "flex", gap: "30px" }}>
        <a href="#" style={{ color: "white", textDecoration: "none" }}>
          Home
        </a>

        <a href="#" style={{ color: "white", textDecoration: "none" }}>
          Features
        </a>

        <a href="#" style={{ color: "white", textDecoration: "none" }}>
          About
        </a>

        <a href="#" style={{ color: "white", textDecoration: "none" }}>
          Contact
        </a>
      </div>

      <div style={{ display: "flex", gap: "15px" }}>
        <button
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <Link href="/login" >Login</Link>
        </button>

        <button
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            backgroundColor: "#0ea5e9",
            color: "white",
            cursor: "pointer",
            border: "none",
          }}
        >
          <Link href="/signup">Register</Link>
        </button>
      </div>
    </nav>
  );
}