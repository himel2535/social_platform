const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const followService = require('../services/follow.service');

const followUser = asyncHandler(async (req, res) => {
  const result = await followService.followUser(req.user._id, req.params.username);

  sendSuccess(res, 200, 'User followed successfully', result);
});

const unfollowUser = asyncHandler(async (req, res) => {
  const result = await followService.unfollowUser(req.user._id, req.params.username);

  sendSuccess(res, 200, 'User unfollowed successfully', result);
});

const getFollowers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await followService.getFollowers(req.params.username, { page, limit });

  sendSuccess(res, 200, 'Followers retrieved successfully', result);
});

const getFollowing = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await followService.getFollowing(req.params.username, { page, limit });

  sendSuccess(res, 200, 'Following retrieved successfully', result);
});

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
