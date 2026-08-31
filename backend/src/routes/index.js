const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const commentRoutes = require('./comment.routes');
const followRoutes = require('./follow.routes');
const userRoutes = require('./user.routes');
const notificationRoutes = require('./notification.routes');
const conversationRoutes = require('./conversation.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/conversations', conversationRoutes);
router.use('/users', followRoutes);
router.use('/users', userRoutes);

module.exports = router;
