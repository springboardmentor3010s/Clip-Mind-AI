import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = e.target.email.value.trim();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Check your email
        </h3>
        <p className="text-gray-600 mb-6">
          If this email is registered, a password reset link has been sent.
        </p>
        <Link to="/login" className="text-blue-600 hover:underline font-semibold">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          placeholder="Enter your registered email"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition"
      >
        {loading ? "Sending…" : "Send Reset Link"}
      </button>

      <p className="text-center mt-6 text-gray-600">
        Remember your password?
        <Link to="/login" className="text-blue-600 font-semibold ml-2">
          Login
        </Link>
      </p>

    </form>
  );
}

export default ForgotPasswordForm;