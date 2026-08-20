import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiZap, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import videoService from '../services/videoService.js';
import quizService from '../services/quizService.js';
import Question from '../components/Question.jsx';
import ScoreCard from '../components/ScoreCard.jsx';


const QuizPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [quiz, setQuiz] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [source, setSource] = useState('transcript');

  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchVideoData();
  }, [videoId]);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      const [videoData, transcriptData, summaryData] = await Promise.allSettled([
        videoService.getVideo(videoId),
        videoService.getTranscript(videoId),
        videoService.getSummary(videoId),
      ]);

      if (videoData.status === 'fulfilled') setVideo(videoData.value);
      if (transcriptData.status === 'fulfilled') setTranscript(transcriptData.value);
      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);

      if (transcriptData.status !== 'fulfilled' && summaryData.status !== 'fulfilled') {
        setError('No transcript or summary available. Generate one first.');
      }
    } catch (err) {
      setError('Failed to load video data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setGenerating(true);
    setGenError('');
    setQuiz([]);
    setAnswers({});
    setShowResults(false);
    setScore(0);

    try {
      let text = '';
      if (source === 'summary' && summary) {
        text = `${summary.short_summary}\n\n${summary.detailed_summary}`;
      } else if (source === 'transcript' && transcript) {
        text = transcript.transcript;
      } else if (transcript) {
        text = transcript.transcript;
      } else if (summary) {
        text = `${summary.short_summary}\n\n${summary.detailed_summary}`;
      } else {
        setGenError('No transcript or summary available to generate quiz from.');
        setGenerating(false);
        return;
      }

      const result = await quizService.generateQuiz(videoId, text, questionCount, difficulty);
      setQuiz(result.questions);
    } catch (err) {
      setGenError(
        err.response?.data?.detail || err.message || 'Failed to generate quiz. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectAnswer = (questionIndex, option) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmit = () => {
    let correct = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    setScore(correct);
    setShowResults(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const handleNewQuiz = () => {
    setQuiz([]);
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setGenError('');
  };

  const allAnswered = quiz.length > 0 && quiz.every((_, i) => answers[i] !== undefined);

  if (loading) {
    return (
      <div className="pt-6 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="pt-6 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <FiAlertCircle className="mr-2" />
            {error || 'Video not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/videos/${videoId}`)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FiArrowLeft className="mr-1" /> Back to Video
          </button>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 flex items-center">
            <FiZap className="mr-2 text-yellow-500" />
            AI Quiz Generator
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{video.title}</p>
        </div>

        {/* Quiz Configuration */}
        {quiz.length === 0 && !generating && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Configure Your Quiz</h2>

            {/* Source Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Source</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSource('transcript')}
                  disabled={!transcript}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    source === 'transcript'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${!transcript ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  From Transcript
                </button>
                <button
                  onClick={() => setSource('summary')}
                  disabled={!summary}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    source === 'summary'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${!summary ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  From Summary
                </button>
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <div className="flex flex-col sm:flex-row gap-3">
                {['Easy', 'Medium', 'Hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      difficulty === level
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions: {questionCount}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateQuiz}
              disabled={!transcript && !summary}
              className="w-full flex items-center justify-center px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiZap className="mr-2" />
              Generate Quiz
            </button>

            {genError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center text-sm">
                <FiAlertCircle className="mr-2 flex-shrink-0" />
                {genError}
              </div>
            )}
          </div>
        )}

        {/* Generating State */}
        {generating && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FiLoader className="text-4xl mx-auto mb-3 text-primary-600 animate-spin" />
            <p className="text-gray-700 font-medium">Generating your quiz...</p>
            <p className="text-sm text-gray-500 mt-2">
              Creating {questionCount} {difficulty} questions from the {source}. This may take a few seconds.
            </p>
          </div>
        )}

        {/* Quiz Questions */}
        {quiz.length > 0 && !generating && (
          <>
            {/* Progress Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Answered: {Object.keys(answers).length} / {quiz.length}
                </span>
                {!showResults && (
                  <button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Quiz
                  </button>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${(Object.keys(answers).length / quiz.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Score Card (after submit) */}
            {showResults && (
              <div className="mb-6">
                <ScoreCard
                  score={score}
                  total={quiz.length}
                  onRetry={handleRetry}
                  onNewQuiz={handleNewQuiz}
                />
              </div>
            )}

            {/* Questions */}
            <div className="space-y-4">
              {quiz.map((q, index) => (
                <Question
                  key={index}
                  question={q}
                  index={index}
                  selectedAnswer={answers[index]}
                  onSelectAnswer={(option) => handleSelectAnswer(index, option)}
                  showResult={showResults}
                />
              ))}
            </div>

            {/* Submit button at bottom */}
            {!showResults && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {allAnswered ? 'Submit Quiz' : `Answer all questions (${Object.keys(answers).length}/${quiz.length})`}
                </button>
              </div>
            )}
          </>
        )}

        {/* No content available */}
        {!transcript && !summary && !loading && !generating && quiz.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FiAlertCircle className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-gray-700 font-medium">No content available for quiz generation</p>
            <p className="text-sm text-gray-500 mt-2">
              Generate a transcript or summary first, then come back to create a quiz.
            </p>
            <Link
              to={`/videos/${videoId}`}
              className="inline-flex items-center mt-4 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm"
            >
              <FiArrowLeft className="mr-1" /> Back to Video
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;