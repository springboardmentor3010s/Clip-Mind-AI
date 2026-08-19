import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "./PasswordInput";

function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const firstName = e.target.firstName.value.trim();
    const lastName = e.target.lastName.value.trim();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;
    const role = e.target.role.value;

    if (!firstName || !email || !password || !confirmPassword) {
      setError("Please fill all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(firstName, lastName, email, password, confirmPassword, role);
      navigate("/login");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && typeof errors === "object") {
        const messages = Object.values(errors).flat().join(" ");
        setError(messages);
      } else {
        setError(
          err.response?.data?.message ||
            "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister}>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            placeholder="First name"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            placeholder="Last name"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-gray-700 font-medium mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-5">
        <label className="block text-gray-700 font-medium mb-2">
          I am a <span className="text-red-500">*</span>
        </label>
        <select
          name="role"
          defaultValue="learner"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="learner">Learner — watch and study shared content</option>
          <option value="content_creator">
            Content Creator — upload and summarise my own videos
          </option>
          <option value="educator">
            Educator — teach with lectures, materials and classroom analytics
          </option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          This determines what you can do on the platform. Administrator accounts
          are assigned by an existing administrator.
        </p>
      </div>

      <PasswordInput label="Password *" name="password" />
      <PasswordInput
        label="Confirm Password *"
        name="confirmPassword"
        placeholder="Re-enter your password"
      />
      <p className="text-xs text-gray-500 -mt-3 mb-5">
        At least 8 characters, with an uppercase letter, a lowercase letter, a
        digit and a special character (@$!%*?&).
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition"
      >
        {loading ? "Creating account…" : "Register"}
      </button>

      <p className="text-center mt-6 text-gray-600">
        Already have an account?
        <Link to="/login" className="text-blue-600 font-semibold ml-2">
          Login
        </Link>
      </p>

    </form>
  );
}

export default RegisterForm;