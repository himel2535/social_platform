const express = require('express');
const postController = require('../controllers/post.controller');
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createPostRules,
  getPostsQueryRules,
  postIdRules,
} = require('../validators/post.validator');
const {
  createCommentRules,
  getCommentsQueryRules,
} = require('../validators/comment.validator');

const router = express.Router();

router.post('/', protect, createPostRules, validate, postController.createPost);
router.get('/', protect, getPostsQueryRules, validate, postController.getPosts);
router.get(
  '/:id/comments',
  protect,
  postIdRules,
  getCommentsQueryRules,
  validate,
  commentController.getComments
);
router.post(
  '/:id/comments',
  protect,
  postIdRules,
  createCommentRules,
  validate,
  commentController.createComment
);
router.post('/:id/like', protect, postIdRules, validate, postController.likePost);
router.delete('/:id/like', protect, postIdRules, validate, postController.unlikePost);

module.exports = router;
