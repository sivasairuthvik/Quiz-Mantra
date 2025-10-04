const { asyncHandler } = require('../middleware/errorHandler');
const { generateToken } = require('../middleware/auth');
const User = require('../models/User');

// @desc    Google OAuth callback
// @route   GET /auth/google/callback
// @access  Public
const googleCallback = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Authentication failed`);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Set token in cookie (optional, for additional security)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}&role=${user.role}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Authentication failed`);
  }
});

// @desc    Get current user
// @route   GET /auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user profile
// @route   PUT /auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    'profile.bio': req.body.profile?.bio,
    'profile.institution': req.body.profile?.institution,
    'profile.grade': req.body.profile?.grade,
    'profile.location': req.body.profile?.location,
    'preferences.subjects': req.body.preferences?.subjects,
    'preferences.difficulty': req.body.preferences?.difficulty,
    'preferences.notifications': req.body.preferences?.notifications,
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Logout user
// @route   POST /auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Clear cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
});

// @desc    Delete user account
// @route   DELETE /auth/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  // Mark user as inactive instead of deleting (for data integrity)
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully',
  });
});

// @desc    Change user role (Admin only)
// @route   PUT /auth/role/:userId
// @access  Private (Admin)
const changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { userId } = req.params;

  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified',
    });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
    message: `User role updated to ${role}`,
  });
});

// @desc    Get all users (Admin only)
// @route   GET /auth/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const role = req.query.role;
  const search = req.query.search;

  const startIndex = (page - 1) * limit;

  // Build query
  let query = { isActive: true };
  
  if (role) {
    query.role = role;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const total = await User.countDocuments(query);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  res.status(200).json({
    success: true,
    data: users,
    pagination,
  });
});

module.exports = {
  googleCallback,
  getMe,
  updateProfile,
  logout,
  deleteAccount,
  changeUserRole,
  getAllUsers,
};