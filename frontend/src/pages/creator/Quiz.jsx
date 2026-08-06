import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import DashboardNavbar from "../../components/DashboardNavbar";
import api from "../../api/axios";

function Quiz() {
  const { videoId } = useParams();

  const navigate = useNavigate();

  const [quiz, setQuiz] = useState([]);

  // Stores selected answers
  const [selectedAnswers, setSelectedAnswers] = useState({});

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      const res = await api.get(
        `/creator/quiz/${videoId}`
      );

      setQuiz(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAnswerClick = (questionIndex, option) => {
    // Prevent changing answer
    if (selectedAnswers[questionIndex]) return;

    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: option,
    });
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="dashboard-content">
        <DashboardNavbar />

        <div className="summary-container">
          <h1>Quiz</h1>

          {quiz.length === 0 ? (
            <p>No quiz generated.</p>
          ) : (
            quiz.map((q, index) => (
              <div
                className="quiz-card"
                key={index}
              >
                <h3>
                  {index + 1}. {q.question}
                </h3>

                {q.options.map((option, i) => {
                  const selected =
                    selectedAnswers[index];

                  const isCorrect =
                    option === q.answer;

                  const isSelected =
                    selected === option;

                  let className =
                    "quiz-option";

                  if (selected) {
                    if (isCorrect)
                      className +=
                        " correct-option";

                    else if (isSelected)
                      className +=
                        " wrong-option";
                  }

                  return (
                    <div
                      key={i}
                      className={className}
                      onClick={() =>
                        handleAnswerClick(
                          index,
                          option
                        )
                      }
                    >
                      ○ {option}
                    </div>
                  );
                })}

                {selectedAnswers[index] && (
                  <div className="quiz-result">
                    {selectedAnswers[index] ===
                    q.answer ? (
                      <p
                        style={{
                          color: "green",
                          fontWeight: "bold",
                        }}
                      >
                        ✅ Correct!
                      </p>
                    ) : (
                      <p
                        style={{
                          color: "red",
                          fontWeight: "bold",
                        }}
                      >
                        ❌ Incorrect!

                        <br />

                        Correct Answer:
                        {" "}
                        {q.answer}
                      </p>
                    )}
                  </div>
                )}

                <hr />
              </div>
            ))
          )}

          <div className="summary-buttons">
            <button
              onClick={() =>
                navigate(
                  `/creator/flashcards/${videoId}`
                )
              }
            >
              Next → Flashcards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quiz;