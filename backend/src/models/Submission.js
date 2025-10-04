const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, array, or object
    required: true,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  points: {
    type: Number,
    default: 0,
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0,
  },
});

const submissionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [answerSchema],
  score: {
    total: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'], default: 'F' },
  },
  timing: {
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    totalTime: { type: Number, default: 0 }, // in seconds
    timeLimit: { type: Number }, // in seconds
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'evaluated', 'needs-review'],
    default: 'in-progress',
  },
  evaluation: {
    autoGraded: { type: Boolean, default: false },
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    evaluatedAt: { type: Date },
    feedback: { type: String, trim: true },
    aiInsights: {
      strengths: [{ type: String, trim: true }],
      weaknesses: [{ type: String, trim: true }],
      recommendations: [{ type: String, trim: true }],
      detailedAnalysis: { type: String, trim: true },
    },
  },
  revaluation: {
    requested: { type: Boolean, default: false },
    requestedAt: { type: Date },
    reason: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    handledAt: { type: Date },
    response: { type: String, trim: true },
  },
  attempt: {
    type: Number,
    default: 1,
  },
  metadata: {
    browserInfo: { type: String },
    ipAddress: { type: String },
    deviceType: { type: String },
  },
}, {
  timestamps: true,
});

// Compound indexes for better performance
submissionSchema.index({ quiz: 1, student: 1 });
submissionSchema.index({ student: 1, createdAt: -1 });
submissionSchema.index({ quiz: 1, status: 1 });
submissionSchema.index({ status: 1 });

// Virtual for submission URL
submissionSchema.virtual('submissionUrl').get(function() {
  return `/submission/${this._id}`;
});

// Pre-save middleware to calculate grade
submissionSchema.pre('save', function(next) {
  if (this.score.percentage >= 0) {
    if (this.score.percentage >= 95) this.score.grade = 'A+';
    else if (this.score.percentage >= 90) this.score.grade = 'A';
    else if (this.score.percentage >= 85) this.score.grade = 'B+';
    else if (this.score.percentage >= 80) this.score.grade = 'B';
    else if (this.score.percentage >= 75) this.score.grade = 'C+';
    else if (this.score.percentage >= 70) this.score.grade = 'C';
    else if (this.score.percentage >= 60) this.score.grade = 'D';
    else this.score.grade = 'F';
  }
  next();
});

// Methods
submissionSchema.methods.calculateScore = function(quizQuestions) {
  let totalPoints = 0;
  let earnedPoints = 0;

  this.answers.forEach(answer => {
    const question = quizQuestions.find(q => q._id.toString() === answer.questionId.toString());
    if (question) {
      totalPoints += question.points || 1;
      if (answer.isCorrect) {
        earnedPoints += answer.points || (question.points || 1);
      }
    }
  });

  this.score.total = earnedPoints;
  this.score.percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
};

submissionSchema.methods.finishSubmission = function() {
  this.status = 'submitted';
  this.timing.endTime = new Date();
  this.timing.totalTime = Math.floor((this.timing.endTime - this.timing.startTime) / 1000);
};

module.exports = mongoose.model('Submission', submissionSchema);