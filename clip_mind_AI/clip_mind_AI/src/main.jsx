import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { VideoProvider } from "./context/VideoContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <VideoProvider>
        <App />
      </VideoProvider>
    </AuthProvider>
  </React.StrictMode>
);