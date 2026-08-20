import React from 'react';


const ScoreCard = ({ score, total, onRetry, onNewQuiz }) => {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const getGrade = () => {
    if (percentage >= 90) return { label: 'Excellent!', color: 'text-green-600', bg: 'bg-green-50' };
    if (percentage >= 70) return { label: 'Good Job!', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (percentage >= 50) return { label: 'Not Bad', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: 'Keep Practicing', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const grade = getGrade();

  return (
    <div className={`rounded-xl border border-gray-200 p-6 shadow-sm ${grade.bg}`}>
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">Your Score</p>
        <p className={`text-5xl font-bold ${grade.color}`}>
          {score}
          <span className="text-2xl text-gray-400">/{total}</span>
        </p>
        <p className={`text-lg font-semibold mt-2 ${grade.color}`}>{grade.label}</p>
        <p className="text-sm text-gray-500 mt-1">{percentage}% correct</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Retry Quiz
          </button>
          <button
            onClick={onNewQuiz}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Generate New Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;