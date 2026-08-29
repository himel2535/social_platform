const { body, query, param } = require('express-validator');

const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Bio cannot exceed 160 characters'),
  body('avatar')
    .optional()
    .trim()
    .custom((value) => {
      if (value === '') {
        return true;
      }
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        throw new Error('Avatar must be a valid HTTP or HTTPS URL');
      }
    }),
  body('_id').not().exists().withMessage('Cannot modify _id'),
  body('username').not().exists().withMessage('Cannot modify username'),
  body('email').not().exists().withMessage('Cannot modify email'),
  body('password').not().exists().withMessage('Cannot modify password'),
  body('role').not().exists().withMessage('Cannot modify role'),
  body('roles').not().exists().withMessage('Cannot modify roles'),
  body('fcmTokens').not().exists().withMessage('Cannot modify fcmTokens'),
];

const searchQueryRules = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
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

const usernameParamRules = [
  param('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Username can only contain lowercase letters, numbers, and underscores'),
];

module.exports = {
  updateProfileRules,
  searchQueryRules,
  usernameParamRules,
};
