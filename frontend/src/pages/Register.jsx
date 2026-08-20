import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  const handleRegister = async (e) => {

    e.preventDefault();

    if (form.password !== form.confirmPassword) {

      alert("Passwords do not match");

      return;

    }

    try {

      await api.post("/auth/register", {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      alert("Registration Successful");

      navigate("/login");

    }

    catch (err) {

      alert(err.response?.data?.detail || "Registration Failed");

    }

  };

  return (

    <div className="register-container">

      <div className="register-left">

        <h1>ClipMind AI</h1>

        <h2>Create Your Account</h2>

        <p>
          Join ClipMind AI and start transforming long videos into concise,
          AI-powered summaries.
        </p>

      </div>

      <div className="register-right">

        <div className="register-card">

          <h2>Register</h2>

          <p>Create a new account</p>

          <form onSubmit={handleRegister}>

            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={form.full_name}
              onChange={handleChange}
            />

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

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
            />

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
            >

              <option value="" disabled>
                Select your role
              </option>

              <option value="creator">
                Content Creator
              </option>

              <option value="educator">
                Educator
              </option>

              <option value="learner">
                Learner
              </option>

            </select>

            <button type="submit">
              Register
            </button>

          </form>

          <div className="register-links">

            <Link to="/login">
              Already have an account?
            </Link>

          </div>

        </div>

      </div>

    </div>

  );

}

export default Register;