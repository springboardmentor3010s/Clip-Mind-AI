import api from './api';


const quizService = {
  /**
   * Generate a multiple-choice quiz from a video transcript or summary.
   * @param {number} videoId - The video ID.
   * @param {string} transcript - The transcript/summary text to generate from.
   * @param {number} count - Number of questions (1-20, default 10).
   * @param {string} difficulty - "Easy", "Medium", or "Hard" (default "Medium").
   * @returns {Promise<{questions: Array, total: number}>}
   */
  generateQuiz: async (videoId, transcript, count = 10, difficulty = 'Medium') => {
    const response = await api.post(`/api/videos/${videoId}/quiz/generate`, {
      transcript,
      count,
      difficulty,
    });
    return response.data;
  },
};

export default quizService;