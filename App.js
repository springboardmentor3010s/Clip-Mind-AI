import { useState } from "react";
import axios from "axios";
import Dashboard from "./components/Dashboard";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
const [transcript, setTranscript] = useState("");
const [keyMoments, setKeyMoments] = useState([]);
const [videoURL, setVideoURL] = useState("");

  const login = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/login", {
        name: "",
        email: email,
        password: password,
      });

      setMessage(res.data.message);
      setLoggedIn(true);
      localStorage.setItem("userEmail", email);
      setUserName(res.data.user);
    } catch (err) {
      setMessage("Login Failed");
    }
  };
if (loggedIn) {
  return (
  <Dashboard
    user={userName}
    summary={summary}
    transcript={transcript}
    keyMoments={keyMoments}
    videoURL={videoURL}
    setSummary={setSummary}
    setTranscript={setTranscript}
    setKeyMoments={setKeyMoments}
    setVideoURL={setVideoURL}
  />
);
}
  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center"
      style={{
        height: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{
          width: "400px",
          borderRadius: "20px",
        }}
      >
        <h2 className="text-center mb-4 text-primary">
          🎥 ClipMind AI
        </h2>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary w-100"
          onClick={login}
        >
          Login
        </button>

        {message && (
          <div className="alert alert-success mt-3 text-center">
            {message}
          </div>
        )}

        <p className="text-center mt-3">
          Don't have an account? <a href="#">Register</a>
        </p>
      </div>
    </div>
  );
}

export default App;