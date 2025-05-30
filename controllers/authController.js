const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, address, contact, password, accessAreas, job } = req.body;

    // Create user with isApproved = 0 (pending)
    const user = await User.create({
      name,
      email,
      address,
      contact,
      password,
      accessAreas,
      job,
      isApproved: 0
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved
      },
      message: 'Registration successful! Waiting for admin approval.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login  
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if user is approved
    if (user.isApproved !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Your account is pending approval',
      });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        accessAreas: user.accessAreas,
        job:user.job,
        isApproved: user.isApproved
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users (for admin)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user approval status
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
exports.updateUserApproval = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: `User ${req.body.isApproved === 1 ? 'approved' : 'rejected'} successfully`
    });
  } catch (err) {
    next(err);
  }
};