const express = require('express');
const router = express.Router();

const {
  generatePracticeQuiz,
  getPerformanceAnalysis,
  getPracticeRecommendations,
} = require('../controllers/practiceController');

const { authenticate, authorize } = require('../middleware/auth');

// Student routes
router.post('/', authenticate, authorize('student'), generatePracticeQuiz);
router.get('/analysis', authenticate, authorize('student'), getPerformanceAnalysis);
router.get('/recommendations', authenticate, authorize('student'), getPracticeRecommendations);

module.exports = router;