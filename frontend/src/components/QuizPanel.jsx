export default function QuizPanel({ quiz = [] }) {

    if (quiz.length === 0)
        return <p>No quiz generated.</p>;

    return (

        <div>

            {quiz.map((q, index) => (

                <div
                    key={index}
                    className="quiz-card"
                >

                    <h3>

                        Question {index + 1}

                    </h3>

                    <p>{q.question}</p>

                    {q.options.map((option, i) => (

                        <div
                            key={i}
                            className="quiz-option"
                        >

                            {option}

                        </div>

                    ))}

                    <strong>

                        Answer : {q.answer}

                    </strong>

                </div>

            ))}

        </div>

    );

}