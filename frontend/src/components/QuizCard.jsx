import React from "react";

function QuizCard({ quiz }) {

    return (

        <div
            style={{
                background: "#ffffff",
                padding: "25px",
                marginTop: "30px",
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
            }}
        >

            <h2>AI Generated Quiz</h2>

            <hr />

            <pre
                style={{
                    marginTop: "20px",
                    whiteSpace: "pre-wrap",
                    lineHeight: "28px",
                    fontSize: "16px"
                }}
            >

                {quiz}

            </pre>

        </div>

    );

}

export default QuizCard;