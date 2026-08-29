const Comment = require('../../src/models/Comment');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');

async function clearTestCollections() {
  await Comment.deleteMany({});
  await Post.deleteMany({});
  await User.deleteMany({});
}

module.exports = { clearTestCollections };
