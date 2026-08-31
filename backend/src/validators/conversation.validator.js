const { param, query } = require('express-validator');

const userIdParamRules = [param('userId').isMongoId().withMessage('Invalid user ID')];

const getMessagesQueryRules = [
  query('limit')
    .optional()
    .default(30)
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  query('before')
    .optional()
    .isMongoId()
    .withMessage('Invalid before cursor'),
];

module.exports = {
  userIdParamRules,
  getMessagesQueryRules,
};
