const { asyncHandler } = require('../middleware/errorHandler');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get student performance report
// @route   GET /api/reports/student/:studentId
// @access  Private (Teacher, Admin, Own student)
const getStudentReport = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate, subject } = req.query;

  // Check permissions
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // Build date filter
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // Get student info
  const student = await User.findById(studentId).select('name email profile stats');
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }

  // Build aggregation pipeline
  const matchStage = {
    student: new mongoose.Types.ObjectId(studentId),
    status: { $in: ['submitted', 'evaluated'] },
    ...dateFilter,
  };

  // Get submissions with quiz details
  let submissionsQuery = Submission.find(matchStage)
    .populate('quiz', 'title subject metadata createdBy')
    .sort({ createdAt: -1 });

  // Filter by teacher's quizzes if user is teacher
  if (req.user.role === 'teacher') {
    const teacherQuizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    matchStage.quiz = { $in: teacherQuizzes.map(q => q._id) };
    submissionsQuery = Submission.find(matchStage)
      .populate('quiz', 'title subject metadata createdBy')
      .sort({ createdAt: -1 });
  }

  const submissions = await submissionsQuery;

  // Filter by subject if specified
  let filteredSubmissions = submissions;
  if (subject) {
    filteredSubmissions = submissions.filter(sub => 
      sub.quiz.subject.toLowerCase().includes(subject.toLowerCase())
    );
  }

  // Calculate statistics
  const stats = {
    totalQuizzes: filteredSubmissions.length,
    averageScore: filteredSubmissions.length > 0 
      ? filteredSubmissions.reduce((sum, sub) => sum + sub.score.percentage, 0) / filteredSubmissions.length 
      : 0,
    highestScore: filteredSubmissions.length > 0 
      ? Math.max(...filteredSubmissions.map(sub => sub.score.percentage)) 
      : 0,
    lowestScore: filteredSubmissions.length > 0 
      ? Math.min(...filteredSubmissions.map(sub => sub.score.percentage)) 
      : 0,
  };

  // Performance by subject
  const subjectPerformance = {};
  filteredSubmissions.forEach(submission => {
    const subject = submission.quiz.subject;
    if (!subjectPerformance[subject]) {
      subjectPerformance[subject] = {
        totalQuizzes: 0,
        totalScore: 0,
        averageScore: 0,
        scores: [],
      };
    }
    subjectPerformance[subject].totalQuizzes++;
    subjectPerformance[subject].totalScore += submission.score.percentage;
    subjectPerformance[subject].scores.push(submission.score.percentage);
  });

  // Calculate averages for each subject
  Object.keys(subjectPerformance).forEach(subject => {
    const data = subjectPerformance[subject];
    data.averageScore = data.totalScore / data.totalQuizzes;
  });

  // Score trend (last 10 submissions)
  const scoreTrend = filteredSubmissions
    .slice(0, 10)
    .reverse()
    .map(sub => ({
      date: sub.createdAt,
      score: sub.score.percentage,
      quiz: sub.quiz.title,
      subject: sub.quiz.subject,
    }));

  // Weak areas analysis (from AI insights)
  const weakAreas = [];
  const strengths = [];
  
  filteredSubmissions.forEach(submission => {
    if (submission.evaluation.aiInsights) {
      weakAreas.push(...(submission.evaluation.aiInsights.weaknesses || []));
      strengths.push(...(submission.evaluation.aiInsights.strengths || []));
    }
  });

  // Count frequency of weak areas and strengths
  const weakAreaCount = {};
  const strengthCount = {};

  weakAreas.forEach(area => {
    weakAreaCount[area] = (weakAreaCount[area] || 0) + 1;
  });

  strengths.forEach(strength => {
    strengthCount[strength] = (strengthCount[strength] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    data: {
      student,
      stats,
      subjectPerformance,
      scoreTrend,
      weakAreas: Object.entries(weakAreaCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([area, count]) => ({ area, frequency: count })),
      strengths: Object.entries(strengthCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([strength, count]) => ({ strength, frequency: count })),
      recentSubmissions: filteredSubmissions.slice(0, 5),
    },
  });
});

