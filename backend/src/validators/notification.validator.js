const { body, query, param } = require('express-validator');

const paginationRules = [
  query('page')
    .optional()
    .default(1)
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .default(20)
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
];

const notificationIdRules = [param('id').isMongoId().withMessage('Invalid notification ID')];

const deviceTokenRules = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Device token is required')
    .isString()
    .withMessage('Device token must be a string')
    .isLength({ min: 8, max: 4096 })
    .withMessage('Device token must be between 8 and 4096 characters'),
  body('recipient').not().exists().withMessage('Cannot set recipient'),
  body('actor').not().exists().withMessage('Cannot set actor'),
];

module.exports = {
  paginationRules,
  notificationIdRules,
  deviceTokenRules,
};
