const express = require('express');
const router = express.Router();

const { submitContact } = require('../controllers/publicController');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Public contact endpoint (no auth)
router.post('/contact', uploadLimiter, submitContact);

module.exports = router;
