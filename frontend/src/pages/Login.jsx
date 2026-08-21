import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaEnvelope,
  FaLock,
  FaBrain,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";

import "../styles/Login.css";
import API from "../config";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("learner");
  const [message, setMessage] = useState("");

  const login = async () => {
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/login`,
        {
          email: email,
          password: password,
        }
      );

      console.log("Login response:", res.data);

      if (res.data.message === "Login Successful") {

        // =====================================
        // SAVE USER INFORMATION
        // =====================================

        localStorage.setItem(
          "userEmail",
          res.data.email || email
        );

        localStorage.setItem(
          "userName",
          res.data.user || ""
        );

        localStorage.setItem(
          "userId",
          String(res.data.user_id || "")
        );

        // =====================================
        // SAVE ACTUAL BACKEND ROLE
        // =====================================

const userRole = String(
  res.data.role || "learner"
).trim().toLowerCase();

        localStorage.setItem(
          "role",
          userRole
        );

        // =====================================
        // SAVE JWT ACCESS TOKEN
        // =====================================

        localStorage.setItem(
          "access_token",
          res.data.access_token
        );

        console.log("================================");
        console.log("LOGIN SUCCESSFUL");
        console.log("User:", res.data.user);
        console.log("Email:", res.data.email);
        console.log("Role:", userRole);
        console.log(
          "Token saved:",
          !!res.data.access_token
        );
        console.log("================================");

        // =====================================
        // ROLE BASED REDIRECTION
        // =====================================

  if (userRole === "administrator") {

  navigate("/admin");

} else if (userRole === "content_creator") {

  navigate("/creator");

} else if (userRole === "educator") {

  navigate("/educator");

} else if (userRole === "learner") {

  navigate("/learner");

} else {

  navigate("/dashboard");

}

      } else {

        setMessage(
          res.data.message || "Login Failed"
        );
      }

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      if (error.response) {

        console.error(
          "Backend response:",
          error.response.data
        );

        if (
          error.response.data &&
          error.response.data.detail
        ) {

          if (
            Array.isArray(
              error.response.data.detail
            )
          ) {

            setMessage(
              error.response.data.detail[0].msg
            );

          } else {

            setMessage(
              error.response.data.detail
            );
          }

        } else {

          setMessage(
            error.response.data?.message ||
            "Login Failed"
          );
        }

      } else {

        setMessage(
          "Cannot connect to backend."
        );
      }
    }
  };

  // =====================================
  // ALLOW ENTER KEY TO LOGIN
  // =====================================

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      login();
    }
  };

  return (
    <div className="login-page">

      {/* =====================================
          BACKGROUND
      ===================================== */}

      <div className="bg-circle circle1"></div>
      <div className="bg-circle circle2"></div>
      <div className="bg-circle circle3"></div>


      {/* =====================================
          LEFT PANEL
      ===================================== */}

      <motion.div
        className="left-panel"
        initial={{
          x: -80,
          opacity: 0,
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        transition={{
          duration: 0.8,
        }}
      >

        <h1 className="brand-title">
          <FaBrain /> ClipMind AI
        </h1>

        <h2>
          Transform Videos into Smart Insights
        </h2>

        <p>
          Upload videos, generate AI summaries,
          transcripts, key moments and analytics
          using advanced Artificial Intelligence.
        </p>

        <div className="feature-box">
          🎥 AI Video Summarization
        </div>

        <div className="feature-box">
          📝 Instant Transcript
        </div>

        <div className="feature-box">
          ⭐ Key Moment Detection
        </div>

        <div className="feature-box">
          📊 Analytics Dashboard
        </div>

      </motion.div>


      {/* =====================================
          LOGIN CARD
      ===================================== */}

      <motion.div
        className="login-card"
        initial={{
          y: 50,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          duration: 0.8,
        }}
      >

        <h2>
          Welcome Back 👋
        </h2>

        <p className="subtitle">
          Sign in to continue using ClipMind AI
        </p>


        {/* =====================================
            EMAIL
        ===================================== */}

        <div className="input-box">

          <FaEnvelope className="icon" />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            onKeyDown={handleKeyDown}
          />

        </div>


        {/* =====================================
            PASSWORD
        ===================================== */}

        <div className="input-box">

          <FaLock className="icon" />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            onKeyDown={handleKeyDown}
          />

        </div>


        {/* =====================================
            ROLE
        ===================================== */}

        <div className="input-box">

          <FaUserShield className="icon" />

          <select
            className="role-select"
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
          >

            <option value="learner">🎓 Learner</option>
            <option value="content_creator">🎥 Content Creator</option>
            <option value="educator">👨‍🏫 Educator</option>
            <option value="administrator">🛡️ Administrator</option>

          </select>

        </div>


        {/* =====================================
            LOGIN BUTTON
        ===================================== */}

        <button
          className="login-btn"
          onClick={login}
        >
          Sign In
        </button>


        {/* =====================================
            MESSAGE
        ===================================== */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}


        {/* =====================================
            SOCIAL LOGIN
        ===================================== */}

        <div className="divider">
          OR
        </div>

        <button className="google-btn">
          Continue with Google
        </button>

        <button className="github-btn">
          Continue with GitHub
        </button>


        {/* =====================================
            REGISTER
        ===================================== */}

        <p className="register-text">

          Don't have an account?{" "}

          <Link to="/register">
            Create Account
          </Link>

        </p>

      </motion.div>

    </div>
  );
}

export default Login;
