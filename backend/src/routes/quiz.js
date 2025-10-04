const express = require('express');
const router = express.Router();

const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  uploadPDFAndGenerateQuiz,
  assignQuiz,
  startQuizAttempt,
  submitQuiz,
  generateAIFeedback,
} = require('../controllers/quizController');

const { authenticate, authorize } = require('../middleware/auth');
const { validateQuiz } = require('../middleware/validation');
const { quizLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { uploadMiddleware } = require('../utils/fileUpload');

// Public routes (with authentication)
router.get('/', authenticate, getQuizzes);
router.get('/:id', authenticate, getQuiz);

// Student routes
router.post('/:id/start', authenticate, authorize('student'), startQuizAttempt);
router.post('/:id/submit', authenticate, authorize('student'), quizLimiter, submitQuiz);

// Teacher/Admin routes
router.post('/', authenticate, authorize('teacher', 'admin'), validateQuiz, createQuiz);
router.put('/:id', authenticate, authorize('teacher', 'admin'), validateQuiz, updateQuiz);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), deleteQuiz);

router.post(
  '/upload',
  authenticate,
  authorize('teacher', 'admin'),
  uploadLimiter,
  uploadMiddleware.single('pdf'),
  uploadPDFAndGenerateQuiz
);

router.post('/:id/assign', authenticate, authorize('teacher', 'admin'), assignQuiz);

// AI feedback generation
router.post(
  '/submission/:id/feedback',
  authenticate,
  authorize('teacher', 'admin'),
  generateAIFeedback
);

module.exports = router;