import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "./PasswordInput";

/**
 * ResetPasswordForm
 *
 * Reads the reset token from the URL query string: /reset-password?token=<TOKEN>
 *
 * Note: until the email service is configured in the backend, retrieve the
 * token from the Django cache (Redis/Memurai) during development, e.g.:
 *   python manage.py shell -c "from django.core.cache import cache; print(list(cache._cache.keys()))"
 * Or use the token that AuthService.forgot_password() returns in the backend logs.
 */
function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new password reset link."
      );
      return;
    }

    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (!password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password, confirmPassword);
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Password reset failed. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleReset}>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!token && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg text-sm">
          No reset token found in the URL. Please use the link from your email.
        </div>
      )}

      <PasswordInput
        label="New Password"
        name="password"
        placeholder="Enter new password"
      />
      <PasswordInput
        label="Confirm Password"
        name="confirmPassword"
        placeholder="Confirm new password"
      />

      <button
        type="submit"
        disabled={loading || !token}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition"
      >
        {loading ? "Resetting…" : "Reset Password"}
      </button>

      <p className="text-center mt-6 text-gray-600">
        <Link to="/login" className="text-blue-600 font-semibold">
          Back to Login
        </Link>
      </p>

    </form>
  );
}

export default ResetPasswordForm;