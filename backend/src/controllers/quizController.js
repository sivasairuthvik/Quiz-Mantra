const { asyncHandler } = require('../middleware/errorHandler');
const Quiz = require('../models/Quiz');
const Submission = require('../models/Submission');
const User = require('../models/User');
const PDFProcessor = require('../utils/pdfProcessor');
const geminiAI = require('../utils/geminiAI');
const { getFileInfo, deleteFile } = require('../utils/fileUpload');

// @desc    Get all quizzes
// @route   GET /api/quiz
// @access  Private
const getQuizzes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const subject = req.query.subject;
  const status = req.query.status;
  const createdBy = req.query.createdBy;

  const startIndex = (page - 1) * limit;

  // Build query based on user role
  let query = { isActive: true };

  // Students can only see published quizzes assigned to them or public quizzes
  if (req.user.role === 'student') {
    query.$or = [
      { assignedTo: req.user.id, status: 'published' },
      { status: 'published', assignedTo: { $size: 0 } }, // Public quizzes
    ];
  } else if (req.user.role === 'teacher') {
    // Teachers can see their own quizzes and public quizzes
    query.$or = [
      { createdBy: req.user.id },
      { status: 'published', assignedTo: { $size: 0 } },
    ];
  }
  // Admins can see all quizzes (no additional filtering)

  // Apply filters
  if (subject) query.subject = { $regex: subject, $options: 'i' };
  if (status) query.status = status;
  if (createdBy) query.createdBy = createdBy;

  let quizzes = await Quiz.find(query)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Filter out quizzes with missing required fields or invalid questions
  quizzes = quizzes.filter(q => {
    if (!q.title || !q.subject || !Array.isArray(q.questions)) return false;
    for (const question of q.questions) {
      if (!question.question || typeof question.question !== 'string' || !question.question.trim()) return false;
    }
    return true;
  });

  const total = quizzes.length;

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  res.status(200).json({
    success: true,
    data: quizzes,
    pagination,
  });
});

// @desc    Get single quiz
// @route   GET /api/quiz/:id
// @access  Private
const getQuiz = asyncHandler(async (req, res) => {
  // Validate ObjectId
  if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid quiz id',
    });
  }

  const quiz = await Quiz.findById(req.params.id)
    .populate('createdBy', 'name email profilePicture')
    .populate('assignedTo', 'name email');

  if (!quiz || !quiz.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }

  // Check access permissions
  const hasAccess = 
    req.user.role === 'admin' ||
    quiz.createdBy._id.toString() === req.user.id ||
    quiz.assignedTo.some(user => user._id.toString() === req.user.id) ||
    (quiz.status === 'published' && quiz.assignedTo.length === 0);

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this quiz',
    });
  }

  res.status(200).json({
    success: true,
    data: quiz,
  });
});

// @desc    Create quiz
// @route   POST /api/quiz
// @access  Private (Teacher, Admin)
const createQuiz = asyncHandler(async (req, res) => {
  const quizData = {
    ...req.body,
    createdBy: req.user.id,
  };

  const quiz = await Quiz.create(quizData);
  await quiz.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    data: quiz,
    message: 'Quiz created successfully',
  });
});

// @desc    Update quiz
// @route   PUT /api/quiz/:id
// @access  Private (Owner, Admin)
const updateQuiz = asyncHandler(async (req, res) => {
  let quiz = await Quiz.findById(req.params.id);

  if (!quiz || !quiz.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }

  // Check ownership
  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this quiz',
    });
  }

  quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: quiz,
    message: 'Quiz updated successfully',
  });
});

// @desc    Delete quiz
// @route   DELETE /api/quiz/:id
// @access  Private (Owner, Admin)
const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz || !quiz.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }

  // Check ownership
  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this quiz',
    });
  }

  // Soft delete
  await Quiz.findByIdAndUpdate(req.params.id, { isActive: false });

  res.status(200).json({
    success: true,
    message: 'Quiz deleted successfully',
  });
});

