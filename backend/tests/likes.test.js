require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { after, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.NODE_ENV = 'test';

const TEST_DB_URI =
  process.env.MONGODB_URI_TEST ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/social_platform_test';

const app = require('../src/app');
const Post = require('../src/models/Post');
const User = require('../src/models/User');

const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const validUser = () => ({
  name: 'John Doe',
  username: `user_${unique()}`,
  email: `john_${unique()}@example.com`,
  password: 'StrongPassword123',
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const signupAndGetToken = async () => {
  const payload = validUser();
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

describe('Likes API', async () => {
  try {
    await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    console.warn(`MongoDB unavailable (${error.message}) — skipping likes integration tests`);
    await mongoose.disconnect().catch(() => {});
    return;
  }

  after(async () => {
    await Post.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Post.deleteMany({});
    await User.deleteMany({});
  });

  it('POST /api/posts/:id/like — without token returns 401', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app).post(`/api/posts/${post._id}/like`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('DELETE /api/posts/:id/like — without token returns 401', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app).delete(`/api/posts/${post._id}/like`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('POST /api/posts/:id/like — invalid token returns 401', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set('Authorization', 'Bearer invalid.token.here');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('POST /api/posts/:id/like — nonexistent post returns 404', async () => {
    const { token } = await signupAndGetToken();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/posts/${fakeId}/like`)
      .set(authHeader(token));

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not found/i);
  });

  it('POST /api/posts/:id/like — malformed post ID returns 400', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .post('/api/posts/not-a-valid-id/like')
      .set(authHeader(token));

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('POST /api/posts/:id/like — valid like returns 200', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Post liked');
    assert.equal(res.body.data.liked, true);
    assert.equal(res.body.data.likesCount, 1);
  });

  it('POST /api/posts/:id/like — likesCount increases correctly', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(token));

    const dbPost = await Post.findById(post._id);
    assert.equal(dbPost.likesCount, 1);
    assert.equal(dbPost.likes.length, 1);
  });

  it('GET /api/posts — likedByMe is true after like', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(token));

    const feed = await request(app).get('/api/posts').set(authHeader(token));

    assert.equal(feed.status, 200);
    assert.equal(feed.body.data.posts[0].likedByMe, true);
    assert.equal(feed.body.data.posts[0].likesCount, 1);
  });

  it('POST /api/posts/:id/like — duplicate like does not create duplicate like', async () => {
    const { token, user } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(token));
    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(token));

    const dbPost = await Post.findById(post._id);
    assert.equal(dbPost.likes.length, 1);
    assert.equal(dbPost.likes[0].toString(), user._id);
  });

  it('POST /api/posts/:id/like — duplicate like does not increment count', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(token));

    const second = await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set(authHeader(token));

    assert.equal(second.status, 200);
    assert.equal(second.body.data.likesCount, 1);
  });

  it('DELETE /api/posts/:id/like — valid unlike returns 200', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(token));

    const res = await request(app)
      .delete(`/api/posts/${post._id}/like`)
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Post unliked');
    assert.equal(res.body.data.liked, false);
    assert.equal(res.body.data.likesCount, 0);
  });

  it('DELETE /api/posts/:id/like — likesCount decreases correctly', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(token));
    await request(app).delete(`/api/posts/${post._id}/like`).set(authHeader(token));

    const dbPost = await Post.findById(post._id);
    assert.equal(dbPost.likesCount, 0);
    assert.equal(dbPost.likes.length, 0);
  });

  it('GET /api/posts — likedByMe is false after unlike', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(token));
    await request(app).delete(`/api/posts/${post._id}/like`).set(authHeader(token));

    const feed = await request(app).get('/api/posts').set(authHeader(token));

    assert.equal(feed.body.data.posts[0].likedByMe, false);
    assert.equal(feed.body.data.posts[0].likesCount, 0);
  });

  it('DELETE /api/posts/:id/like — duplicate unlike is safe', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const first = await request(app)
      .delete(`/api/posts/${post._id}/like`)
      .set(authHeader(token));

    const second = await request(app)
      .delete(`/api/posts/${post._id}/like`)
      .set(authHeader(token));

    assert.equal(first.status, 200);
    assert.equal(first.body.data.liked, false);
    assert.equal(first.body.data.likesCount, 0);
    assert.equal(second.status, 200);
    assert.equal(second.body.data.likesCount, 0);
  });

  it('GET /api/posts — User A like does not appear as User B likedByMe', async () => {
    const userA = await signupAndGetToken();
    const userB = await signupAndGetToken();
    const post = await createTestPost(userA.token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(userA.token));

    const feedB = await request(app).get('/api/posts').set(authHeader(userB.token));

    assert.equal(feedB.body.data.posts[0].likesCount, 1);
    assert.equal(feedB.body.data.posts[0].likedByMe, false);
  });

  it('GET /api/posts — returns correct likedByMe for each user', async () => {
    const userA = await signupAndGetToken();
    const userB = await signupAndGetToken();
    const post = await createTestPost(userA.token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(userA.token));
    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(userB.token));

    const feedA = await request(app).get('/api/posts').set(authHeader(userA.token));
    const feedB = await request(app).get('/api/posts').set(authHeader(userB.token));

    assert.equal(feedA.body.data.posts[0].likedByMe, true);
    assert.equal(feedB.body.data.posts[0].likedByMe, true);
    assert.equal(feedA.body.data.posts[0].likesCount, 2);
  });

  it('GET /api/posts — returns correct likesCount', async () => {
    const userA = await signupAndGetToken();
    const userB = await signupAndGetToken();
    const post = await createTestPost(userA.token);

    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(userA.token));
    await request(app).post(`/api/posts/${post._id}/like`).set(authHeader(userB.token));

    const feed = await request(app).get('/api/posts').set(authHeader(userA.token));

    assert.equal(feed.body.data.posts[0].likesCount, 2);
  });

  it('GET /api/posts — password is not exposed in author response', async () => {
    const { token } = await signupAndGetToken();
    await createTestPost(token);

    const feed = await request(app).get('/api/posts').set(authHeader(token));

    assert.equal(feed.body.data.posts[0].author.password, undefined);
    assert.equal(feed.body.data.posts[0].likes, undefined);
  });
});
