import React from 'react';


const Question = ({ question, index, selectedAnswer, onSelectAnswer, showResult }) => {
  const getOptionClass = (option) => {
    if (!showResult) {
      return selectedAnswer === option
        ? 'border-primary-500 bg-primary-50 text-primary-700'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
    }

    if (option === question.answer) {
      return 'border-green-500 bg-green-50 text-green-700';
    }

    if (selectedAnswer === option && option !== question.answer) {
      return 'border-red-500 bg-red-50 text-red-700';
    }

    return 'border-gray-200 opacity-60';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        <span className="text-primary-600 mr-2">Q{index + 1}.</span>
        {question.question}
      </h3>

      <div className="space-y-2">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => !showResult && onSelectAnswer(option)}
            disabled={showResult}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm flex items-center ${
              getOptionClass(option)
            } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0">
              {String.fromCharCode(65 + i)}
            </span>
            <span>{option}</span>
            {showResult && option === question.answer && (
              <svg className="w-5 h-5 ml-auto text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {showResult && selectedAnswer === option && option !== question.answer && (
              <svg className="w-5 h-5 ml-auto text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Question;