// @desc    Upload PDF and generate quiz
// @route   POST /api/quiz/upload
// @access  Private (Teacher, Admin)
const uploadPDFAndGenerateQuiz = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a PDF file',
    });
  }

  try {
    // Get file info
    const fileInfo = getFileInfo(req.file);
    
    // Process PDF
    const pdfData = await PDFProcessor.processPDFForQuiz(req.file.path);
    
    // Generate questions using AI
    const options = {
      numberOfQuestions: parseInt(req.body.numberOfQuestions) || 10,
      difficulty: req.body.difficulty || 'medium',
      questionTypes: req.body.questionTypes ? req.body.questionTypes.split(',') : ['multiple-choice', 'short-answer'],
      subject: req.body.subject || pdfData.metadata.subject || 'General',
    };

    const questions = await geminiAI.generateQuestionsFromText(pdfData.text, options);

    // Create quiz draft
    const quizData = {
      title: req.body.title || pdfData.metadata.title || 'Generated Quiz',
      description: req.body.description || `Quiz generated from uploaded PDF: ${req.file.originalname}`,
      subject: options.subject,
      questions: questions,
      createdBy: req.user.id,
      status: 'draft',
      metadata: {
        ...req.body.metadata,
        generatedFromPDF: true,
        originalFile: fileInfo,
        keyTopics: pdfData.keyTopics,
      },
    };

    const quiz = await Quiz.create(quizData);
    await quiz.populate('createdBy', 'name email');

    // Clean up uploaded file after processing
    deleteFile(req.file.path);

    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Quiz generated successfully from PDF',
      metadata: {
        questionsGenerated: questions.length,
        keyTopics: pdfData.keyTopics,
        pages: pdfData.pages,
      },
    });
  } catch (error) {
    // Clean up uploaded file on error
    deleteFile(req.file.path);
    throw error;
  }
});

// @desc    Assign quiz to students
// @route   POST /api/quiz/:id/assign
// @access  Private (Teacher, Admin)
const assignQuiz = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;
  
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz || !quiz.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }

  // Check ownership
  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to assign this quiz',
    });
  }

  // Validate student IDs
  const students = await User.find({
    _id: { $in: studentIds },
    role: 'student',
    isActive: true,
  });

  if (students.length !== studentIds.length) {
    return res.status(400).json({
      success: false,
      message: 'Some student IDs are invalid',
    });
  }

  // Update quiz with assigned students
  quiz.assignedTo = [...new Set([...quiz.assignedTo, ...studentIds])];
  await quiz.save();

  res.status(200).json({
    success: true,
    data: quiz,
    message: `Quiz assigned to ${students.length} students`,
  });
});

// @desc    Start quiz attempt
// @route   POST /api/quiz/:id/start
// @access  Private (Student)
const startQuizAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz || !quiz.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }

  // Check if quiz is available
  if (!quiz.isAvailable()) {
    return res.status(400).json({
      success: false,
      message: 'Quiz is not available at this time',
    });
  }

  // Check if student has access
  const hasAccess = 
    quiz.assignedTo.includes(req.user.id) ||
    (quiz.assignedTo.length === 0 && quiz.status === 'published');

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to this quiz',
    });
  }

  // Check for existing attempt
  const existingSubmission = await Submission.findOne({
    quiz: req.params.id,
    student: req.user.id,
    status: 'in-progress',
  });

  if (existingSubmission) {
    return res.status(400).json({
      success: false,
      message: 'You already have an ongoing attempt for this quiz',
      data: existingSubmission,
    });
  }

  // Check if retakes are allowed
  if (!quiz.settings.allowRetake) {
    const completedSubmission = await Submission.findOne({
      quiz: req.params.id,
      student: req.user.id,
      status: { $in: ['submitted', 'evaluated'] },
    });

    if (completedSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Retakes are not allowed for this quiz',
      });
    }
  }

  // Create new submission
  const submission = await Submission.create({
    quiz: req.params.id,
    student: req.user.id,
    timing: {
      startTime: new Date(),
      timeLimit: quiz.settings.timeLimit * 60, // Convert minutes to seconds
    },
    metadata: {
      browserInfo: req.headers['user-agent'],
      ipAddress: req.ip,
    },
  });

  // Return quiz questions without correct answers for students
  const sanitizedQuiz = {
    ...quiz.toObject(),
    questions: quiz.questions.map(q => ({
      _id: q._id,
      type: q.type,
      question: q.question,
      options: q.type === 'multiple-choice' ? q.options.map(opt => ({
        text: opt.text,
        _id: opt._id,
      })) : undefined,
      points: q.points,
      tags: q.tags,
    })),
  };

  res.status(201).json({
    success: true,
    data: {
      quiz: sanitizedQuiz,
      submission,
    },
    message: 'Quiz attempt started successfully',
  });
});

