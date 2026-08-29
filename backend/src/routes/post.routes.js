const express = require('express');
const postController = require('../controllers/post.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPostRules, getPostsQueryRules } = require('../validators/post.validator');

const router = express.Router();

router.post('/', protect, createPostRules, validate, postController.createPost);
router.get('/', protect, getPostsQueryRules, validate, postController.getPosts);

module.exports = router;
