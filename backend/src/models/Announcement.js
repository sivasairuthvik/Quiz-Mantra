const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['general', 'quiz', 'deadline', 'result', 'maintenance', 'competition'],
    default: 'general',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetAudience: {
    roles: [{
      type: String,
      enum: ['student', 'teacher', 'admin'],
    }],
    specific: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    subjects: [{ type: String, trim: true }],
    grades: [{ type: String, trim: true }],
  },
  schedule: {
    publishAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  attachments: [{
    filename: { type: String, trim: true },
    url: { type: String, trim: true },
    size: { type: Number },
    mimeType: { type: String, trim: true },
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  metadata: {
    views: { type: Number, default: 0 },
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now },
    }],
  },
  relatedQuiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
  },
}, {
  timestamps: true,
});

// Indexes
announcementSchema.index({ createdBy: 1 });
announcementSchema.index({ status: 1 });
announcementSchema.index({ type: 1 });
announcementSchema.index({ 'schedule.publishAt': 1 });
announcementSchema.index({ 'targetAudience.roles': 1 });

// Virtual for announcement URL
announcementSchema.virtual('announcementUrl').get(function() {
  return `/announcement/${this._id}`;
});

// Methods
announcementSchema.methods.isVisible = function() {
  const now = new Date();
  return this.status === 'published' && 
         now >= this.schedule.publishAt && 
         (!this.schedule.expiresAt || now <= this.schedule.expiresAt);
};

announcementSchema.methods.markAsRead = function(userId) {
  const existingRead = this.metadata.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.metadata.readBy.push({ user: userId, readAt: new Date() });
    this.metadata.views += 1;
  }
};

module.exports = mongoose.model('Announcement', announcementSchema);