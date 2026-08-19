import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "./PasswordInput";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-5">
        <label className="block text-gray-700 font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <PasswordInput />

      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center gap-2 text-gray-600">
          <input type="checkbox" />
          Remember Me
        </label>
        <Link to="/forgot-password" className="text-blue-600 hover:underline">
          Forgot Password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition"
      >
        {loading ? "Signing in…" : "Login"}
      </button>

      <p className="text-center mt-6 text-gray-600">
        Don&apos;t have an account?
        <Link to="/register" className="text-blue-600 font-semibold ml-2">
          Register
        </Link>
      </p>

    </form>
  );
}

export default LoginForm;