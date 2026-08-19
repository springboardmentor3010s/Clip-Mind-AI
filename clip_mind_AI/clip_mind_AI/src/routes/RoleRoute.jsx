import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Route guard that additionally requires one of `allow`.
 *
 * Authorisation is enforced by the API; this guard exists so a user never
 * lands on a page whose data they cannot fetch. Unauthorised users are sent to
 * their dashboard rather than shown an error, which keeps navigation sane when
 * a role changes mid-session.
 */
function RoleRoute({ allow = [], children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white text-xl animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allow.length && !allow.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleRoute;
