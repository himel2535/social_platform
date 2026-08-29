const Comment = require('../models/Comment');
const Post = require('../models/Post');
const AppError = require('../utils/AppError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const AUTHOR_FIELDS = 'name username avatar';

const formatAuthor = (author) => {
  if (!author) {
    return null;
  }

  return {
    _id: author._id,
    name: author.name,
    username: author.username,
    avatar: author.avatar || null,
  };
};

const formatComment = (comment) => ({
  _id: comment._id,
  content: comment.content,
  author: formatAuthor(comment.author),
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

const getComments = async (postId, { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) => {
  const post = await Post.findById(postId).select('_id');
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const safePage = Math.max(1, Number(page) || DEFAULT_PAGE);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));
  const skip = (safePage - 1) * safeLimit;

  const [comments, total] = await Promise.all([
    Comment.find({ post: postId })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('author', AUTHOR_FIELDS)
      .lean(),
    Comment.countDocuments({ post: postId }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    comments: comments.map(formatComment),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
};

const createComment = async (postId, userId, content) => {
  const post = await Post.findById(postId).select('_id');
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content,
  });

  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    { $inc: { commentsCount: 1 } },
    { new: true }
  ).select('commentsCount');

  const populated = await Comment.findById(comment._id)
    .populate('author', AUTHOR_FIELDS)
    .lean();

  return {
    comment: formatComment(populated),
    commentsCount: updatedPost.commentsCount,
  };
};

const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  if (comment.author.toString() !== userId.toString()) {
    throw new AppError('Not authorized to delete this comment', 403);
  }

  await Comment.deleteOne({ _id: commentId });

  const updatedPost = await Post.findByIdAndUpdate(
    comment.post,
    { $inc: { commentsCount: -1 } },
    { new: true }
  ).select('commentsCount');

  let commentsCount = Math.max(0, updatedPost?.commentsCount ?? 0);

  if (updatedPost && updatedPost.commentsCount < 0) {
    await Post.findByIdAndUpdate(comment.post, { commentsCount: 0 });
    commentsCount = 0;
  }

  return { commentsCount };
};

module.exports = {
  getComments,
  createComment,
  deleteComment,
};
