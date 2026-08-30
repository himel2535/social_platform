const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const notificationService = require('../services/notification.service');

const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, {
    page: req.query.page,
    limit: req.query.limit,
  });

  sendSuccess(res, 200, 'Notifications retrieved successfully', result);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user._id, req.params.id);

  sendSuccess(res, 200, 'Notification marked as read', { notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);

  sendSuccess(res, 200, 'All notifications marked as read', result);
});

const registerDeviceToken = asyncHandler(async (req, res) => {
  await notificationService.registerDeviceToken(req.user._id, req.body.token);

  sendSuccess(res, 200, 'Device token registered');
});

const removeDeviceToken = asyncHandler(async (req, res) => {
  await notificationService.removeDeviceToken(req.user._id, req.body.token);

  sendSuccess(res, 200, 'Device token removed');
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  registerDeviceToken,
  removeDeviceToken,
};
