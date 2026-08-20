"use client";

import { useEffect, useState } from "react";

export default function GoogleCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        setError("No authorization code received from Google.");
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/api/v1/auth/google/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.detail || "Google login failed.");
          return;
        }

        localStorage.setItem("clipmind_token", data.access_token);
        localStorage.setItem("clipmind_user", JSON.stringify(data.user));
        window.location.href = "/dashboard";
      } catch (err) {
        setError("Could not connect to server.");
      }
    }
    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5FA]">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-600 font-semibold mb-2">Google login failed</p>
            <p className="text-sm text-gray-500">{error}</p>
            <a href="/login" className="text-blue text-sm font-semibold mt-4 inline-block hover:underline">
              Back to Login
            </a>
          </>
        ) : (
          <p className="text-gray-600">Signing you in with Google...</p>
        )}
      </div>
    </div>
  );
}