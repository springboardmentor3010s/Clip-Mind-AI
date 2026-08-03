"use client";

export default function DashboardNavbar() {
  return (
    <div
      style={{
        height: "75px",
        background: "#111827",
        borderBottom: "1px solid #1E293B",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 35px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div>
        <h2
          style={{
            color: "white",
            margin: 0,
            fontSize: "24px",
          }}
        >
          Dashboard
        </h2>

        <p
          style={{
            margin: 0,
            color: "#94A3B8",
            fontSize: "14px",
          }}
        >
          Welcome back 👋
        </p>
      </div>

      <div
        style={{
          width: "45px",
          height: "45px",
          borderRadius: "50%",
          background: "#0EA5E9",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: "18px",
        }}
      >
        N
      </div>
    </div>
  );
}