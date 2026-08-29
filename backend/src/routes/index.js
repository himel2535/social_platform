const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);

module.exports = router;
