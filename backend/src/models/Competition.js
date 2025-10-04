const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['class', 'inter-class', 'inter-college', 'public'],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['registered', 'participated', 'disqualified'],
      default: 'registered',
    },
  }],
  schedule: {
    registrationStart: { type: Date, required: true },
    registrationEnd: { type: Date, required: true },
    competitionStart: { type: Date, required: true },
    competitionEnd: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },
  },
  rules: {
    maxParticipants: { type: Number },
    eligibility: {
      grades: [{ type: String, trim: true }],
      subjects: [{ type: String, trim: true }],
      institutions: [{ type: String, trim: true }],
    },
    requirements: [{ type: String, trim: true }],
  },
  prizes: [{
    position: { type: Number, required: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    value: { type: String, trim: true },
  }],
  leaderboard: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
    score: { type: Number, required: true },
    percentage: { type: Number, required: true },
    completionTime: { type: Number }, // in seconds
    rank: { type: Number },
    completedAt: { type: Date },
  }],
  status: {
    type: String,
    enum: ['draft', 'registration-open', 'registration-closed', 'active', 'completed', 'cancelled'],
    default: 'draft',
  },
  settings: {
    isPublic: { type: Boolean, default: false },
    allowLateSubmission: { type: Boolean, default: false },
    showLeaderboard: { type: Boolean, default: true },
    instantResults: { type: Boolean, default: false },
  },
  statistics: {
    totalRegistrations: { type: Number, default: 0 },
    totalParticipants: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
  },
  banner: {
    type: String, // URL to banner image
    trim: true,
  },
}, {
  timestamps: true,
});

// Indexes
competitionSchema.index({ createdBy: 1 });
competitionSchema.index({ status: 1 });
competitionSchema.index({ type: 1 });
competitionSchema.index({ 'schedule.registrationStart': 1 });
competitionSchema.index({ 'schedule.competitionStart': 1 });

// Virtual for competition URL
competitionSchema.virtual('competitionUrl').get(function() {
  return `/competition/${this._id}`;
});

// Methods
competitionSchema.methods.canRegister = function() {
  const now = new Date();
  return this.status === 'registration-open' &&
         now >= this.schedule.registrationStart &&
         now <= this.schedule.registrationEnd &&
         (!this.rules.maxParticipants || this.participants.length < this.rules.maxParticipants);
};

competitionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' &&
         now >= this.schedule.competitionStart &&
         now <= this.schedule.competitionEnd;
};

competitionSchema.methods.updateLeaderboard = async function() {
  // Sort leaderboard by score (descending) and completion time (ascending)
  this.leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.completionTime - b.completionTime;
  });

  // Update ranks
  this.leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  await this.save();
};

competitionSchema.methods.addParticipant = function(userId) {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!existingParticipant && this.canRegister()) {
    this.participants.push({ user: userId });
    this.statistics.totalRegistrations += 1;
    return true;
  }
  return false;
};

module.exports = mongoose.model('Competition', competitionSchema);