// @desc    Submit quiz answers
// @route   POST /api/quiz/:id/submit
// @access  Private (Student)
const submitQuiz = asyncHandler(async (req, res) => {
  const { submissionId, answers } = req.body;

  const submission = await Submission.findOne({
    _id: submissionId,
    student: req.user.id,
    status: 'in-progress',
  });

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Active submission not found',
    });
  }

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }

  // Check time limit
  const currentTime = new Date();
  const timeElapsed = Math.floor((currentTime - submission.timing.startTime) / 1000);
  
  if (submission.timing.timeLimit && timeElapsed > submission.timing.timeLimit) {
    return res.status(400).json({
      success: false,
      message: 'Time limit exceeded',
    });
  }

  // Process and validate answers
  const processedAnswers = answers.map(answer => {
    const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
    let isCorrect = false;
    let points = 0;

    if (question) {
      if (question.type === 'multiple-choice') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = correctOption && correctOption.text === answer.answer;
      } else if (question.type === 'true-false') {
        isCorrect = question.correctAnswer.toLowerCase() === answer.answer.toLowerCase();
      } else if (question.type === 'short-answer') {
        // Simple string matching (can be enhanced with AI evaluation)
        isCorrect = question.correctAnswer.toLowerCase().trim() === answer.answer.toLowerCase().trim();
      }

      if (isCorrect) {
        points = question.points || 1;
      }
    }

    return {
      questionId: answer.questionId,
      answer: answer.answer,
      isCorrect,
      points,
      timeSpent: answer.timeSpent || 0,
    };
  });

  // Update submission
  submission.answers = processedAnswers;
  submission.calculateScore(quiz.questions);
  submission.finishSubmission();

  // Auto-evaluate if enabled
  if (quiz.settings.autoGrade) {
    submission.status = 'evaluated';
    submission.evaluation.autoGraded = true;
    submission.evaluation.evaluatedAt = new Date();
  }

  await submission.save();

  // Update quiz and user statistics
  await quiz.updateStatistics(submission.score.percentage);
  await req.user.updateStats(submission.score.percentage);

  res.status(200).json({
    success: true,
    data: submission,
    message: 'Quiz submitted successfully',
  });
});

// @desc    Generate AI feedback for submission
// @route   POST /api/quiz/submission/:id/feedback
// @access  Private (Teacher, Admin)
const generateAIFeedback = asyncHandler(async (req, res) => {
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
      message: 'Not authorized to generate feedback for this submission',
    });
  }

  try {
    // Generate AI insights
    const aiInsights = await geminiAI.evaluateSubmission(
      quiz,
      submission,
      submission.answers
    );

    // Update submission with AI feedback
    submission.evaluation.aiInsights = aiInsights;
    submission.evaluation.evaluatedAt = new Date();
    submission.evaluation.evaluatedBy = req.user.id;
    submission.status = 'evaluated';

    await submission.save();

    res.status(200).json({
      success: true,
      data: submission,
      message: 'AI feedback generated successfully',
    });
  } catch (error) {
    console.error('AI feedback generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI feedback',
    });
  }
});

module.exports = {
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
};