const User = require('../models/User');
const AppError = require('../utils/AppError');
const followService = require('./follow.service');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const formatPublicUser = (user, extras = {}) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  avatar: user.avatar || null,
  bio: user.bio || '',
  createdAt: user.createdAt,
  ...extras,
});

const formatOwnUser = (user, extras = {}) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar || null,
  bio: user.bio || '',
  createdAt: user.createdAt,
  ...extras,
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getMe = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const counts = await followService.getFollowCounts(userId);

  return formatOwnUser(user, counts);
};

const getUserByUsername = async (username, viewerId) => {
  const normalizedUsername = username.toLowerCase().trim();
  const user = await User.findOne({ username: normalizedUsername });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const counts = await followService.getFollowCounts(user._id);
  let following = false;

  if (viewerId && viewerId.toString() !== user._id.toString()) {
    following = await followService.isFollowing(viewerId, user._id);
  }

  return formatPublicUser(user, {
    ...counts,
    following,
  });
};

const updateMyProfile = async (userId, updates) => {
  const allowedFields = ['name', 'bio', 'avatar'];
  const sanitized = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      sanitized[field] = updates[field];
    }
  }

  if (Object.keys(sanitized).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  const user = await User.findByIdAndUpdate(userId, sanitized, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const counts = await followService.getFollowCounts(userId);

  return formatOwnUser(user, counts);
};

const searchUsers = async ({ q, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT }) => {
  const trimmedQuery = q.trim();
  const safePage = Math.max(1, Number(page) || DEFAULT_PAGE);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));
  const skip = (safePage - 1) * safeLimit;

  const regex = new RegExp(escapeRegex(trimmedQuery), 'i');
  const filter = {
    $or: [{ username: regex }, { name: regex }],
  };

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    users: users.map((user) => formatPublicUser(user)),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
};

module.exports = {
  getMe,
  getUserByUsername,
  updateMyProfile,
  searchUsers,
  formatPublicUser,
  formatOwnUser,
};
