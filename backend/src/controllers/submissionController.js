const { asyncHandler } = require('../middleware/errorHandler');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const geminiAI = require('../utils/geminiAI');

// @desc    Get all submissions
// @route   GET /api/submissions
// @access  Private
const getSubmissions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const status = req.query.status;
  const quizId = req.query.quiz;

  const startIndex = (page - 1) * limit;

  // Build query based on user role
  let query = {};

  if (req.user.role === 'student') {
    query.student = req.user.id;
  } else if (req.user.role === 'teacher') {
    // Teachers can see submissions for their quizzes
    const teacherQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    query.quiz = { $in: teacherQuizzes.map(q => q._id) };
  }
  // Admins can see all submissions (no additional filtering)

  // Apply filters
  if (status) query.status = status;
  if (quizId) query.quiz = quizId;

  const submissions = await Submission.find(query)
    .populate('quiz', 'title subject metadata.totalPoints')
    .populate('student', 'name email profilePicture')
    .populate('evaluation.evaluatedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await Submission.countDocuments(query);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  res.status(200).json({
    success: true,
    data: submissions,
    pagination,
  });
});

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
const getSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('quiz')
    .populate('student', 'name email profilePicture')
    .populate('evaluation.evaluatedBy', 'name email');

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found',
    });
  }

  // Check access permissions
  const hasAccess = 
    req.user.role === 'admin' ||
    submission.student._id.toString() === req.user.id ||
    submission.quiz.createdBy.toString() === req.user.id;

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this submission',
    });
  }

  res.status(200).json({
    success: true,
    data: submission,
  });
});

// @desc    Evaluate submission
// @route   PUT /api/submissions/:id/evaluate
// @access  Private (Teacher, Admin)
const evaluateSubmission = asyncHandler(async (req, res) => {
  const { feedback, manualGrades } = req.body;

  const submission = await Submission.findById(req.params.id)
    .populate('quiz')
    .populate('student', 'name email');

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found',
    });
  }

  // Check permissions
  const quiz = submission.quiz;
  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to evaluate this submission',
    });
  }

  // Apply manual grades if provided
  if (manualGrades && Array.isArray(manualGrades)) {
    manualGrades.forEach(grade => {
      const answerIndex = submission.answers.findIndex(
        a => a.questionId.toString() === grade.questionId
      );
      if (answerIndex !== -1) {
        submission.answers[answerIndex].points = grade.points;
        submission.answers[answerIndex].isCorrect = grade.points > 0;
      }
    });

    // Recalculate score
    submission.calculateScore(quiz.questions);
  }

  // Update evaluation
  submission.evaluation.evaluatedBy = req.user.id;
  submission.evaluation.evaluatedAt = new Date();
  submission.evaluation.feedback = feedback;
  submission.status = 'evaluated';

  // Generate AI insights if not already present
  if (!submission.evaluation.aiInsights) {
    try {
      const aiInsights = await geminiAI.evaluateSubmission(
        quiz,
        submission,
        submission.answers
      );
      submission.evaluation.aiInsights = aiInsights;
    } catch (error) {
      console.error('AI evaluation error:', error);
      // Continue without AI insights if it fails
    }
  }

  await submission.save();

  res.status(200).json({
    success: true,
    data: submission,
    message: 'Submission evaluated successfully',
  });
});

// @desc    Request revaluation
// @route   POST /api/submissions/:id/revaluation
// @access  Private (Student)
const requestRevaluation = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const submission = await Submission.findById(req.params.id);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found',
    });
  }

  // Check if student owns this submission
  if (submission.student.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to request revaluation for this submission',
    });
  }

  // Check if submission is evaluated
  if (submission.status !== 'evaluated') {
    return res.status(400).json({
      success: false,
      message: 'Can only request revaluation for evaluated submissions',
    });
  }

  // Check if revaluation already requested
  if (submission.revaluation.requested) {
    return res.status(400).json({
      success: false,
      message: 'Revaluation already requested for this submission',
    });
  }

  // Update revaluation request
  submission.revaluation.requested = true;
  submission.revaluation.requestedAt = new Date();
  submission.revaluation.reason = reason;
  submission.revaluation.status = 'pending';

  await submission.save();

  res.status(200).json({
    success: true,
    data: submission,
    message: 'Revaluation requested successfully',
  });
});

// @desc    Handle revaluation request
// @route   PUT /api/submissions/:id/revaluation
// @access  Private (Teacher, Admin)
const handleRevaluation = asyncHandler(async (req, res) => {
  const { status, response, newGrades } = req.body;

  const submission = await Submission.findById(req.params.id)
    .populate('quiz')
    .populate('student', 'name email');

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found',
    });
  }

  // Check permissions
  const quiz = submission.quiz;
  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to handle revaluation for this submission',
    });
  }

  // Check if revaluation was requested
  if (!submission.revaluation.requested) {
    return res.status(400).json({
      success: false,
      message: 'No revaluation request found for this submission',
    });
  }

  // Update revaluation
  submission.revaluation.status = status;
  submission.revaluation.handledBy = req.user.id;
  submission.revaluation.handledAt = new Date();
  submission.revaluation.response = response;

  // Apply new grades if approved
  if (status === 'approved' && newGrades) {
    newGrades.forEach(grade => {
      const answerIndex = submission.answers.findIndex(
        a => a.questionId.toString() === grade.questionId
      );
      if (answerIndex !== -1) {
        submission.answers[answerIndex].points = grade.points;
        submission.answers[answerIndex].isCorrect = grade.points > 0;
      }
    });

    // Recalculate score
    submission.calculateScore(quiz.questions);
  }

  await submission.save();

  res.status(200).json({
    success: true,
    data: submission,
    message: `Revaluation ${status} successfully`,
  });
});

// @desc    Get submission statistics
// @route   GET /api/submissions/stats
// @access  Private
const getSubmissionStats = asyncHandler(async (req, res) => {
  let matchStage = {};

  // Filter based on user role
  if (req.user.role === 'student') {
    matchStage.student = req.user._id;
  } else if (req.user.role === 'teacher') {
    // Get teacher's quizzes
    const teacherQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    matchStage.quiz = { $in: teacherQuizzes.map(q => q._id) };
  }

  const stats = await Submission.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        averageScore: { $avg: '$score.percentage' },
        completedSubmissions: {
          $sum: {
            $cond: [{ $in: ['$status', ['submitted', 'evaluated']] }, 1, 0]
          }
        },
        inProgressSubmissions: {
          $sum: {
            $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0]
          }
        },
        revaluationRequests: {
          $sum: {
            $cond: ['$revaluation.requested', 1, 0]
          }
        },
      }
    },
  ]);

  const result = stats[0] || {
    totalSubmissions: 0,
    averageScore: 0,
    completedSubmissions: 0,
    inProgressSubmissions: 0,
    revaluationRequests: 0,
  };

  // Get recent submissions for trend analysis
  const recentSubmissions = await Submission.find(matchStage)
    .sort({ createdAt: -1 })
    .limit(10)
    .select('score.percentage createdAt status')
    .populate('quiz', 'title subject');

  res.status(200).json({
    success: true,
    data: {
      stats: result,
      recentSubmissions,
    },
  });
});

module.exports = {
  getSubmissions,
  getSubmission,
  evaluateSubmission,
  requestRevaluation,
  handleRevaluation,
  getSubmissionStats,
};