const express = require('express');
const followController = require('../controllers/follow.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  usernameParamRules,
  followListQueryRules,
} = require('../validators/follow.validator');

const router = express.Router();

router.get(
  '/:username/followers',
  protect,
  usernameParamRules,
  followListQueryRules,
  validate,
  followController.getFollowers
);
router.get(
  '/:username/following',
  protect,
  usernameParamRules,
  followListQueryRules,
  validate,
  followController.getFollowing
);
router.post(
  '/:username/follow',
  protect,
  usernameParamRules,
  validate,
  followController.followUser
);
router.delete(
  '/:username/follow',
  protect,
  usernameParamRules,
  validate,
  followController.unfollowUser
);

module.exports = router;
