const express = require('express');
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  updateProfileRules,
  searchQueryRules,
  usernameParamRules,
} = require('../validators/user.validator');

const router = express.Router();

router.get('/search', protect, searchQueryRules, validate, userController.searchUsers);
router.get('/me', protect, userController.getMe);
router.patch('/me', protect, updateProfileRules, validate, userController.updateMyProfile);
router.get('/:username', usernameParamRules, validate, userController.getUserByUsername);

module.exports = router;
