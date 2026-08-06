import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Login() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      const res = await api.post("/auth/login", form);

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user_id", res.data.user_id);
      localStorage.setItem("full_name", res.data.full_name);

      if (res.data.role === "creator") {
        navigate("/creator-dashboard");
      }

      else if (res.data.role === "educator") {
        navigate("/educator-dashboard");
      }

      else if (res.data.role === "learner") {
        navigate("/learner-dashboard");
      }

      else if (res.data.role === "admin") {
        navigate("/admin-dashboard");
      }

    }

    catch (err) {

      alert(err.response?.data?.detail || "Login Failed");

    }

  };

  return (

    <div className="login-container">

      <div className="login-left">

        <h1>ClipMind AI</h1>

        <h2>Welcome Back!</h2>

        <p>
          Login to continue summarizing videos using Artificial Intelligence.
        </p>

      </div>

      <div className="login-right">

        <div className="login-card">

          <h2>Login</h2>

          <p>Sign in to your account</p>

          <form onSubmit={handleLogin}>

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />

            <button type="submit">
              Login
            </button>

          </form>

          <div className="login-links">

            <Link to="/register">
              Create Account
            </Link>

          </div>

        </div>

      </div>

    </div>

  );

}

export default Login;