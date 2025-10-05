const { asyncHandler } = require('../middleware/errorHandler');
const Contact = require('../models/Contact');

// @desc    Submit contact message
// @route   POST /api/public/contact
// @access  Public
const submitContact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message || message.trim().length < 10) {
    return res.status(400).json({ success: false, message: 'Invalid contact data' });
  }

  const doc = await Contact.create({
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    metadata: {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    },
  });

  res.status(201).json({ success: true, message: 'Message received', data: { id: doc._id } });
});

module.exports = { submitContact };
