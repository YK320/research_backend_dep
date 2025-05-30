const User = require('../models/User');

// @desc    Get all users
exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

// @desc    Create new user
exports.createUser = async (req, res) => {
  const { name, email } = req.body;

  try {
    const newUser = await User.create({ name, email });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
