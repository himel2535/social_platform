const Post = require('../models/Post');

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

const formatPost = (post) => ({
  _id: post._id,
  content: post.content,
  author: formatAuthor(post.author),
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

  return formatPost(populated);
};

const getPosts = async ({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) => {
  const safePage = Math.max(1, Number(page) || DEFAULT_PAGE);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));
  const skip = (safePage - 1) * safeLimit;

  const [posts, total] = await Promise.all([
    Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('author', AUTHOR_FIELDS)
      .lean(),
    Post.countDocuments(),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    posts: posts.map(formatPost),
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

module.exports = {
  createPost,
  getPosts,
};
