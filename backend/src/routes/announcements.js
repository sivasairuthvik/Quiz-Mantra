const express = require('express');
const router = express.Router();

const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementStats,
} = require('../controllers/announcementController');

const { authenticate, authorize } = require('../middleware/auth');
const { validateAnnouncement } = require('../middleware/validation');

// Public routes (with authentication)
router.get('/', authenticate, getAnnouncements);
router.get('/:id', authenticate, getAnnouncement);

// Teacher/Admin routes
router.post('/', authenticate, authorize('teacher', 'admin'), validateAnnouncement, createAnnouncement);
router.put('/:id', authenticate, authorize('teacher', 'admin'), validateAnnouncement, updateAnnouncement);
router.delete('/:id', authenticate, authorize('teacher', 'admin'), deleteAnnouncement);
router.get('/admin/stats', authenticate, authorize('teacher', 'admin'), getAnnouncementStats);

module.exports = router;