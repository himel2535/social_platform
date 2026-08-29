const Comment = require('../../src/models/Comment');
const Follow = require('../../src/models/Follow');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const { assertSafeTestDatabase } = require('./testDb');

async function clearTestCollections(uri) {
  assertSafeTestDatabase(uri);

  await Comment.deleteMany({});
  await Follow.deleteMany({});
  await Post.deleteMany({});
  await User.deleteMany({});
}

module.exports = { clearTestCollections };
