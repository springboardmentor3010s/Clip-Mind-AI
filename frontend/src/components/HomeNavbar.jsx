import { Link } from "react-router-dom";

function HomeNavbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">ClipMind AI</Link>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <a href="#features">Features</a>
        <a href="#workflow">Workflow</a>
        <a href="#about">About</a>

        <Link to="/login" className="login-btn">
          Login
        </Link>

        <Link to="/register" className="register-btn">
          Register
        </Link>
      </div>
    </nav>
  );
}

export default HomeNavbar;