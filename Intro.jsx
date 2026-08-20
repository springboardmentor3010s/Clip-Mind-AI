import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import "./Intro.css";
import splashVideo from "../assets/splash.mp4";


export default function Intro() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Check if intro was already shown this session
    const introPlayed = sessionStorage.getItem("introPlayed");
    if (introPlayed) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const enterSite = (e) => {
    // Support click, Enter, Space
    if (e && e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    if (fade) return;

    setFade(true);
    sessionStorage.setItem("introPlayed", "true");

    setTimeout(() => {
      navigate("/home", { replace: true });
    }, 800);
  };

  return (
    <div
      className={`intro-container ${fade ? "fade-out" : ""}`}
      onClick={enterSite}
      onKeyDown={enterSite}
      tabIndex={0}
      role="button"
      aria-label="Click anywhere to enter"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        loop
        className="intro-video"
      >
        <source src={splashVideo} type="video/mp4" />
      </video>
    </div>
  );
}
