const express = require('express');
const postController = require('../controllers/post.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createPostRules,
  getPostsQueryRules,
  postIdRules,
} = require('../validators/post.validator');

const router = express.Router();

router.post('/', protect, createPostRules, validate, postController.createPost);
router.get('/', protect, getPostsQueryRules, validate, postController.getPosts);
router.post('/:id/like', protect, postIdRules, validate, postController.likePost);
router.delete('/:id/like', protect, postIdRules, validate, postController.unlikePost);

module.exports = router;