// @desc    Get quiz performance report
// @route   GET /api/reports/quiz/:quizId
// @access  Private (Teacher, Admin)
const getQuizReport = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const quiz = await Quiz.findById(quizId).populate('createdBy', 'name email');
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }

  // Check permissions
  if (req.user.role === 'teacher' && quiz.createdBy._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // Get all submissions for this quiz
  const submissions = await Submission.find({
    quiz: quizId,
    status: { $in: ['submitted', 'evaluated'] },
  }).populate('student', 'name email profilePicture');

  if (submissions.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        quiz,
        stats: {
          totalSubmissions: 0,
          averageScore: 0,
          completionRate: 0,
          passRate: 0,
        },
        submissions: [],
        questionAnalysis: [],
        scoreDistribution: [],
      },
    });
  }

  // Calculate statistics
  const totalAssigned = quiz.assignedTo.length || submissions.length;
  const completedSubmissions = submissions.length;
  const averageScore = submissions.reduce((sum, sub) => sum + sub.score.percentage, 0) / completedSubmissions;
  const passedSubmissions = submissions.filter(sub => sub.score.percentage >= quiz.settings.passingScore).length;

  const stats = {
    totalSubmissions: completedSubmissions,
    averageScore: Math.round(averageScore * 100) / 100,
    completionRate: Math.round((completedSubmissions / totalAssigned) * 100),
    passRate: Math.round((passedSubmissions / completedSubmissions) * 100),
    highestScore: Math.max(...submissions.map(sub => sub.score.percentage)),
    lowestScore: Math.min(...submissions.map(sub => sub.score.percentage)),
  };

  // Question-wise analysis
  const questionAnalysis = quiz.questions.map(question => {
    const questionId = question._id.toString();
    const answersForQuestion = submissions.map(sub => 
      sub.answers.find(ans => ans.questionId.toString() === questionId)
    ).filter(Boolean);

    const correctAnswers = answersForQuestion.filter(ans => ans.isCorrect).length;
    const totalAnswers = answersForQuestion.length;

    return {
      questionId: question._id,
      question: question.question,
      type: question.type,
      totalAnswers,
      correctAnswers,
      successRate: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
      averageTimeSpent: totalAnswers > 0 
        ? answersForQuestion.reduce((sum, ans) => sum + (ans.timeSpent || 0), 0) / totalAnswers 
        : 0,
    };
  });

  // Score distribution
  const scoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0 },
    { range: '21-40', min: 21, max: 40, count: 0 },
    { range: '41-60', min: 41, max: 60, count: 0 },
    { range: '61-80', min: 61, max: 80, count: 0 },
    { range: '81-100', min: 81, max: 100, count: 0 },
  ];

  submissions.forEach(submission => {
    const score = submission.score.percentage;
    scoreRanges.forEach(range => {
      if (score >= range.min && score <= range.max) {
        range.count++;
      }
    });
  });

  res.status(200).json({
    success: true,
    data: {
      quiz,
      stats,
      submissions: submissions.map(sub => ({
        _id: sub._id,
        student: sub.student,
        score: sub.score,
        timing: sub.timing,
        status: sub.status,
        createdAt: sub.createdAt,
      })),
      questionAnalysis,
      scoreDistribution: scoreRanges,
    },
  });
});

// @desc    Get teacher dashboard report
// @route   GET /api/reports/teacher
// @access  Private (Teacher)
const getTeacherReport = asyncHandler(async (req, res) => {
  const teacherId = req.user.id;

  // Get teacher's quizzes
  const quizzes = await Quiz.find({ 
    createdBy: teacherId,
    isActive: true 
  }).sort({ createdAt: -1 });

  const quizIds = quizzes.map(q => q._id);

  // Get submissions for teacher's quizzes
  const submissions = await Submission.find({
    quiz: { $in: quizIds },
    status: { $in: ['submitted', 'evaluated'] },
  }).populate('student', 'name email');

  // Calculate statistics
  const stats = {
    totalQuizzes: quizzes.length,
    publishedQuizzes: quizzes.filter(q => q.status === 'published').length,
    draftQuizzes: quizzes.filter(q => q.status === 'draft').length,
    totalSubmissions: submissions.length,
    averageScore: submissions.length > 0 
      ? submissions.reduce((sum, sub) => sum + sub.score.percentage, 0) / submissions.length 
      : 0,
    pendingEvaluations: submissions.filter(sub => sub.status === 'submitted').length,
    revaluationRequests: submissions.filter(sub => sub.revaluation.requested && sub.revaluation.status === 'pending').length,
  };

  // Recent activity
  const recentSubmissions = submissions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  // Quiz performance overview
  const quizPerformance = await Promise.all(
    quizzes.slice(0, 5).map(async quiz => {
      const quizSubmissions = submissions.filter(sub => sub.quiz.toString() === quiz._id.toString());
      return {
        _id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        totalSubmissions: quizSubmissions.length,
        averageScore: quizSubmissions.length > 0 
          ? quizSubmissions.reduce((sum, sub) => sum + sub.score.percentage, 0) / quizSubmissions.length 
          : 0,
        status: quiz.status,
        createdAt: quiz.createdAt,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      stats,
      recentSubmissions,
      quizPerformance,
      recentQuizzes: quizzes.slice(0, 5),
    },
  });
});

// @desc    Get admin dashboard report
// @route   GET /api/reports/admin
// @access  Private (Admin)
const getAdminReport = asyncHandler(async (req, res) => {
  // System-wide statistics
  const [totalUsers, totalQuizzes, totalSubmissions] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Quiz.countDocuments({ isActive: true }),
    Submission.countDocuments(),
  ]);

  const usersByRole = await User.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  const quizzesByStatus = await Quiz.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Recent activity
  const recentUsers = await User.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name email role createdAt');

  const recentQuizzes = await Quiz.find({ isActive: true })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  // System performance metrics
  const performanceMetrics = await Submission.aggregate([
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score.percentage' },
        totalSubmissions: { $sum: 1 },
        completedSubmissions: {
          $sum: {
            $cond: [{ $in: ['$status', ['submitted', 'evaluated']] }, 1, 0]
          }
        },
      }
    }
  ]);

  const metrics = performanceMetrics[0] || {
    averageScore: 0,
    totalSubmissions: 0,
    completedSubmissions: 0,
  };

  res.status(200).json({
    success: true,
    data: {
      systemStats: {
        totalUsers,
        totalQuizzes,
        totalSubmissions,
        averageScore: Math.round(metrics.averageScore * 100) / 100,
      },
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      quizzesByStatus: quizzesByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentUsers,
      recentQuizzes,
      completionRate: metrics.totalSubmissions > 0 
        ? Math.round((metrics.completedSubmissions / metrics.totalSubmissions) * 100) 
        : 0,
    },
  });
});

module.exports = {
  getStudentReport,
  getQuizReport,
  getTeacherReport,
  getAdminReport,
};