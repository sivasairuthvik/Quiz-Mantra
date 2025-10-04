const { asyncHandler } = require('../middleware/errorHandler');
const Competition = require('../models/Competition');
const Quiz = require('../models/Quiz');
const Submission = require('../models/Submission');
const User = require('../models/User');

// @desc    Get competitions
// @route   GET /api/competitions
// @access  Private
const getCompetitions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const type = req.query.type;
  const status = req.query.status;

  const startIndex = (page - 1) * limit;

  // Build query
  let query = {};
  
  // Students can only see public competitions or ones they're eligible for
  if (req.user.role === 'student') {
    query.$or = [
      { 'settings.isPublic': true },
      { 'participants.user': req.user.id },
    ];
  } else if (req.user.role === 'teacher') {
    // Teachers can see public competitions and ones they created
    query.$or = [
      { 'settings.isPublic': true },
      { createdBy: req.user.id },
    ];
  }
  // Admins can see all competitions

  // Apply filters
  if (type) query.type = type;
  if (status) query.status = status;

  const competitions = await Competition.find(query)
    .populate('createdBy', 'name email profilePicture')
    .populate('quiz', 'title subject metadata')
    .sort({ 'schedule.competitionStart': -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await Competition.countDocuments(query);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  res.status(200).json({
    success: true,
    data: competitions,
    pagination,
  });
});

// @desc    Get single competition
// @route   GET /api/competitions/:id
// @access  Private
const getCompetition = asyncHandler(async (req, res) => {
  const competition = await Competition.findById(req.params.id)
    .populate('createdBy', 'name email profilePicture')
    .populate('quiz', 'title subject description metadata settings')
    .populate('participants.user', 'name email profilePicture')
    .populate('leaderboard.user', 'name email profilePicture');

  if (!competition) {
    return res.status(404).json({
      success: false,
      message: 'Competition not found',
    });
  }

  // Check access permissions
  const hasAccess = 
    req.user.role === 'admin' ||
    competition.createdBy._id.toString() === req.user.id ||
    competition.settings.isPublic ||
    competition.participants.some(p => p.user._id.toString() === req.user.id);

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this competition',
    });
  }

  res.status(200).json({
    success: true,
    data: competition,
  });
});

// @desc    Create competition
// @route   POST /api/competitions
// @access  Private (Teacher, Admin)
const createCompetition = asyncHandler(async (req, res) => {
  // Verify quiz exists and user has access
  const quiz = await Quiz.findById(req.body.quiz);
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }

  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'You can only create competitions for your own quizzes',
    });
  }

  const competitionData = {
    ...req.body,
    createdBy: req.user.id,
  };

  const competition = await Competition.create(competitionData);
  await competition.populate('createdBy', 'name email profilePicture');
  await competition.populate('quiz', 'title subject metadata');

  res.status(201).json({
    success: true,
    data: competition,
    message: 'Competition created successfully',
  });
});

// @desc    Update competition
// @route   PUT /api/competitions/:id
// @access  Private (Owner, Admin)
const updateCompetition = asyncHandler(async (req, res) => {
  let competition = await Competition.findById(req.params.id);

  if (!competition) {
    return res.status(404).json({
      success: false,
      message: 'Competition not found',
    });
  }

  // Check ownership
  if (competition.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this competition',
    });
  }

  // Don't allow updates if competition is active
  if (competition.status === 'active') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update active competition',
    });
  }

  competition = await Competition.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('createdBy', 'name email profilePicture')
    .populate('quiz', 'title subject metadata');

  res.status(200).json({
    success: true,
    data: competition,
    message: 'Competition updated successfully',
  });
});

// @desc    Delete competition
// @route   DELETE /api/competitions/:id
// @access  Private (Owner, Admin)
const deleteCompetition = asyncHandler(async (req, res) => {
  const competition = await Competition.findById(req.params.id);

  if (!competition) {
    return res.status(404).json({
      success: false,
      message: 'Competition not found',
    });
  }

  // Check ownership
  if (competition.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this competition',
    });
  }

  await Competition.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Competition deleted successfully',
  });
});

