const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

const {
  googleCallback,
  getMe,
  updateProfile,
  logout,
  deleteAccount,
  changeUserRole,
  getAllUsers,
} = require('../controllers/authController');

const { authenticate, authorize } = require('../middleware/auth');
const { validateProfile } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Google OAuth routes
router.get(
  '/google',
  authLimiter,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/error' }),
  googleCallback
);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, validateProfile, updateProfile);
router.post('/logout', authenticate, logout);
router.delete('/account', authenticate, deleteAccount);

// Admin only routes
router.put('/role/:userId', authenticate, authorize('admin'), changeUserRole);
router.get('/users', authenticate, authorize('admin'), getAllUsers);

// JWT routes
router.post('/token', (req, res) => {
  const { userId } = req.body;
  const payload = { userId };
  const options = { expiresIn: '1d' };
  const token = jwt.sign(payload, process.env.JWT_SECRET, options);
  res.json({ token });
});

router.get('/verify', (req, res) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1]; // Bearer <token>
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({ decoded });
  });
});

module.exports = router;