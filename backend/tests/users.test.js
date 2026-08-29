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

describe('Users API', async () => {
  try {
    await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    console.warn(`MongoDB unavailable (${error.message}) — skipping users integration tests`);
    await mongoose.disconnect().catch(() => {});
    return;
  }

  after(async () => {
    await clearTestCollections();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await clearTestCollections();
  });

  it('GET /api/users/me — without token returns 401', async () => {
    const res = await request(app).get('/api/users/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  });

  it('GET /api/users/me — with valid token returns 200', async () => {
    const { token, user } = await signupAndGetToken();

    const res = await request(app).get('/api/users/me').set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user._id, user._id);
    assert.equal(res.body.data.user.email, user.email);
    assert.equal(res.body.data.user.username, user.username);
  });

  it('GET /api/users/me — password never returned', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app).get('/api/users/me').set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.password, undefined);
    assert.equal(res.body.data.user.fcmTokens, undefined);
  });

  it('GET /api/users/:username — returns public profile', async () => {
    const { user } = await signupAndGetToken({ name: 'Jane Public', username: `jane_${unique()}` });

    const res = await request(app).get(`/api/users/${user.username}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user._id, user._id);
    assert.equal(res.body.data.user.name, 'Jane Public');
    assert.equal(res.body.data.user.username, user.username);
    assert.ok(res.body.data.user.createdAt);
  });

  it('GET /api/users/:username — non-existent username returns 404', async () => {
    const res = await request(app).get('/api/users/nonexistent_user_xyz');

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not found/i);
  });

  it('GET /api/users/:username — public profile never exposes password or email', async () => {
    const { user } = await signupAndGetToken();

    const res = await request(app).get(`/api/users/${user.username}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.password, undefined);
    assert.equal(res.body.data.user.email, undefined);
    assert.equal(res.body.data.user.fcmTokens, undefined);
  });

  it('PATCH /api/users/me — without token returns 401', async () => {
    const res = await request(app).patch('/api/users/me').send({ name: 'New Name' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('PATCH /api/users/me — update own name', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .patch('/api/users/me')
      .set(authHeader(token))
      .send({ name: 'Updated Name' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.name, 'Updated Name');
  });

  it('PATCH /api/users/me — update own bio', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .patch('/api/users/me')
      .set(authHeader(token))
      .send({ bio: 'Hello, I am a developer.' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.bio, 'Hello, I am a developer.');
  });

  it('PATCH /api/users/me — update own avatar', async () => {
    const { token } = await signupAndGetToken();
    const avatarUrl = 'https://example.com/avatar.png';

    const res = await request(app)
      .patch('/api/users/me')
      .set(authHeader(token))
      .send({ avatar: avatarUrl });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.avatar, avatarUrl);
  });

  it('PATCH /api/users/me — user cannot modify protected fields', async () => {
    const { token, user } = await signupAndGetToken();

    const res = await request(app)
      .patch('/api/users/me')
      .set(authHeader(token))
      .send({
        username: 'hacked_username',
        email: 'hacked@example.com',
        password: 'HackedPassword123',
        _id: '000000000000000000000000',
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);

    const stored = await User.findById(user._id);
    assert.equal(stored.username, user.username);
    assert.equal(stored.email, user.email);
  });

  it('GET /api/users/search — without token returns 401', async () => {
    const res = await request(app).get('/api/users/search?q=john');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('GET /api/users/search — valid query returns 200', async () => {
    const { token } = await signupAndGetToken({ name: 'Searchable User' });

    const res = await request(app)
      .get('/api/users/search?q=Searchable')
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.users));
    assert.ok(res.body.data.pagination);
    assert.ok(res.body.data.users.some((item) => item.name === 'Searchable User'));
  });

  it('GET /api/users/search — search by username', async () => {
    const username = `findme_${unique()}`;
    const { token } = await signupAndGetToken({ username });

    const res = await request(app)
      .get(`/api/users/search?q=${username}`)
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.users.length >= 1, true);
    assert.equal(res.body.data.users[0].username, username);
  });

  it('GET /api/users/search — search by name', async () => {
    const { token } = await signupAndGetToken({ name: 'Unique Search Name' });

    const res = await request(app)
      .get('/api/users/search?q=Unique Search')
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.ok(res.body.data.users.some((item) => item.name === 'Unique Search Name'));
  });

  it('GET /api/users/search — empty query returns 400', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app).get('/api/users/search?q=').set(authHeader(token));

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('GET /api/users/search — pagination works', async () => {
    const { token } = await signupAndGetToken({ name: 'Paginate Alpha' });

    for (let i = 0; i < 5; i += 1) {
      await signupAndGetToken({ name: `Paginate User ${i}` });
    }

    const page1 = await request(app)
      .get('/api/users/search?q=Paginate&page=1&limit=3')
      .set(authHeader(token));

    const page2 = await request(app)
      .get('/api/users/search?q=Paginate&page=2&limit=3')
      .set(authHeader(token));

    assert.equal(page1.status, 200);
    assert.equal(page1.body.data.posts, undefined);
    assert.equal(page1.body.data.users.length, 3);
    assert.equal(page1.body.data.pagination.total >= 6, true);
    assert.equal(page2.status, 200);
    assert.ok(page2.body.data.users.length >= 1);

    const page1Ids = new Set(page1.body.data.users.map((user) => user._id));
    assert.equal(page2.body.data.users.some((user) => page1Ids.has(user._id)), false);
  });

  it('GET /api/users/search — maximum limit enforced', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .get('/api/users/search?q=john&limit=999')
      .set(authHeader(token));

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /limit/i);
  });

  it('GET /api/users/search — password never appears in search results', async () => {
    const { token } = await signupAndGetToken({ name: 'Secure Search User' });

    const res = await request(app)
      .get('/api/users/search?q=Secure Search')
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.ok(res.body.data.users.length >= 1);
    assert.equal(res.body.data.users[0].password, undefined);
  });

  it('GET /api/users/search — does not expose sensitive fields', async () => {
    const { token } = await signupAndGetToken({ name: 'Private Fields User' });

    const res = await request(app)
      .get('/api/users/search?q=Private Fields')
      .set(authHeader(token));

    assert.equal(res.status, 200);
    const found = res.body.data.users.find((item) => item.name === 'Private Fields User');
    assert.ok(found);
    assert.equal(found.email, undefined);
    assert.equal(found.password, undefined);
    assert.equal(found.fcmTokens, undefined);
  });

  it('POST /api/auth/signup — duplicate username behavior remains safe', async () => {
    const username = `dup_${unique()}`;
    const first = await request(app)
      .post('/api/auth/signup')
      .send(validUser({ username }));

    const second = await request(app)
      .post('/api/auth/signup')
      .send(validUser({ username, email: `other_${unique()}@example.com` }));

    assert.equal(first.status, 201);
    assert.equal(second.status, 409);
    assert.match(second.body.message, /username/i);
  });
});
