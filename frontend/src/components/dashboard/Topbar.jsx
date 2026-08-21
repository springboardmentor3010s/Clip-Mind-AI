import {
  FaBell,
  FaSearch,
  FaUserCircle
} from "react-icons/fa";

import "./Topbar.css";

function Topbar() {

  const user = localStorage.getItem("userName") || "Kajal";

  return (

    <div className="topbar">

      <div className="welcome">

        <h2>Welcome back, {user} 👋</h2>

        <p>Here's an overview of your AI video workspace.</p>

      </div>

      <div className="top-right">

        <div className="search-box">

          <FaSearch />

          <input
            type="text"
            placeholder="Search videos..."
          />

        </div>

        <FaBell className="icon-btn" />

        <div className="profile">

          <FaUserCircle />

          <span>{user}</span>

        </div>

      </div>

    </div>

  );

}

export default Topbar;
