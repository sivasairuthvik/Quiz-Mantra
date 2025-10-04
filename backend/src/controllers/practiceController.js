const { asyncHandler } = require('../middleware/errorHandler');
const geminiAI = require('../utils/geminiAI');
const Quiz = require('../models/Quiz');
const Submission = require('../models/Submission');

// @desc    Generate practice quiz
// @route   POST /api/practice
// @access  Private (Student)
const generatePracticeQuiz = asyncHandler(async (req, res) => {
  const { subject, difficulty = 'medium', numberOfQuestions = 10 } = req.body;

  if (!subject) {
    return res.status(400).json({
      success: false,
      message: 'Subject is required',
    });
  }

  try {
    // Generate questions using AI
    const questions = await geminiAI.generatePracticeQuiz(subject, difficulty, numberOfQuestions);

    // Create temporary practice quiz
    const practiceQuiz = {
      title: `Practice Quiz - ${subject}`,
      description: `AI-generated practice quiz for ${subject}`,
      subject,
      questions,
      createdBy: req.user.id,
      status: 'published',
      metadata: {
        isPracticeQuiz: true,
        difficulty,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
      },
      settings: {
        timeLimit: Math.max(numberOfQuestions * 2, 30), // 2 minutes per question, minimum 30
        allowRetake: true,
        shuffleQuestions: true,
        showResults: true,
        autoGrade: true,
      },
    };

    res.status(200).json({
      success: true,
      data: practiceQuiz,
      message: 'Practice quiz generated successfully',
    });
  } catch (error) {
    console.error('Practice quiz generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate practice quiz',
    });
  }
});

