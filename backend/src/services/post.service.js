const Post = require('../models/Post');
const AppError = require('../utils/AppError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
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

const formatPost = (post, userId) => ({
  _id: post._id,
  content: post.content,
  author: formatAuthor(post.author),
  likesCount: post.likesCount ?? 0,
  likedByMe: userId
    ? (post.likes || []).some((id) => id.toString() === userId.toString())
    : false,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

const createPost = async (userId, content) => {
  const post = await Post.create({
    content,
    author: userId,
  });

  const populated = await Post.findById(post._id)
    .populate('author', AUTHOR_FIELDS)
    .lean();

  return formatPost({ ...populated, likes: [], likesCount: 0 }, userId);
};

const getPosts = async ({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, userId } = {}) => {
  const safePage = Math.max(1, Number(page) || DEFAULT_PAGE);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));
  const skip = (safePage - 1) * safeLimit;

  const [posts, total] = await Promise.all([
    Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('author', AUTHOR_FIELDS)
      .select('content author likes likesCount createdAt updatedAt')
      .lean(),
    Post.countDocuments(),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    posts: posts.map((post) => formatPost(post, userId)),
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

const likePost = async (postId, userId) => {
  const updated = await Post.findOneAndUpdate(
    { _id: postId, likes: { $ne: userId } },
    { $addToSet: { likes: userId }, $inc: { likesCount: 1 } },
    { new: true }
  ).select('likesCount');

  if (updated) {
    return { liked: true, likesCount: updated.likesCount };
  }

  const existing = await Post.findById(postId).select('likesCount');
  if (!existing) {
    throw new AppError('Post not found', 404);
  }

  return { liked: true, likesCount: existing.likesCount };
};

const unlikePost = async (postId, userId) => {
  const updated = await Post.findOneAndUpdate(
    { _id: postId, likes: userId },
    { $pull: { likes: userId }, $inc: { likesCount: -1 } },
    { new: true }
  ).select('likesCount');

  if (updated) {
    const likesCount = Math.max(0, updated.likesCount);

    if (updated.likesCount < 0) {
      await Post.findByIdAndUpdate(postId, { likesCount });
    }

    return { liked: false, likesCount };
  }

  const existing = await Post.findById(postId).select('likesCount');
  if (!existing) {
    throw new AppError('Post not found', 404);
  }

  return { liked: false, likesCount: Math.max(0, existing.likesCount) };
};

module.exports = {
  createPost,
  getPosts,
  likePost,
  unlikePost,
};