// @desc    Register for competition
// @route   POST /api/competitions/:id/register
// @access  Private (Student)
const registerForCompetition = asyncHandler(async (req, res) => {
  const competition = await Competition.findById(req.params.id);

  if (!competition) {
    return res.status(404).json({
      success: false,
      message: 'Competition not found',
    });
  }

  // Check if registration is open
  if (!competition.canRegister()) {
    return res.status(400).json({
      success: false,
      message: 'Registration is not available for this competition',
    });
  }

  // Check if user is already registered
  const isRegistered = competition.participants.some(
    p => p.user.toString() === req.user.id
  );

  if (isRegistered) {
    return res.status(400).json({
      success: false,
      message: 'You are already registered for this competition',
    });
  }

  // Add participant
  const success = competition.addParticipant(req.user.id);
  if (!success) {
    return res.status(400).json({
      success: false,
      message: 'Unable to register for competition',
    });
  }

  await competition.save();

  res.status(200).json({
    success: true,
    data: competition,
    message: 'Successfully registered for competition',
  });
});

// @desc    Submit competition entry
// @route   POST /api/competitions/:id/submit
// @access  Private (Student)
const submitCompetitionEntry = asyncHandler(async (req, res) => {
  const { submissionId } = req.body;

  const competition = await Competition.findById(req.params.id);
  if (!competition) {
    return res.status(404).json({
      success: false,
      message: 'Competition not found',
    });
  }

  // Check if competition is active
  if (!competition.isActive()) {
    return res.status(400).json({
      success: false,
      message: 'Competition is not active',
    });
  }

  // Check if user is registered
  const participant = competition.participants.find(
    p => p.user.toString() === req.user.id
  );

  if (!participant) {
    return res.status(403).json({
      success: false,
      message: 'You are not registered for this competition',
    });
  }

  // Get submission
  const submission = await Submission.findById(submissionId)
    .populate('quiz');

  if (!submission || submission.student.toString() !== req.user.id) {
    return res.status(404).json({
      success: false,
      message: 'Submission not found',
    });
  }

  if (submission.quiz._id.toString() !== competition.quiz.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Submission is for a different quiz',
    });
  }

  // Check if user already has an entry in leaderboard
  const existingEntry = competition.leaderboard.find(
    entry => entry.user.toString() === req.user.id
  );

  if (existingEntry) {
    // Update existing entry if new score is better
    if (submission.score.percentage > existingEntry.percentage) {
      existingEntry.score = submission.score.total;
      existingEntry.percentage = submission.score.percentage;
      existingEntry.completionTime = submission.timing.totalTime;
      existingEntry.submission = submissionId;
      existingEntry.completedAt = submission.timing.endTime;
    }
  } else {
    // Add new entry
    competition.leaderboard.push({
      user: req.user.id,
      submission: submissionId,
      score: submission.score.total,
      percentage: submission.score.percentage,
      completionTime: submission.timing.totalTime,
      completedAt: submission.timing.endTime,
    });
  }

  // Update participant status
  participant.status = 'participated';

  // Update leaderboard rankings
  await competition.updateLeaderboard();

  res.status(200).json({
    success: true,
    data: competition,
    message: 'Competition entry submitted successfully',
  });
});

// @desc    Get competition leaderboard
// @route   GET /api/competitions/:id/leaderboard
// @access  Private
const getLeaderboard = asyncHandler(async (req, res) => {
  const competition = await Competition.findById(req.params.id)
    .populate('leaderboard.user', 'name email profilePicture')
    .select('leaderboard title settings');

  if (!competition) {
    return res.status(404).json({
      success: false,
      message: 'Competition not found',
    });
  }

  // Check if leaderboard should be shown
  if (!competition.settings.showLeaderboard && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Leaderboard is not public for this competition',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      title: competition.title,
      leaderboard: competition.leaderboard,
    },
  });
});

// @desc    Get competition statistics
// @route   GET /api/competitions/stats
// @access  Private (Teacher, Admin)
const getCompetitionStats = asyncHandler(async (req, res) => {
  let matchStage = {};

  // Filter based on user role
  if (req.user.role === 'teacher') {
    matchStage.createdBy = req.user._id;
  }

  const stats = await Competition.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCompetitions: { $sum: 1 },
        activeCompetitions: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedCompetitions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalParticipants: { $sum: '$statistics.totalParticipants' },
        averageParticipants: { $avg: '$statistics.totalParticipants' },
      }
    }
  ]);

  const result = stats[0] || {
    totalCompetitions: 0,
    activeCompetitions: 0,
    completedCompetitions: 0,
    totalParticipants: 0,
    averageParticipants: 0,
  };

  // Get recent competitions
  const recentCompetitions = await Competition.find(matchStage)
    .populate('createdBy', 'name email')
    .populate('quiz', 'title subject')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title type status statistics schedule createdAt');

  res.status(200).json({
    success: true,
    data: {
      stats: result,
      recentCompetitions,
    },
  });
});

module.exports = {
  getCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  registerForCompetition,
  submitCompetitionEntry,
  getLeaderboard,
  getCompetitionStats,
};