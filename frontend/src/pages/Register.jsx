import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserShield,
  FaBrain,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import "../styles/Register.css";
import API from "../config";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("learner");

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const register = async () => {
    console.log("Register button clicked");

    setMessage("");
    setIsSuccess(false);

    // Basic validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      console.log("Registering with API:", API);

      const res = await axios.post(`${API}/register`, {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      console.log("Backend Response:", res.data);

      if (
        res.data.message === "User Registered Successfully" ||
        res.data.message === "Registration Successful"
      ) {
        setIsSuccess(true);
        setMessage(res.data.message);

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setIsSuccess(false);
        setMessage(res.data.message || "Registration Failed");
      }
    } catch (err) {
      console.error("Registration Error:", err);

      setIsSuccess(false);

      if (err.response) {
        setMessage(
          err.response.data?.detail ||
            err.response.data?.message ||
            "Registration Failed"
        );
      } else if (err.request) {
        setMessage("Cannot connect to backend.");
      } else {
        setMessage("Registration Failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="bg-circle circle1"></div>
      <div className="bg-circle circle2"></div>
      <div className="bg-circle circle3"></div>

      <motion.div
        className="left-panel"
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="brand-title">
          <FaBrain /> ClipMind AI
        </h1>

        <h2>Create your AI Workspace</h2>

        <p>
          Join ClipMind AI and unlock intelligent video summarization,
          transcript generation, key moments and analytics.
        </p>

        <div className="feature-box">🚀 Fast AI Processing</div>
<div className="feature-box">📄 Smart Summaries</div>
<div className="feature-box">🎯 Key Moments Detection</div>
<div className="feature-box">📊 Powerful Analytics</div>
      </motion.div>

      <motion.div
        className="register-card"
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Create Account</h2>

        <p className="register-subtitle">
          Start your ClipMind AI journey
        </p>

        <div className="input-group">
          <FaUser />
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <FaEnvelope />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <FaLock />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="input-group">
          <FaUserShield />

          <select
  value={role}
  onChange={(e) => setRole(e.target.value)}
>
  <option value="learner">🎓 Learner</option>
  <option value="content_creator">🎥 Content Creator</option>
  <option value="educator">👨‍🏫 Educator</option>
  <option value="admin">🛡️ Administrator</option>
</select>
        </div>

        <button
          className="register-btn"
          onClick={register}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        {message && (
          <div
            className={`message ${
              isSuccess ? "success" : "error"
            }`}
          >
            {message}
          </div>
        )}

        <p className="login-text">
          Already have an account?{" "}
          <Link to="/login">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;