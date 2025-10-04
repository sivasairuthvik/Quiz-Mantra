const { asyncHandler } = require('../middleware/errorHandler');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages for user
// @route   GET /api/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const type = req.query.type;
  const status = req.query.status;

  const startIndex = (page - 1) * limit;

  // Build query
  let query = { recipient: req.user.id };
  
  if (type) query.type = type;
  if (status) query.status = status;

  const messages = await Message.find(query)
    .populate('sender', 'name email profilePicture role')
    .populate('relatedQuiz', 'title subject')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await Message.countDocuments(query);
  const unreadCount = await Message.getUnreadCount(req.user.id);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  res.status(200).json({
    success: true,
    data: messages,
    pagination,
    unreadCount,
  });
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private
const getMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id)
    .populate('sender', 'name email profilePicture role')
    .populate('recipient', 'name email profilePicture role')
    .populate('relatedQuiz', 'title subject')
    .populate('relatedSubmission');

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }

  // Check if user is sender or recipient
  const isAuthorized = 
    message.sender._id.toString() === req.user.id ||
    message.recipient._id.toString() === req.user.id ||
    req.user.role === 'admin';

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this message',
    });
  }

  // Mark as read if user is the recipient
  if (message.recipient._id.toString() === req.user.id && message.isUnread()) {
    message.markAsRead();
    await message.save();
  }

  res.status(200).json({
    success: true,
    data: message,
  });
});

// @desc    Send message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const messageData = {
    ...req.body,
    sender: req.user.id,
  };

  // Check if recipient exists
  const recipient = await User.findById(req.body.recipient);
  if (!recipient || !recipient.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Recipient not found',
    });
  }

  const message = await Message.create(messageData);
  await message.populate('recipient', 'name email profilePicture role');

  res.status(201).json({
    success: true,
    data: message,
    message: 'Message sent successfully',
  });
});

// @desc    Get conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;

  // Verify the other user exists
  const otherUser = await User.findById(userId);
  if (!otherUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const conversation = await Message.getConversation(req.user.id, userId, limit);

  res.status(200).json({
    success: true,
    data: conversation,
  });
});

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }

  // Check if user is the recipient
  if (message.recipient.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only recipient can mark message as read',
    });
  }

  message.markAsRead();
  await message.save();

  res.status(200).json({
    success: true,
    data: message,
    message: 'Message marked as read',
  });
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }

  // Check if user is sender, recipient, or admin
  const canDelete = 
    message.sender.toString() === req.user.id ||
    message.recipient.toString() === req.user.id ||
    req.user.role === 'admin';

  if (!canDelete) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this message',
    });
  }

  await Message.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully',
  });
});

// @desc    Get message statistics
// @route   GET /api/messages/stats
// @access  Private
const getMessageStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [sentCount, receivedCount, unreadCount] = await Promise.all([
    Message.countDocuments({ sender: userId }),
    Message.countDocuments({ recipient: userId }),
    Message.getUnreadCount(userId),
  ]);

  // Get message types breakdown
  const typeBreakdown = await Message.aggregate([
    { $match: { recipient: userId } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);

  const stats = {
    sent: sentCount,
    received: receivedCount,
    unread: unreadCount,
    typeBreakdown: typeBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});

module.exports = {
  getMessages,
  getMessage,
  sendMessage,
  getConversation,
  markAsRead,
  deleteMessage,
  getMessageStats,
};