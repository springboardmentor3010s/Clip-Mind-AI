import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

/**
 * Public site header.
 *
 * Signed-in visitors get a "Dashboard" link instead of Login/Register, so
 * landing on the marketing site mid-session is not a dead end.
 */
function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `transition ${isActive ? "text-blue-400 font-semibold" : "text-gray-300 hover:text-blue-400"}`;

  return (
    <nav className="fixed top-0 left-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50">
      <div className="max-w-7xl mx-auto h-20 flex items-center justify-between px-6 md:px-8">

        <Link to="/" className="text-2xl md:text-3xl font-bold text-blue-500">
          ClipMind AI
        </Link>

        {/* Desktop menu */}
        <ul className="hidden md:flex gap-8 font-medium">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className={linkClass} end={link.to === "/"}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden md:flex gap-4 items-center">
          {user ? (
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-semibold transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-blue-400 transition">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-semibold transition"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-gray-300 text-2xl"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800 px-6 py-4 space-y-3">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => setOpen(false)}
              className="block text-gray-300 hover:text-blue-400 py-1"
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-slate-800 flex gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="flex-1 text-center bg-blue-600 px-4 py-2 rounded-lg font-semibold"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex-1 text-center border border-slate-700 px-4 py-2 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center bg-blue-600 px-4 py-2 rounded-lg font-semibold"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
