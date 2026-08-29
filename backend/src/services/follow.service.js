const Follow = require('../models/Follow');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const PUBLIC_USER_FIELDS = 'name username avatar bio createdAt';

const formatListedUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  avatar: user.avatar || null,
  bio: user.bio || '',
  createdAt: user.createdAt,
});

const getFollowCounts = async (userId) => {
  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId }),
  ]);

  return { followersCount, followingCount };
};

const isFollowing = async (followerId, followingId) => {
  if (!followerId || !followingId) {
    return false;
  }

  const relationship = await Follow.findOne({
    follower: followerId,
    following: followingId,
  }).select('_id');

  return !!relationship;
};

const findUserByUsername = async (username) => {
  const normalizedUsername = username.toLowerCase().trim();
  const user = await User.findOne({ username: normalizedUsername });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

const buildFollowResponse = async (targetUserId, viewerId) => {
  const counts = await getFollowCounts(targetUserId);
  const following =
    viewerId && viewerId.toString() !== targetUserId.toString()
      ? await isFollowing(viewerId, targetUserId)
      : false;

  return {
    following,
    followersCount: counts.followersCount,
    followingCount: counts.followingCount,
  };
};

const followUser = async (followerId, targetUsername) => {
  const targetUser = await findUserByUsername(targetUsername);

  if (followerId.toString() === targetUser._id.toString()) {
    throw new AppError('Cannot follow yourself', 400);
  }

  try {
    await Follow.create({
      follower: followerId,
      following: targetUser._id,
    });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }

  return buildFollowResponse(targetUser._id, followerId);
};

const unfollowUser = async (followerId, targetUsername) => {
  const targetUser = await findUserByUsername(targetUsername);

  if (followerId.toString() === targetUser._id.toString()) {
    throw new AppError('Cannot follow yourself', 400);
  }

  await Follow.deleteOne({
    follower: followerId,
    following: targetUser._id,
  });

  return buildFollowResponse(targetUser._id, followerId);
};

const getFollowers = async (username, { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) => {
  const targetUser = await findUserByUsername(username);
  const safePage = Math.max(1, Number(page) || DEFAULT_PAGE);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));
  const skip = (safePage - 1) * safeLimit;

  const filter = { following: targetUser._id };

  const [relationships, total] = await Promise.all([
    Follow.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('follower', PUBLIC_USER_FIELDS)
      .lean(),
    Follow.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    users: relationships.map((relationship) => formatListedUser(relationship.follower)),
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

const getFollowing = async (username, { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) => {
  const targetUser = await findUserByUsername(username);
  const safePage = Math.max(1, Number(page) || DEFAULT_PAGE);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));
  const skip = (safePage - 1) * safeLimit;

  const filter = { follower: targetUser._id };

  const [relationships, total] = await Promise.all([
    Follow.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('following', PUBLIC_USER_FIELDS)
      .lean(),
    Follow.countDocuments(filter),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    users: relationships.map((relationship) => formatListedUser(relationship.following)),
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
  getFollowCounts,
  isFollowing,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  buildFollowResponse,
};
