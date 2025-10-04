const { asyncHandler } = require('../middleware/errorHandler');
const Announcement = require('../models/Announcement');
const User = require('../models/User');

// @desc    Get announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const type = req.query.type;
  const priority = req.query.priority;

  const startIndex = (page - 1) * limit;

  // Build query based on user role and targeting
  let query = { status: 'published' };

  // Filter by user role and targeting
  if (req.user.role !== 'admin') {
    query.$or = [
      { 'targetAudience.roles': req.user.role },
      { 'targetAudience.specific': req.user.id },
      { 'targetAudience.roles': { $size: 0 }, 'targetAudience.specific': { $size: 0 } }, // Public announcements
    ];
  }

  // Apply filters
  if (type) query.type = type;
  if (priority) query.priority = priority;

  // Only show visible announcements
  const now = new Date();
  query['schedule.publishAt'] = { $lte: now };
  query.$or = [
    { 'schedule.expiresAt': { $exists: false } },
    { 'schedule.expiresAt': null },
    { 'schedule.expiresAt': { $gte: now } },
  ];

  const announcements = await Announcement.find(query)
    .populate('createdBy', 'name email profilePicture role')
    .populate('relatedQuiz', 'title subject')
    .sort({ 'schedule.publishAt': -1, priority: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await Announcement.countDocuments(query);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  res.status(200).json({
    success: true,
    data: announcements,
    pagination,
  });
});

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('createdBy', 'name email profilePicture role')
    .populate('relatedQuiz', 'title subject')
    .populate('targetAudience.specific', 'name email');

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Check visibility
  if (!announcement.isVisible() && req.user.role !== 'admin' && announcement.createdBy._id.toString() !== req.user.id) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Check if user has access
  const hasAccess = 
    req.user.role === 'admin' ||
    announcement.createdBy._id.toString() === req.user.id ||
    announcement.targetAudience.roles.includes(req.user.role) ||
    announcement.targetAudience.specific.some(user => user._id.toString() === req.user.id) ||
    (announcement.targetAudience.roles.length === 0 && announcement.targetAudience.specific.length === 0);

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this announcement',
    });
  }

  // Mark as read
  announcement.markAsRead(req.user.id);
  await announcement.save();

  res.status(200).json({
    success: true,
    data: announcement,
  });
});

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Teacher, Admin)
const createAnnouncement = asyncHandler(async (req, res) => {
  const announcementData = {
    ...req.body,
    createdBy: req.user.id,
  };

  const announcement = await Announcement.create(announcementData);
  await announcement.populate('createdBy', 'name email profilePicture role');

  res.status(201).json({
    success: true,
    data: announcement,
    message: 'Announcement created successfully',
  });
});

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Owner, Admin)
const updateAnnouncement = asyncHandler(async (req, res) => {
  let announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Check ownership
  if (announcement.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this announcement',
    });
  }

  announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'name email profilePicture role');

  res.status(200).json({
    success: true,
    data: announcement,
    message: 'Announcement updated successfully',
  });
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Owner, Admin)
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Check ownership
  if (announcement.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this announcement',
    });
  }

  await Announcement.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Announcement deleted successfully',
  });
});

// @desc    Get announcement statistics
// @route   GET /api/announcements/stats
// @access  Private (Teacher, Admin)
const getAnnouncementStats = asyncHandler(async (req, res) => {
  let matchStage = {};

  // Filter based on user role
  if (req.user.role === 'teacher') {
    matchStage.createdBy = req.user._id;
  }

  const stats = await Announcement.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAnnouncements: { $sum: 1 },
        publishedAnnouncements: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
        },
        draftAnnouncements: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        totalViews: { $sum: '$metadata.views' },
        averageViews: { $avg: '$metadata.views' },
      }
    }
  ]);

  const result = stats[0] || {
    totalAnnouncements: 0,
    publishedAnnouncements: 0,
    draftAnnouncements: 0,
    totalViews: 0,
    averageViews: 0,
  };

  // Get recent announcements
  const recentAnnouncements = await Announcement.find(matchStage)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title type priority status metadata.views createdAt');

  res.status(200).json({
    success: true,
    data: {
      stats: result,
      recentAnnouncements,
    },
  });
});

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementStats,
};