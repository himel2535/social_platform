const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const userService = require('../services/user.service');

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user._id);

  sendSuccess(res, 200, 'Profile retrieved successfully', { user });
});

const getUserByUsername = asyncHandler(async (req, res) => {
  const user = await userService.getUserByUsername(req.params.username, req.user?._id);

  sendSuccess(res, 200, 'Profile retrieved successfully', { user });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateMyProfile(req.user._id, req.body);

  sendSuccess(res, 200, 'Profile updated successfully', { user });
});

const searchUsers = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  const result = await userService.searchUsers({ q, page, limit });

  sendSuccess(res, 200, 'Users retrieved successfully', result);
});

module.exports = {
  getMe,
  getUserByUsername,
  updateMyProfile,
  searchUsers,
};
