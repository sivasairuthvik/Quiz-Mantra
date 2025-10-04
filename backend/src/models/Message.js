const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
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
    enum: ['feedback', 'hint', 'revaluation', 'announcement', 'general'],
    default: 'general',
  },
  relatedQuiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
  },
  relatedSubmission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'archived'],
    default: 'sent',
  },
  readAt: {
    type: Date,
  },
  attachments: [{
    filename: { type: String, trim: true },
    url: { type: String, trim: true },
    size: { type: Number },
    mimeType: { type: String, trim: true },
  }],
  metadata: {
    isSystemGenerated: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
  },
}, {
  timestamps: true,
});

// Indexes
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ recipient: 1, status: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ type: 1 });

// Virtual for message URL
messageSchema.virtual('messageUrl').get(function() {
  return `/message/${this._id}`;
});

// Methods
messageSchema.methods.markAsRead = function() {
  if (this.status !== 'read') {
    this.status = 'read';
    this.readAt = new Date();
  }
};

messageSchema.methods.isUnread = function() {
  return this.status === 'sent' || this.status === 'delivered';
};

// Static methods
messageSchema.statics.getConversation = function(userId1, userId2, limit = 50) {
  return this.find({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 }
    ]
  })
  .populate('sender', 'name profilePicture')
  .populate('recipient', 'name profilePicture')
  .sort({ createdAt: -1 })
  .limit(limit);
};

messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    status: { $in: ['sent', 'delivered'] }
  });
};

module.exports = mongoose.model('Message', messageSchema);