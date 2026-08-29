const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const commentService = require('../services/comment.service');

const getComments = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await commentService.getComments(req.params.id, { page, limit });

  sendSuccess(res, 200, 'Comments retrieved successfully', result);
});

const createComment = asyncHandler(async (req, res) => {
  const result = await commentService.createComment(
    req.params.id,
    req.user._id,
    req.body.content
  );

  sendSuccess(res, 201, 'Comment added successfully', result);
});

const deleteComment = asyncHandler(async (req, res) => {
  const result = await commentService.deleteComment(req.params.id, req.user._id);

  sendSuccess(res, 200, 'Comment deleted successfully', result);
});

module.exports = {
  getComments,
  createComment,
  deleteComment,
};
