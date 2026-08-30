require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { after, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.NODE_ENV = 'test';
delete process.env.FIREBASE_PROJECT_ID;
delete process.env.FIREBASE_CLIENT_EMAIL;
delete process.env.FIREBASE_PRIVATE_KEY;

const { getTestDatabaseUri } = require('./helpers/testDb');
const TEST_DB_URI = getTestDatabaseUri();

const app = require('../src/app');
const Notification = require('../src/models/Notification');
const User = require('../src/models/User');
const { clearTestCollections } = require('./helpers/dbCleanup');

const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const validUser = (overrides = {}) => ({
  name: 'John Doe',
  username: `user_${unique()}`,
  email: `john_${unique()}@example.com`,
  password: 'StrongPassword123',
  ...overrides,
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const signupAndGetToken = async (overrides = {}) => {
  const payload = validUser(overrides);
  const res = await request(app).post('/api/auth/signup').send(payload);

  assert.equal(res.status, 201, `Signup failed: ${res.body.message || res.text}`);

  return {
    token: res.body.data.token,
    user: res.body.data.user,
    payload,
  };
};

const createTestPost = async (token, content = 'Test post content') => {
  const res = await request(app)
    .post('/api/posts')
    .set(authHeader(token))
    .send({ content });

  return res.body.data.post;
};

const assertNoSecrets = (payload) => {
  const raw = JSON.stringify(payload);
  assert.equal(raw.includes('"password"'), false);
  assert.equal(raw.includes('"fcmTokens"'), false);
};

describe('Notifications API', async () => {
  try {
    await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    console.warn(`MongoDB unavailable (${error.message}) — skipping notification integration tests`);
    await mongoose.disconnect().catch(() => {});
    return;
  }

  after(async () => {
    await clearTestCollections(TEST_DB_URI);
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await clearTestCollections(TEST_DB_URI);
  });

  it('GET /api/notifications — without token returns 401', async () => {
    const res = await request(app).get('/api/notifications');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('GET /api/notifications — returns notifications for the authenticated user', async () => {
    const author = await signupAndGetToken({ name: 'Author One' });
    const actor = await signupAndGetToken({ name: 'Actor One' });
    const post = await createTestPost(author.token);

    await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set(authHeader(actor.token));

    const res = await request(app)
      .get('/api/notifications')
      .set(authHeader(author.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.notifications.length, 1);
    assert.equal(res.body.data.notifications[0].type, 'like');
    assert.equal(res.body.data.notifications[0].actor.name, 'Actor One');
    assert.equal(res.body.data.unreadCount, 1);
    assertNoSecrets(res.body);
  });

  it('GET /api/notifications — pagination works', async () => {
    const recipient = await signupAndGetToken();
    const actor = await signupAndGetToken();

    const docs = Array.from({ length: 25 }, (_, index) => ({
      recipient: recipient.user._id,
      actor: actor.user._id,
      type: 'follow',
      read: index < 5,
    }));
    await Notification.insertMany(docs);

    const page1 = await request(app)
      .get('/api/notifications?page=1&limit=20')
      .set(authHeader(recipient.token));
    const page2 = await request(app)
      .get('/api/notifications?page=2&limit=20')
      .set(authHeader(recipient.token));

    assert.equal(page1.status, 200);
    assert.equal(page1.body.data.notifications.length, 20);
    assert.equal(page1.body.data.pagination.page, 1);
    assert.equal(page1.body.data.pagination.limit, 20);
    assert.equal(page1.body.data.pagination.total, 25);
    assert.equal(page1.body.data.pagination.hasNextPage, true);
    assert.equal(page2.body.data.notifications.length, 5);
    assert.equal(page2.body.data.pagination.page, 2);
    assert.equal(page2.body.data.pagination.hasPrevPage, true);
  });

  it('GET /api/notifications — unread count is accurate', async () => {
    const recipient = await signupAndGetToken();
    const actor = await signupAndGetToken();

    await Notification.create([
      { recipient: recipient.user._id, actor: actor.user._id, type: 'follow', read: false },
      { recipient: recipient.user._id, actor: actor.user._id, type: 'follow', read: true },
    ]);

    const res = await request(app)
      .get('/api/notifications')
      .set(authHeader(recipient.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.unreadCount, 1);
    assert.equal(res.body.data.pagination.total, 2);
  });

  it('PATCH /api/notifications/:id/read — marks one notification as read', async () => {
    const recipient = await signupAndGetToken();
    const actor = await signupAndGetToken();
    const notification = await Notification.create({
      recipient: recipient.user._id,
      actor: actor.user._id,
      type: 'follow',
    });

    const res = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set(authHeader(recipient.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.notification.read, true);

    const list = await request(app)
      .get('/api/notifications')
      .set(authHeader(recipient.token));
    assert.equal(list.body.data.unreadCount, 0);
  });

  it('PATCH /api/notifications/:id/read — cannot mark another user notification', async () => {
    const recipient = await signupAndGetToken();
    const other = await signupAndGetToken();
    const actor = await signupAndGetToken();
    const notification = await Notification.create({
      recipient: recipient.user._id,
      actor: actor.user._id,
      type: 'follow',
    });

    const res = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set(authHeader(other.token));

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);

    const stored = await Notification.findById(notification._id);
    assert.equal(stored.read, false);
  });

  it('PATCH /api/notifications/read-all — marks all as read', async () => {
    const recipient = await signupAndGetToken();
    const actor = await signupAndGetToken();
    await Notification.create([
      { recipient: recipient.user._id, actor: actor.user._id, type: 'follow', read: false },
      { recipient: recipient.user._id, actor: actor.user._id, type: 'follow', read: false },
    ]);

    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set(authHeader(recipient.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.updated, 2);

    const list = await request(app)
      .get('/api/notifications')
      .set(authHeader(recipient.token));
    assert.equal(list.body.data.unreadCount, 0);
    assert.ok(list.body.data.notifications.every((item) => item.read === true));
  });

  it('POST /api/notifications/device-token — registers a device token', async () => {
    const { token, user } = await signupAndGetToken();

    const res = await request(app)
      .post('/api/notifications/device-token')
      .set(authHeader(token))
      .send({ token: 'fcm-token-device-one' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assertNoSecrets(res.body);

    const stored = await User.findById(user._id).select('+fcmTokens');
    assert.deepEqual(stored.fcmTokens, ['fcm-token-device-one']);
  });

  it('POST /api/notifications/device-token — duplicate tokens are not stored twice', async () => {
    const { token, user } = await signupAndGetToken();

    await request(app)
      .post('/api/notifications/device-token')
      .set(authHeader(token))
      .send({ token: 'fcm-token-shared' });
    await request(app)
      .post('/api/notifications/device-token')
      .set(authHeader(token))
      .send({ token: 'fcm-token-shared' });
    await request(app)
      .post('/api/notifications/device-token')
      .set(authHeader(token))
      .send({ token: 'fcm-token-second-device' });

    const stored = await User.findById(user._id).select('+fcmTokens');
    assert.deepEqual(stored.fcmTokens, ['fcm-token-shared', 'fcm-token-second-device']);
  });

  it('DELETE /api/notifications/device-token — removes a device token', async () => {
    const { token, user } = await signupAndGetToken();

    await request(app)
      .post('/api/notifications/device-token')
      .set(authHeader(token))
      .send({ token: 'fcm-token-to-remove' });

    const res = await request(app)
      .delete('/api/notifications/device-token')
      .set(authHeader(token))
      .send({ token: 'fcm-token-to-remove' });

    assert.equal(res.status, 200);

    const stored = await User.findById(user._id).select('+fcmTokens');
    assert.deepEqual(stored.fcmTokens, []);
  });

  it('like creates a notification for the post author', async () => {
    const author = await signupAndGetToken({ name: 'Post Author' });
    const liker = await signupAndGetToken({ name: 'Post Liker' });
    const post = await createTestPost(author.token);

    const likeRes = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set(authHeader(liker.token));

    assert.equal(likeRes.status, 200);
    assert.equal(likeRes.body.data.liked, true);

    const stored = await Notification.find({ recipient: author.user._id });
    assert.equal(stored.length, 1);
    assert.equal(stored[0].type, 'like');
    assert.equal(stored[0].actor.toString(), liker.user._id);
    assert.equal(stored[0].post.toString(), post._id);
  });

  it('self-like does not create a notification', async () => {
    const author = await signupAndGetToken();
    const post = await createTestPost(author.token);

    const likeRes = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set(authHeader(author.token));

    assert.equal(likeRes.status, 200);
    const stored = await Notification.find({ recipient: author.user._id });
    assert.equal(stored.length, 0);
  });

  it('comment creates a notification for the post author', async () => {
    const author = await signupAndGetToken();
    const commenter = await signupAndGetToken({ name: 'Commenter' });
    const post = await createTestPost(author.token);

    const commentRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(commenter.token))
      .send({ content: 'Nice post' });

    assert.equal(commentRes.status, 201);

    const stored = await Notification.find({ recipient: author.user._id });
    assert.equal(stored.length, 1);
    assert.equal(stored[0].type, 'comment');
    assert.equal(stored[0].actor.toString(), commenter.user._id);
    assert.equal(stored[0].comment.toString(), commentRes.body.data.comment._id);
  });

  it('self-comment does not create a notification', async () => {
    const author = await signupAndGetToken();
    const post = await createTestPost(author.token);

    const commentRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(author.token))
      .send({ content: 'Note to self' });

    assert.equal(commentRes.status, 201);
    const stored = await Notification.find({ recipient: author.user._id });
    assert.equal(stored.length, 0);
  });

  it('follow creates a notification for the target user', async () => {
    const target = await signupAndGetToken({ name: 'Follow Target' });
    const follower = await signupAndGetToken({ name: 'Follower' });

    const followRes = await request(app)
      .post(`/api/users/${target.user.username}/follow`)
      .set(authHeader(follower.token));

    assert.equal(followRes.status, 200);
    assert.equal(followRes.body.data.following, true);

    const stored = await Notification.find({ recipient: target.user._id });
    assert.equal(stored.length, 1);
    assert.equal(stored[0].type, 'follow');
    assert.equal(stored[0].actor.toString(), follower.user._id);
  });

  it('GET /api/notifications — does not expose FCM tokens', async () => {
    const recipient = await signupAndGetToken();
    const actor = await signupAndGetToken();
    await request(app)
      .post('/api/notifications/device-token')
      .set(authHeader(recipient.token))
      .send({ token: 'secret-fcm-token-value' });
    await Notification.create({
      recipient: recipient.user._id,
      actor: actor.user._id,
      type: 'follow',
    });

    const res = await request(app)
      .get('/api/notifications')
      .set(authHeader(recipient.token));

    assert.equal(res.status, 200);
    assert.equal(JSON.stringify(res.body).includes('secret-fcm-token-value'), false);
    assert.equal(res.body.data.notifications[0].actor.fcmTokens, undefined);
    assert.equal(res.body.data.fcmTokens, undefined);
  });

  it('GET /api/notifications — does not expose passwords', async () => {
    const recipient = await signupAndGetToken();
    const actor = await signupAndGetToken();
    await Notification.create({
      recipient: recipient.user._id,
      actor: actor.user._id,
      type: 'follow',
    });

    const res = await request(app)
      .get('/api/notifications')
      .set(authHeader(recipient.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.notifications[0].actor.password, undefined);
    assert.equal(JSON.stringify(res.body).includes('StrongPassword123'), false);
  });

  it('PATCH /api/notifications/:id/read — invalid ID returns 400 and missing ID returns 404', async () => {
    const { token } = await signupAndGetToken();

    const invalid = await request(app)
      .patch('/api/notifications/not-a-valid-id/read')
      .set(authHeader(token));
    assert.equal(invalid.status, 400);

    const missing = await request(app)
      .patch('/api/notifications/507f1f77bcf86cd799439011/read')
      .set(authHeader(token));
    assert.equal(missing.status, 404);
  });

  it('like/unlike/like upserts a single like notification', async () => {
    const author = await signupAndGetToken();
    const liker = await signupAndGetToken();
    const post = await createTestPost(author.token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(liker.token));
    await request(app).delete(`/api/posts/${post._id}/like`).set(authHeader(liker.token));
    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(liker.token));

    const stored = await Notification.find({
      recipient: author.user._id,
      actor: liker.user._id,
      type: 'like',
    });
    assert.equal(stored.length, 1);
    assert.equal(stored[0].read, false);
  });
});
