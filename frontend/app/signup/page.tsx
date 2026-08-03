"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { signup } from "@/services/auth";

export default function Signup() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

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

    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.role

    ) {
      setError("Please fill all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      console.log("Sending Signup Request...");

      await signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      alert("Account created successfully!");

      router.push("/login");
    } catch (err: any) {
      console.error("Signup Error:", err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Signup failed."
      );
    } finally {
      setLoading(false);
    }
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
          width: "450px",
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
            marginBottom: "5px",
            color: "#38bdf8",
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
          Create Your Account
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            marginBottom: "30px",
          }}
        >
          Join ClipMind AI and start transforming videos with AI.
        </p>

        <label>👤 Full Name</label>
        <input
          type="text"
          name="username"
          placeholder="Enter your full name"
          value={formData.username}
          onChange={handleChange}
          style={inputStyle}
        />

        <label>📧 Email</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          style={inputStyle}
        />

        <label>🔒 Password</label>
        <input
          type="password"
          name="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          style={inputStyle}
        />

        <label>🔒 Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          value={formData.confirmPassword}
          onChange={handleChange}
          style={inputStyle}
        />

        <label>👤 Who are you?</label>

        <select
          name="role"
          value={formData.role}
          onChange={(e) =>
            setFormData({
            ...formData,
            role: e.target.value,
         })
        }
        style={inputStyle}
      >
        <option value="">Select your role</option>

        <option value="creator">
          🎥 Content Creator
        </option>

        <option value="educator">
          👨‍🏫 Educator
        </option>

        <option value="learner">
          🎓 Learner
        </option>
      </select>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
            gap: "8px",
          }}
        >
          <input type="checkbox" />
          <span
            style={{
              fontSize: "14px",
              color: "#cbd5e1",
            }}
          >
            I agree to the Terms & Privacy Policy
          </span>
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
            border: "none",
            borderRadius: "12px",
            background: "#0ea5e9",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
            fontWeight: "bold",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "#38bdf8",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}