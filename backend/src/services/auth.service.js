const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const AppError = require('../utils/AppError');

const formatUser = (user) => user.toJSON();

const signup = async ({ name, username, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    throw new AppError('Email already exists', 409);
  }

  const existingUsername = await User.findOne({ username: normalizedUsername });
  if (existingUsername) {
    throw new AppError('Username already exists', 409);
  }

  const user = await User.create({
    name: name.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password,
  });

  const token = generateToken(user._id);

  return {
    token,
    user: formatUser(user),
  };
};

const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user._id);

  return {
    token,
    user: formatUser(user),
  };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return formatUser(user);
};

module.exports = {
  signup,
  login,
  getMe,
};