// @desc    Get user's performance analysis
// @route   GET /api/practice/analysis
// @access  Private (Student)
const getPerformanceAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get recent submissions
  const recentSubmissions = await Submission.find({
    student: userId,
    status: { $in: ['submitted', 'evaluated'] },
  })
    .populate('quiz', 'subject metadata')
    .sort({ createdAt: -1 })
    .limit(20);

  if (recentSubmissions.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        message: 'No quiz attempts found. Take some quizzes to get personalized analysis!',
        suggestions: [
          'Start with practice quizzes in your preferred subjects',
          'Take quizzes regularly to track your progress',
          'Review your mistakes to improve performance',
        ],
      },
    });
  }

  // Prepare data for AI analysis
  const scores = recentSubmissions.map(sub => sub.score.percentage);
  const subjects = [...new Set(recentSubmissions.map(sub => sub.quiz.subject))];
  
  // Extract weak areas and strengths from AI insights
  const weakAreas = [];
  const strengths = [];
  
  recentSubmissions.forEach(submission => {
    if (submission.evaluation.aiInsights) {
      weakAreas.push(...(submission.evaluation.aiInsights.weaknesses || []));
      strengths.push(...(submission.evaluation.aiInsights.strengths || []));
    }
  });

  const studentData = {
    submissions: recentSubmissions.length,
    recentScores: scores.slice(0, 10),
    weakAreas: [...new Set(weakAreas)].slice(0, 5),
    strengths: [...new Set(strengths)].slice(0, 5),
  };

  try {
    // Get AI analysis
    const analysis = await geminiAI.analyzePerformanceTrends(studentData);

    // Calculate additional statistics
    const stats = {
      totalQuizzes: recentSubmissions.length,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      subjectBreakdown: {},
    };

    // Subject-wise performance
    subjects.forEach(subject => {
      const subjectSubmissions = recentSubmissions.filter(sub => sub.quiz.subject === subject);
      const subjectScores = subjectSubmissions.map(sub => sub.score.percentage);
      
      stats.subjectBreakdown[subject] = {
        attempts: subjectSubmissions.length,
        averageScore: subjectScores.reduce((sum, score) => sum + score, 0) / subjectScores.length,
        trend: subjectScores.length > 1 ? 
          (subjectScores[0] > subjectScores[subjectScores.length - 1] ? 'improving' : 'declining') : 'stable',
      };
    });

    res.status(200).json({
      success: true,
      data: {
        stats,
        analysis,
        recentPerformance: recentSubmissions.slice(0, 5).map(sub => ({
          quiz: sub.quiz.title,
          subject: sub.quiz.subject,
          score: sub.score.percentage,
          date: sub.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Performance analysis error:', error);
    
    // Fallback analysis without AI
    const basicStats = {
      totalQuizzes: recentSubmissions.length,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      trend: scores.length > 1 ? 
        (scores[0] > scores[scores.length - 1] ? 'improving' : 'declining') : 'stable',
      strongSubjects: subjects.slice(0, 3),
      recommendations: [
        'Continue practicing regularly',
        'Focus on weak areas identified in quiz feedback',
        'Try different difficulty levels to challenge yourself',
      ],
    };

    res.status(200).json({
      success: true,
      data: basicStats,
      message: 'Basic performance analysis (AI analysis temporarily unavailable)',
    });
  }
});

// @desc    Get practice recommendations
// @route   GET /api/practice/recommendations
// @access  Private (Student)
const getPracticeRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user preferences
  const user = await req.user.populate('preferences');
  const preferredSubjects = user.preferences?.subjects || [];
  const preferredDifficulty = user.preferences?.difficulty || 'medium';

  // Get recent submissions to analyze weak areas
  const recentSubmissions = await Submission.find({
    student: userId,
    status: { $in: ['submitted', 'evaluated'] },
  })
    .populate('quiz', 'subject')
    .sort({ createdAt: -1 })
    .limit(10);

  // Analyze performance by subject
  const subjectPerformance = {};
  recentSubmissions.forEach(submission => {
    const subject = submission.quiz.subject;
    if (!subjectPerformance[subject]) {
      subjectPerformance[subject] = {
        attempts: 0,
        totalScore: 0,
        averageScore: 0,
      };
    }
    subjectPerformance[subject].attempts++;
    subjectPerformance[subject].totalScore += submission.score.percentage;
  });

  // Calculate averages and identify weak subjects
  const weakSubjects = [];
  Object.keys(subjectPerformance).forEach(subject => {
    const data = subjectPerformance[subject];
    data.averageScore = data.totalScore / data.attempts;
    
    if (data.averageScore < 70) { // Below 70% is considered weak
      weakSubjects.push(subject);
    }
  });

  // Generate recommendations
  const recommendations = [];

  // Add weak subjects for improvement
  if (weakSubjects.length > 0) {
    recommendations.push({
      type: 'improvement',
      title: 'Focus on Weak Areas',
      subjects: weakSubjects,
      difficulty: 'easy', // Start with easier questions
      reason: 'Improve performance in subjects where you scored below 70%',
      priority: 'high',
    });
  }

  // Add preferred subjects for practice
  if (preferredSubjects.length > 0) {
    recommendations.push({
      type: 'practice',
      title: 'Regular Practice',
      subjects: preferredSubjects,
      difficulty: preferredDifficulty,
      reason: 'Continue practicing your preferred subjects',
      priority: 'medium',
    });
  }

  // Add challenge recommendations
  if (Object.keys(subjectPerformance).length > 0) {
    const strongSubjects = Object.keys(subjectPerformance).filter(
      subject => subjectPerformance[subject].averageScore >= 80
    );
    
    if (strongSubjects.length > 0) {
      recommendations.push({
        type: 'challenge',
        title: 'Challenge Yourself',
        subjects: strongSubjects,
        difficulty: 'hard',
        reason: 'You\'re performing well in these subjects. Try harder questions!',
        priority: 'low',
      });
    }
  }

  // Default recommendations for new users
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'getting-started',
      title: 'Get Started',
      subjects: ['Mathematics', 'Science', 'English'],
      difficulty: 'medium',
      reason: 'Start with these popular subjects to build your quiz-taking skills',
      priority: 'high',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      recommendations,
      userPreferences: {
        subjects: preferredSubjects,
        difficulty: preferredDifficulty,
      },
      performance: subjectPerformance,
    },
  });
});

module.exports = {
  generatePracticeQuiz,
  getPerformanceAnalysis,
  getPracticeRecommendations,
};