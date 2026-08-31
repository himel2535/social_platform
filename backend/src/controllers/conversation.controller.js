const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const messageService = require('../services/message.service');

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await messageService.listConversations(req.user._id);

  sendSuccess(res, 200, 'Conversations retrieved successfully', { conversations });
});

const getMessagesWithUser = asyncHandler(async (req, res) => {
  const { limit, before } = req.query;
  const result = await messageService.getMessagesWithUser(req.user._id, req.params.userId, {
    limit,
    before,
  });

  sendSuccess(res, 200, 'Messages retrieved successfully', result);
});

module.exports = {
  getConversations,
  getMessagesWithUser,
};
