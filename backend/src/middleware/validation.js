const { body, validationResult } = require('express-validator');

// Custom validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Quiz validation rules
const validateQuiz = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('subject')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject must be between 2 and 100 characters'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('Quiz must have at least one question'),
  body('questions.*.question')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Question must be at least 10 characters long'),
  body('questions.*.type')
    .isIn(['multiple-choice', 'short-answer', 'true-false', 'essay'])
    .withMessage('Invalid question type'),
  handleValidationErrors,
];

// User profile validation rules
const validateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('profile.institution')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Institution name must be less than 200 characters'),
  handleValidationErrors,
];

// Message validation rules
const validateMessage = [
  body('recipient')
    .isMongoId()
    .withMessage('Valid recipient ID is required'),
  body('subject')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject must be between 3 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Content must be between 10 and 2000 characters'),
  body('type')
    .optional()
    .isIn(['feedback', 'hint', 'revaluation', 'announcement', 'general'])
    .withMessage('Invalid message type'),
  handleValidationErrors,
];

// Competition validation rules
const validateCompetition = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('type')
    .isIn(['class', 'inter-class', 'inter-college', 'public'])
    .withMessage('Invalid competition type'),
  body('quiz')
    .isMongoId()
    .withMessage('Valid quiz ID is required'),
  body('schedule.registrationStart')
    .isISO8601()
    .withMessage('Valid registration start date is required'),
  body('schedule.registrationEnd')
    .isISO8601()
    .withMessage('Valid registration end date is required'),
  body('schedule.competitionStart')
    .isISO8601()
    .withMessage('Valid competition start date is required'),
  body('schedule.competitionEnd')
    .isISO8601()
    .withMessage('Valid competition end date is required'),
  handleValidationErrors,
];

// Announcement validation rules
const validateAnnouncement = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Content must be between 10 and 2000 characters'),
  body('type')
    .optional()
    .isIn(['general', 'quiz', 'deadline', 'result', 'maintenance', 'competition'])
    .withMessage('Invalid announcement type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  handleValidationErrors,
];

module.exports = {
  validateQuiz,
  validateProfile,
  validateMessage,
  validateCompetition,
  validateAnnouncement,
  handleValidationErrors,
};