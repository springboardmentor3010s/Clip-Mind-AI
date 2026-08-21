import { useEffect, useState } from "react";
import { FaRobot, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/Processing.css";

function Processing() {

  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const steps = [
    "Extracting Audio...",
    "Generating Transcript...",
    "Generating AI Summary...",
    "Detecting Key Moments...",
    "Finalizing Results..."
  ];

  useEffect(() => {

    let current = 0;

    const timer = setInterval(() => {

      current++;

      setStep(current);

      if (current === steps.length) {

        clearInterval(timer);

        setTimeout(() => {
          navigate("/summary");
        }, 1000);

      }

    }, 1500);

    return () => clearInterval(timer);

  }, [navigate]);

  return (

    <div className="processing-page">

      <div className="processing-card">

        <FaRobot className="robot-icon"/>

        <h1>AI Processing Video</h1>

        <p>Please wait while ClipMind AI analyzes your video.</p>

        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: `${(step / steps.length) * 100}%`
            }}
          ></div>

        </div>

        <div className="steps">

          {steps.map((item,index)=>(

            <div
              key={index}
              className={index < step ? "completed" : ""}>

              {index < step ? (
                <FaCheckCircle/>
              ) : (
                "○"
              )}

              {item}

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}

export default Processing;
