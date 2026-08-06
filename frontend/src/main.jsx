import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import { VideoProvider } from "./context/VideoContext";
import ThemeProvider from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <VideoProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </VideoProvider>
    </ThemeProvider>
  </React.StrictMode>
);