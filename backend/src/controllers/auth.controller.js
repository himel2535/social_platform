const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const authService = require('../services/auth.service');

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);

  sendSuccess(res, 201, 'Account created successfully', result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  sendSuccess(res, 200, 'Login successful', result);
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);

  sendSuccess(res, 200, 'User retrieved successfully', { user });
});

module.exports = {
  signup,
  login,
  getMe,
};
