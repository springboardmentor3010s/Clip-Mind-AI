"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getRoleHome } from "@/types/auth";
export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

const [formData, setFormData] = useState({
  login: "",
  password: "",
});
const handleChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value,
  });
};
const handleSubmit = async () => {
  setError("");

  if (!formData.login || !formData.password) {
    setError("Please fill all fields.");
    return;
  }

  try {
    setLoading(true);

    const loggedInUser = await login({
      login: formData.login.trim(),
      password: formData.password,
    });

    router.replace(getRoleHome(loggedInUser.role));
  } catch (err: any) {
    setError(
      err?.response?.data?.detail ||
        err?.message ||
        "Login failed."
    );
  } finally {
    setLoading(false);
  }
};
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
  const inputStyle = {
    width: "100%",
    padding: "14px",
    marginTop: "8px",
    marginBottom: "18px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "white",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #111827)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "430px",
          background: "#1e293b",
          borderRadius: "20px",
          padding: "40px",
          color: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#38bdf8",
            marginBottom: "5px",
          }}
        >
          ClipMind AI
        </h1>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Welcome Back 👋
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            marginBottom: "30px",
          }}
        >
          Login to continue using AI-powered video summarization.
        </p>

        <label>👤 Username or Email</label>

<input
  type="text"
  name="login"
  placeholder="Enter your username or email"
  value={formData.login}
  onChange={handleChange}
  style={inputStyle}
/>

        <label>🔒 Password</label>

        <input
  type="password"
  name="password"
  placeholder="Enter your password"
  value={formData.password}
  onChange={handleChange}
  style={inputStyle}
/>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
            fontSize: "14px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <input type="checkbox" />
            Remember Me
          </label>

          <a
            href="#"
            style={{
              color: "#38bdf8",
              textDecoration: "none",
            }}
          >
            Forgot Password?
          </a>
        </div>
{error && (
  <p
    style={{
      color: "#ef4444",
      textAlign: "center",
      marginBottom: "15px",
    }}
  >
    {error}
  </p>
)}
       <button
  onClick={handleSubmit}
  disabled={loading}
  style={{
    width: "100%",
    padding: "15px",
    borderRadius: "12px",
    border: "none",
    background: "#0ea5e9",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
    fontWeight: "bold",
    opacity: loading ? 0.7 : 1,
  }}
>
  {loading ? "Logging In..." : "Login"}
</button>

       

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
          }}
        >
          Don't have an account?{" "}
          <Link
            href="/signup"
            style={{
              color: "#38bdf8",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}