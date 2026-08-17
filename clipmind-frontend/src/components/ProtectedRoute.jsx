"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    // Check authentication
    if (!token) {
      router.replace("/login");
      return;
    }

    // Check role authorization
    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(role)
    ) {
      router.replace("/dashboard");
      return;
    }

    setAuthorized(true);
  }, [router, allowedRoles]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Checking authorization...
      </div>
    );
  }

  return children;
}