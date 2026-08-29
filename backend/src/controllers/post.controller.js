const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const postService = require('../services/post.service');

const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user._id, req.body.content);

  sendSuccess(res, 201, 'Post created successfully', { post });
});

const getPosts = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await postService.getPosts({
    page,
    limit,
    userId: req.user._id,
  });

  sendSuccess(res, 200, 'Posts retrieved successfully', result);
});

const likePost = asyncHandler(async (req, res) => {
  const result = await postService.likePost(req.params.id, req.user._id);

  sendSuccess(res, 200, 'Post liked', result);
});

const unlikePost = asyncHandler(async (req, res) => {
  const result = await postService.unlikePost(req.params.id, req.user._id);

  sendSuccess(res, 200, 'Post unliked', result);
});

module.exports = {
  createPost,
  getPosts,
  likePost,
  unlikePost,
};
