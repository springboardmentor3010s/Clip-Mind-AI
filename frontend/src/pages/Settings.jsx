import { useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaMoon,
  FaBell,
  FaSave,
} from "react-icons/fa";

import "../styles/Settings.css";

function Settings() {

  const [name, setName] = useState(
    localStorage.getItem("userName") || ""
  );

  const [email] = useState(
    localStorage.getItem("userEmail") || ""
  );

  const saveSettings = () => {

    localStorage.setItem("userName", name);

    alert("Settings Saved Successfully!");

  };

  return (

    <div className="settings-page">

      <h1>⚙ Settings</h1>

      <div className="settings-card">

        <div className="input-group">

          <label>

            <FaUser />

            Full Name

          </label>

          <input
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

        </div>

        <div className="input-group">

          <label>

            <FaEnvelope />

            Email

          </label>

          <input
            value={email}
            disabled
          />

        </div>

        <div className="setting-option">

          <FaMoon />

          Dark Theme

          <input type="checkbox" checked readOnly/>

        </div>

        <div className="setting-option">

          <FaBell />

          Email Notifications

          <input type="checkbox"/>

        </div>

        <button
          className="save-btn"
          onClick={saveSettings}
        >

          <FaSave />

          Save Changes

        </button>

      </div>

    </div>

  );

}

export default Settings;
