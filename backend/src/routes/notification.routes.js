const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  paginationRules,
  notificationIdRules,
  deviceTokenRules,
} = require('../validators/notification.validator');

const router = express.Router();

router.get('/', protect, paginationRules, validate, notificationController.getNotifications);
router.patch('/read-all', protect, notificationController.markAllAsRead);
router.post(
  '/device-token',
  protect,
  deviceTokenRules,
  validate,
  notificationController.registerDeviceToken
);
router.delete(
  '/device-token',
  protect,
  deviceTokenRules,
  validate,
  notificationController.removeDeviceToken
);
router.patch(
  '/:id/read',
  protect,
  notificationIdRules,
  validate,
  notificationController.markAsRead
);

module.exports = router;
