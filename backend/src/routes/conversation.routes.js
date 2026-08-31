const express = require('express');
const conversationController = require('../controllers/conversation.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  userIdParamRules,
  getMessagesQueryRules,
} = require('../validators/conversation.validator');

const router = express.Router();

router.get('/', protect, conversationController.getConversations);
router.get(
  '/:userId/messages',
  protect,
  userIdParamRules,
  getMessagesQueryRules,
  validate,
  conversationController.getMessagesWithUser,
);

module.exports = router;
