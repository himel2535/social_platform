const express = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { signupRules, loginRules } = require('../validators/auth.validator');

const router = express.Router();

router.post('/signup', authLimiter, signupRules, validate, authController.signup);
router.post('/login', authLimiter, loginRules, validate, authController.login);
router.get('/me', protect, authController.getMe);

module.exports = router;
