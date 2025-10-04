const express = require('express');
const router = express.Router();

const {
  getStudentReport,
  getQuizReport,
  getTeacherReport,
  getAdminReport,
} = require('../controllers/reportController');

const { authenticate, authorize } = require('../middleware/auth');

// Student reports (accessible by student, teacher, admin)
router.get('/student/:studentId', authenticate, getStudentReport);

// Quiz reports (teacher/admin only)
router.get('/quiz/:quizId', authenticate, authorize('teacher', 'admin'), getQuizReport);

// Role-specific dashboard reports
router.get('/teacher', authenticate, authorize('teacher'), getTeacherReport);
router.get('/admin', authenticate, authorize('admin'), getAdminReport);

module.exports = router;