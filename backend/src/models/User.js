const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student',
  },
  preferences: {
    subjects: [{
      type: String,
      trim: true,
    }],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
    },
  },
  profile: {
    institution: { type: String, trim: true },
    grade: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 500 },
    location: { type: String, trim: true },
  },
  mobileNumber: {
    type: String,
    trim: true,
    default: '',
  },
  stats: {
    totalQuizzes: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Virtual for user's full profile URL
userSchema.virtual('profileUrl').get(function() {
  return `/profile/${this._id}`;
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'stats.lastActive': -1 });

// Methods
userSchema.methods.updateStats = async function(score, isNewQuiz = true) {
  if (isNewQuiz) {
    this.stats.totalQuizzes += 1;
  }
  
  // Update average score
  const totalScore = (this.stats.averageScore * (this.stats.totalQuizzes - 1)) + score;
  this.stats.averageScore = totalScore / this.stats.totalQuizzes;
  
  this.stats.lastActive = new Date();
  await this.save();
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.googleId;
  return user;
};

module.exports = mongoose.model('User', userSchema);