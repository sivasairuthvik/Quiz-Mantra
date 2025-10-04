const express = require('express');
const router = express.Router();

const {
  getMessages,
  getMessage,
  sendMessage,
  getConversation,
  markAsRead,
  deleteMessage,
  getMessageStats,
} = require('../controllers/messageController');

const { authenticate } = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');

// General routes
router.get('/', authenticate, getMessages);
router.get('/stats', authenticate, getMessageStats);
router.post('/', authenticate, validateMessage, sendMessage);

// Specific message routes
router.get('/conversation/:userId', authenticate, getConversation);
router.get('/:id', authenticate, getMessage);
router.put('/:id/read', authenticate, markAsRead);
router.delete('/:id', authenticate, deleteMessage);

module.exports = router;