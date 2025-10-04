const express = require('express');
const router = express.Router();

const {
  getCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  registerForCompetition,
  submitCompetitionEntry,
  getLeaderboard,
  getCompetitionStats,
} = require('../controllers/competitionController');

const { authenticate, authorize } = require('../middleware/auth');
const { validateCompetition } = require('../middleware/validation');

// General routes
router.get('/', authenticate, getCompetitions);
router.get('/stats', authenticate, authorize('teacher', 'admin'), getCompetitionStats);
router.get('/:id', authenticate, getCompetition);
router.get('/:id/leaderboard', authenticate, getLeaderboard);

// Student routes
router.post('/:id/register', authenticate, authorize('student'), registerForCompetition);
router.post('/:id/submit', authenticate, authorize('student'), submitCompetitionEntry);

// Teacher/Admin routes
router.post('/', authenticate, authorize('teacher', 'admin'), validateCompetition, createCompetition);
router.put('/:id', authenticate, authorize('teacher', 'admin'), validateCompetition, updateCompetition);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), deleteCompetition);

module.exports = router;