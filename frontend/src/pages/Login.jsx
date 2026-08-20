import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginUser } from "../api";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.warning("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({
        email: form.email,
        password: form.password,
      });

      if (response.data && response.data.access_token) {
        // 1. Clear previous sessions/cache to avoid role overlap
        localStorage.clear();

        // 2. Set updated user details in LocalStorage
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("userId", response.data.user_id);
        localStorage.setItem("name", response.data.name);
        localStorage.setItem("email", response.data.email);

        // 3. Save Role accurately with standardized casing
        const rawRole = response.data.role || "Learner";
        let currentRole = "Learner";

        const lowerRole = rawRole.toLowerCase();
        if (lowerRole.includes("educator")) {
          currentRole = "Educator";
        } else if (lowerRole.includes("creator")) {
          currentRole = "Content Creator";
        } else if (lowerRole.includes("admin")) {
          currentRole = "Administrator";
        } else {
          currentRole = "Learner";
        }

        localStorage.setItem("userRole", currentRole);
        localStorage.setItem("role", currentRole);

        toast.success(`Welcome back, ${response.data.name}! (${currentRole})`);

        navigate("/dashboard");
      } else {
        toast.error("Invalid Response from Server");
      }
    } catch (error) {
      console.error("Login Error:", error);
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Login Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "1200px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* LEFT SIDE */}
        <div style={{ width: "48%" }}>
          <h1
            style={{
              fontSize: "65px",
              color: "#1e293b",
              marginBottom: "10px",
            }}
          >
            🎬 ClipMind AI
          </h1>

          <h2
            style={{
              color: "#2563eb",
              fontSize: "34px",
              lineHeight: "50px",
              marginBottom: "30px",
            }}
          >
            AI Video Summarization &
            <br />
            Key Moments Detection Platform
          </h2>

          <div
            style={{
              width: "90px",
              height: "6px",
              background: "linear-gradient(90deg,#2563eb,#7c3aed)",
              borderRadius: "20px",
              marginBottom: "35px",
            }}
          ></div>

          <p
            style={{
              fontSize: "20px",
              color: "#475569",
              lineHeight: "40px",
              textAlign: "justify",
            }}
          >
            ClipMind AI is an intelligent Artificial Intelligence platform that
            automatically converts uploaded videos into transcripts, generates
            concise summaries, detects important key moments, and provides
            analytics for better understanding of video content. It helps
            students, educators, researchers and content creators save time by
            extracting useful information quickly from lengthy videos.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{
            width: "420px",
            background: "#ffffff",
            borderRadius: "25px",
            padding: "45px",
            boxShadow: "0 20px 50px rgba(37,99,235,0.18)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              fontSize: "48px",
              color: "#1e293b",
              marginBottom: "10px",
            }}
          >
            Sign In
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              marginBottom: "35px",
              fontSize: "18px",
            }}
          >
            Sign in to continue
          </p>

          <form onSubmit={handleSubmit}>
            <label
              style={{
                fontWeight: "bold",
                color: "#334155",
                fontSize: "14px",
              }}
            >
              EMAIL
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "10px",
                marginBottom: "25px",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "16px",
                outline: "none",
              }}
            />

            <label
              style={{
                fontWeight: "bold",
                color: "#334155",
                fontSize: "14px",
              }}
            >
              PASSWORD
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "16px",
                marginTop: "10px",
                marginBottom: "30px",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "16px",
                outline: "none",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                border: "none",
                borderRadius: "30px",
                background: "linear-gradient(90deg,#2563eb,#7c3aed)",
                color: "#ffffff",
                fontSize: "20px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 10px 25px rgba(37,99,235,.3)",
              }}
            >
              {loading ? "Signing In..." : "Login"}
            </button>

            <p
              style={{
                textAlign: "center",
                marginTop: "30px",
                color: "#64748b",
              }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;