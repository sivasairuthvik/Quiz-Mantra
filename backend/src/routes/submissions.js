const express = require('express');
const router = express.Router();

const {
  getSubmissions,
  getSubmission,
  evaluateSubmission,
  requestRevaluation,
  handleRevaluation,
  getSubmissionStats,
} = require('../controllers/submissionController');

const { authenticate, authorize } = require('../middleware/auth');

// General routes
router.get('/', authenticate, getSubmissions);
router.get('/stats', authenticate, getSubmissionStats);
router.get('/:id', authenticate, getSubmission);

// Student routes
router.post('/:id/revaluation', authenticate, authorize('student'), requestRevaluation);

// Teacher/Admin routes
router.put('/:id/evaluate', authenticate, authorize('teacher', 'admin'), evaluateSubmission);
router.put('/:id/revaluation', authenticate, authorize('teacher', 'admin'), handleRevaluation);

module.exports = router;