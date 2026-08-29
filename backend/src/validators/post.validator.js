const { body, query } = require('express-validator');

const createPostRules = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Post content is required')
    .isString()
    .withMessage('Post content must be a string')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Post content must be between 1 and 1000 characters'),
];

const getPostsQueryRules = [
  query('page')
    .optional()
    .default(1)
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .default(10)
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
];

module.exports = { createPostRules, getPostsQueryRules };
