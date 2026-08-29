const express = require('express');
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { commentIdRules } = require('../validators/comment.validator');

const router = express.Router();

router.delete('/:id', protect, commentIdRules, validate, commentController.deleteComment);

module.exports = router;
