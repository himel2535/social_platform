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

const unique = () => Date.now().toString(36);

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

  return {
    token: res.body.data.token,
    user: res.body.data.user,
    payload,
  };
};

const createTestPost = async (token, content) => {
  return request(app)
    .post('/api/posts')
    .set(authHeader(token))
    .send({ content });
};

describe('Posts API', async () => {
  let dbAvailable = false;

  try {
    await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
    dbAvailable = true;
  } catch (error) {
    console.warn(`MongoDB unavailable (${error.message}) — skipping posts integration tests`);
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

  it('POST /api/posts — without token returns 401', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ content: 'Hello world' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  });

  it('POST /api/posts — invalid token returns 401', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer invalid.token.here')
      .send({ content: 'Hello world' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid token');
  });

  it('POST /api/posts — missing content returns 400', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .post('/api/posts')
      .set(authHeader(token))
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /content/i);
  });

  it('POST /api/posts — empty content returns 400', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .post('/api/posts')
      .set(authHeader(token))
      .send({ content: '' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /content/i);
  });

  it('POST /api/posts — whitespace-only content returns 400', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .post('/api/posts')
      .set(authHeader(token))
      .send({ content: '   ' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /content/i);
  });

  it('POST /api/posts — valid content returns 201', async () => {
    const { token } = await signupAndGetToken();

    const res = await createTestPost(token, 'This is my first post!');

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Post created successfully');
    assert.ok(res.body.data.post._id);
    assert.equal(res.body.data.post.content, 'This is my first post!');
    assert.ok(res.body.data.post.author);
    assert.ok(res.body.data.post.createdAt);
    assert.ok(res.body.data.post.updatedAt);
  });

  it('POST /api/posts — created post author matches authenticated user', async () => {
    const { token, user } = await signupAndGetToken();

    const res = await createTestPost(token, 'Author check post');

    assert.equal(res.status, 201);
    assert.equal(res.body.data.post.author._id, user._id);
    assert.equal(res.body.data.post.author.name, user.name);
    assert.equal(res.body.data.post.author.username, user.username);
  });

  it('GET /api/posts — without token returns 401', async () => {
    const res = await request(app).get('/api/posts');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  });

  it('GET /api/posts — with token returns 200', async () => {
    const { token } = await signupAndGetToken();
    await createTestPost(token, 'Feed post');

    const res = await request(app).get('/api/posts').set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Posts retrieved successfully');
    assert.ok(Array.isArray(res.body.data.posts));
    assert.equal(res.body.data.posts.length, 1);
    assert.ok(res.body.data.pagination);
  });

  it('GET /api/posts — returns newest posts first', async () => {
    const { token } = await signupAndGetToken();

    await createTestPost(token, 'Older post');
    await new Promise((resolve) => setTimeout(resolve, 50));
    await createTestPost(token, 'Newer post');

    const res = await request(app).get('/api/posts').set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.posts.length, 2);
    assert.equal(res.body.data.posts[0].content, 'Newer post');
    assert.equal(res.body.data.posts[1].content, 'Older post');
  });

  it('GET /api/posts — pagination works', async () => {
    const { token } = await signupAndGetToken();

    for (let i = 1; i <= 12; i += 1) {
      await createTestPost(token, `Post number ${i}`);
    }

    const page1 = await request(app)
      .get('/api/posts?page=1&limit=10')
      .set(authHeader(token));

    const page2 = await request(app)
      .get('/api/posts?page=2&limit=10')
      .set(authHeader(token));

    assert.equal(page1.status, 200);
    assert.equal(page1.body.data.posts.length, 10);
    assert.equal(page2.status, 200);
    assert.equal(page2.body.data.posts.length, 2);
  });

  it('GET /api/posts — invalid page/limit handled safely', async () => {
    const { token } = await signupAndGetToken();

    const invalidPage = await request(app)
      .get('/api/posts?page=abc')
      .set(authHeader(token));

    const invalidLimit = await request(app)
      .get('/api/posts?limit=-10')
      .set(authHeader(token));

    assert.equal(invalidPage.status, 400);
    assert.equal(invalidPage.body.success, false);
    assert.equal(invalidLimit.status, 400);
    assert.equal(invalidLimit.body.success, false);
  });

  it('GET /api/posts — maximum limit is enforced', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .get('/api/posts?limit=999')
      .set(authHeader(token));

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /limit/i);
  });

  it('GET /api/posts — password is never present in author response', async () => {
    const { token } = await signupAndGetToken();
    await createTestPost(token, 'Safe author fields');

    const res = await request(app).get('/api/posts').set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.posts[0].author.password, undefined);
    assert.equal(res.body.data.posts[0].author.email, undefined);
    assert.equal(res.body.data.posts[0].author.fcmTokens, undefined);
  });

  it('GET /api/posts — pagination metadata is correct', async () => {
    const { token } = await signupAndGetToken();

    for (let i = 1; i <= 25; i += 1) {
      await createTestPost(token, `Metadata post ${i}`);
    }

    const res = await request(app)
      .get('/api/posts?page=1&limit=10')
      .set(authHeader(token));

    assert.equal(res.status, 200);

    const { pagination } = res.body.data;
    assert.equal(pagination.page, 1);
    assert.equal(pagination.limit, 10);
    assert.equal(pagination.total, 25);
    assert.equal(pagination.totalPages, 3);
    assert.equal(pagination.hasNextPage, true);
    assert.equal(pagination.hasPrevPage, false);

    const page3 = await request(app)
      .get('/api/posts?page=3&limit=10')
      .set(authHeader(token));

    assert.equal(page3.body.data.pagination.hasNextPage, false);
    assert.equal(page3.body.data.pagination.hasPrevPage, true);
    assert.equal(page3.body.data.posts.length, 5);
  });
});
