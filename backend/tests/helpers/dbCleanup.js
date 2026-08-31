const Comment = require('../../src/models/Comment');
const Conversation = require('../../src/models/Conversation');
const Follow = require('../../src/models/Follow');
const Message = require('../../src/models/Message');
const Notification = require('../../src/models/Notification');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const { assertSafeTestDatabase } = require('./testDb');

async function clearTestCollections(uri) {
  assertSafeTestDatabase(uri);

  await Notification.deleteMany({});
  await Message.deleteMany({});
  await Conversation.deleteMany({});
  await Comment.deleteMany({});
  await Follow.deleteMany({});
  await Post.deleteMany({});
  await User.deleteMany({});
}

module.exports = { clearTestCollections };
