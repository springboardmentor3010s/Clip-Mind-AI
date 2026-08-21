import {
  FaHome,
  FaUpload,
  FaVideo,
  FaFileAlt,
  FaStar,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaBrain,
} from "react-icons/fa";

import { NavLink, useNavigate } from "react-router-dom";

import "./Sidebar.css";

function Sidebar() {

  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="sidebar">

      <div className="logo">
        <FaBrain />
        <span>ClipMind AI</span>
      </div>

      <ul>

        <NavLink to="/dashboard" className="nav-item">
          {({ isActive }) => (
            <li className={isActive ? "active" : ""}>
              <FaHome />
              Dashboard
            </li>
          )}
        </NavLink>

        <NavLink to="/upload" className="nav-item">
          {({ isActive }) => (
            <li className={isActive ? "active" : ""}>
              <FaUpload />
              Upload Video
            </li>
          )}
        </NavLink>

        <NavLink to="/videos" className="nav-item">
          {({ isActive }) => (
            <li className={isActive ? "active" : ""}>
              <FaVideo />
              My Videos
            </li>
          )}
        </NavLink>

        <NavLink to="/summary" className="nav-item">
          {({ isActive }) => (
            <li className={isActive ? "active" : ""}>
              <FaFileAlt />
              Summaries
            </li>
          )}
        </NavLink>

        <NavLink to="/keymoments" className="nav-item">
          {({ isActive }) => (
            <li className={isActive ? "active" : ""}>
              <FaStar />
              Key Moments
            </li>
          )}
        </NavLink>

        <NavLink to="/analytics" className="nav-item">
          {({ isActive }) => (
            <li className={isActive ? "active" : ""}>
              <FaChartBar />
              Analytics
            </li>
          )}
        </NavLink>

        <NavLink to="/settings" className="nav-item">
          {({ isActive }) => (
            <li className={isActive ? "active" : ""}>
              <FaCog />
              Settings
            </li>
          )}
        </NavLink>

      </ul>

      <button className="logout-btn" onClick={logout}>
        <FaSignOutAlt />
        Logout
      </button>

    </div>
  );
}

export default Sidebar;
