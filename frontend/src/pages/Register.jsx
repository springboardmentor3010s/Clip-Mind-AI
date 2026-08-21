import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { registerUser } from "../api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Learner", // Default role set to Learner
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

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword ||
      !form.role
    ) {
      toast.warning("Please fill all fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      toast.success("Registration Successful! Please login.");

      navigate("/");
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Registration Failed");
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
            padding: "40px 45px",
            boxShadow: "0 20px 50px rgba(37,99,235,.18)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              fontSize: "38px",
              color: "#1e293b",
              marginBottom: "5px",
            }}
          >
            Register
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              marginBottom: "25px",
            }}
          >
            Create your ClipMind AI account
          </p>

          <form onSubmit={handleSubmit}>
            <label
              style={{
                fontWeight: "bold",
                color: "#334155",
                fontSize: "13px",
              }}
            >
              NAME
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "6px",
                marginBottom: "16px",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "15px",
                outline: "none",
              }}
            />

            <label
              style={{
                fontWeight: "bold",
                color: "#334155",
                fontSize: "13px",
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
                padding: "14px",
                marginTop: "6px",
                marginBottom: "16px",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "15px",
                outline: "none",
              }}
            />

            <label
              style={{
                fontWeight: "bold",
                color: "#334155",
                fontSize: "13px",
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
                padding: "14px",
                marginTop: "6px",
                marginBottom: "16px",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "15px",
                outline: "none",
              }}
            />

            <label
              style={{
                fontWeight: "bold",
                color: "#334155",
                fontSize: "13px",
              }}
            >
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "6px",
                marginBottom: "16px",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "15px",
                outline: "none",
              }}
            />

            <label
              style={{
                fontWeight: "bold",
                color: "#334155",
                fontSize: "13px",
              }}
            >
              SELECT ROLE
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "6px",
                marginBottom: "25px",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "15px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="Learner">🎓 Learner</option>
              <option value="Educator">👨‍🏫 Educator</option>
              <option value="Content Creator">🎥 Content Creator</option>
              <option value="Administrator">👨‍💼 Administrator</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: "30px",
                background: "linear-gradient(90deg,#2563eb,#7c3aed)",
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 10px 25px rgba(37,99,235,.3)",
              }}
            >
              {loading ? "Creating Account..." : "Register"}
            </button>

            <p
              style={{
                textAlign: "center",
                marginTop: "20px",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Already have an account?{" "}
              <Link
                to="/"
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;