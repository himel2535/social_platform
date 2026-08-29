const { body, query, param } = require('express-validator');

const createCommentRules = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isString()
    .withMessage('Comment content must be a string')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment content must be between 1 and 500 characters'),
];

const getCommentsQueryRules = [
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

const commentIdRules = [param('id').isMongoId().withMessage('Invalid comment ID')];

module.exports = {
  createCommentRules,
  getCommentsQueryRules,
  commentIdRules,
};
