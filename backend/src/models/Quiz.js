const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['multiple-choice', 'short-answer', 'true-false', 'essay'],
    required: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: [{
    text: { type: String, trim: true },
    isCorrect: { type: Boolean, default: false },
  }],
  correctAnswer: {
    type: String,
    trim: true,
  },
  explanation: {
    type: String,
    trim: true,
  },
  points: {
    type: Number,
    default: 1,
    min: 0,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  tags: [{
    type: String,
    trim: true,
  }],
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  grade: {
    type: String,
    trim: true,
  },
  questions: [questionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'scheduled'],
    default: 'draft',
  },
  settings: {
    timeLimit: { type: Number, default: 60 }, // in minutes
    allowRetake: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: false },
    showResults: { type: Boolean, default: true },
    passingScore: { type: Number, default: 60 }, // percentage
    autoGrade: { type: Boolean, default: true },
  },
  schedule: {
    startDate: { type: Date },
    endDate: { type: Date },
    timezone: { type: String, default: 'UTC' },
  },
  metadata: {
    totalPoints: { type: Number, default: 0 },
    estimatedTime: { type: Number, default: 30 }, // in minutes
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    category: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
  },
  statistics: {
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Virtual for quiz URL
quizSchema.virtual('quizUrl').get(function() {
  return `/quiz/${this._id}`;
});

// Pre-save middleware to calculate total points
quizSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.metadata.totalPoints = this.questions.reduce((total, question) => {
      return total + (question.points || 1);
    }, 0);
  }
  next();
});

// Indexes for better performance
quizSchema.index({ createdBy: 1 });
quizSchema.index({ status: 1 });
quizSchema.index({ subject: 1 });
quizSchema.index({ 'schedule.startDate': 1 });
quizSchema.index({ createdAt: -1 });

// Methods
quizSchema.methods.isAvailable = function() {
  if (this.status !== 'published') return false;
  
  const now = new Date();
  if (this.schedule.startDate && now < this.schedule.startDate) return false;
  if (this.schedule.endDate && now > this.schedule.endDate) return false;
  
  return true;
};

quizSchema.methods.updateStatistics = async function(score) {
  this.statistics.totalAttempts += 1;
  
  // Update average score
  const totalScore = (this.statistics.averageScore * (this.statistics.totalAttempts - 1)) + score;
  this.statistics.averageScore = totalScore / this.statistics.totalAttempts;
  
  await this.save();
};

module.exports = mongoose.model('Quiz', quizSchema);