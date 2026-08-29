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
const Follow = require('../src/models/Follow');
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

describe('Follow API', async () => {
  try {
    await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    console.warn(`MongoDB unavailable (${error.message}) — skipping follow integration tests`);
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

  it('POST /api/users/:username/follow — without token returns 401', async () => {
    const { user: target } = await signupAndGetToken();

    const res = await request(app).post(`/api/users/${target.username}/follow`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('DELETE /api/users/:username/follow — without token returns 401', async () => {
    const { user: target } = await signupAndGetToken();

    const res = await request(app).delete(`/api/users/${target.username}/follow`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('POST /api/users/:username/follow — non-existent user returns 404', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .post('/api/users/nonexistent_user_xyz/follow')
      .set(authHeader(token));

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it('DELETE /api/users/:username/follow — non-existent user returns 404', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .delete('/api/users/nonexistent_user_xyz/follow')
      .set(authHeader(token));

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it('POST /api/users/:username/follow — follow yourself returns 400', async () => {
    const { token, user } = await signupAndGetToken();

    const res = await request(app)
      .post(`/api/users/${user.username}/follow`)
      .set(authHeader(token));

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /yourself/i);
  });

  it('POST /api/users/:username/follow — successful follow returns 200', async () => {
    const { token, user: follower } = await signupAndGetToken();
    const { user: target } = await signupAndGetToken({ name: 'Target User' });

    const res = await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.following, true);
    assert.equal(res.body.data.followersCount, 1);
    assert.equal(res.body.data.followingCount, 0);

    const relationship = await Follow.findOne({
      follower: follower._id,
      following: target._id,
    });
    assert.ok(relationship);
  });

  it('POST /api/users/:username/follow — duplicate follow handled safely', async () => {
    const { token } = await signupAndGetToken();
    const { user: target } = await signupAndGetToken();

    const first = await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(token));

    const second = await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(token));

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(second.body.data.following, true);
    assert.equal(second.body.data.followersCount, 1);

    const count = await Follow.countDocuments({ following: target._id });
    assert.equal(count, 1);
  });

  it('DELETE /api/users/:username/follow — successful unfollow returns 200', async () => {
    const { token } = await signupAndGetToken();
    const { user: target } = await signupAndGetToken();

    await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(token));

    const res = await request(app)
      .delete(`/api/users/${target.username}/follow`)
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.following, false);
    assert.equal(res.body.data.followersCount, 0);
  });

  it('DELETE /api/users/:username/follow — repeated unfollow handled safely', async () => {
    const { token } = await signupAndGetToken();
    const { user: target } = await signupAndGetToken();

    const first = await request(app)
      .delete(`/api/users/${target.username}/follow`)
      .set(authHeader(token));

    const second = await request(app)
      .delete(`/api/users/${target.username}/follow`)
      .set(authHeader(token));

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(second.body.data.following, false);
    assert.equal(second.body.data.followersCount, 0);
  });

  it('GET /api/users/:username — followers count is correct', async () => {
    const { token: tokenA } = await signupAndGetToken();
    const { token: tokenB } = await signupAndGetToken();
    const { user: target } = await signupAndGetToken();

    await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(tokenA));
    await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(tokenB));

    const res = await request(app).get(`/api/users/${target.username}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.followersCount, 2);
  });

  it('GET /api/users/:username — following count is correct', async () => {
    const { token, user: follower } = await signupAndGetToken();
    const { user: targetA } = await signupAndGetToken({ name: 'Target A' });
    const { user: targetB } = await signupAndGetToken({ name: 'Target B' });

    await request(app)
      .post(`/api/users/${targetA.username}/follow`)
      .set(authHeader(token));
    await request(app)
      .post(`/api/users/${targetB.username}/follow`)
      .set(authHeader(token));

    const profileRes = await request(app)
      .get(`/api/users/${follower.username}`)
      .set(authHeader(token));

    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.body.data.user.followingCount, 2);
  });

  it('GET /api/users/:username — profile following state is correct', async () => {
    const { token, user: follower } = await signupAndGetToken();
    const { user: target } = await signupAndGetToken();

    await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(token));

    const res = await request(app)
      .get(`/api/users/${target.username}`)
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.following, true);

    const ownProfile = await request(app)
      .get(`/api/users/${follower.username}`)
      .set(authHeader(token));

    assert.equal(ownProfile.body.data.user.following, false);
  });

  it('GET /api/users/:username/followers — returns followers list', async () => {
    const { token: tokenA } = await signupAndGetToken({ name: 'Follower A' });
    const { token: tokenB } = await signupAndGetToken({ name: 'Follower B' });
    const { user: target } = await signupAndGetToken({ name: 'Target User' });

    await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(tokenA));
    await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(tokenB));

    const res = await request(app)
      .get(`/api/users/${target.username}/followers`)
      .set(authHeader(tokenA));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.users.length, 2);
    assert.ok(res.body.data.pagination);
  });

  it('GET /api/users/:username/following — returns following list', async () => {
    const { token, user: mainUser } = await signupAndGetToken({ name: 'Main User' });
    const { user: targetA } = await signupAndGetToken({ name: 'Target A' });
    const { user: targetB } = await signupAndGetToken({ name: 'Target B' });

    await request(app)
      .post(`/api/users/${targetA.username}/follow`)
      .set(authHeader(token));
    await request(app)
      .post(`/api/users/${targetB.username}/follow`)
      .set(authHeader(token));

    const res = await request(app)
      .get(`/api/users/${mainUser.username}/following`)
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.users.length, 2);
  });

  it('GET /api/users/:username/followers — pagination works', async () => {
    const { token: viewerToken } = await signupAndGetToken();
    const { user: target } = await signupAndGetToken();

    for (let i = 0; i < 5; i += 1) {
      const { token } = await signupAndGetToken({ name: `Follower ${i}` });
      await request(app)
        .post(`/api/users/${target.username}/follow`)
        .set(authHeader(token));
    }

    const page1 = await request(app)
      .get(`/api/users/${target.username}/followers?page=1&limit=3`)
      .set(authHeader(viewerToken));

    const page2 = await request(app)
      .get(`/api/users/${target.username}/followers?page=2&limit=3`)
      .set(authHeader(viewerToken));

    assert.equal(page1.status, 200);
    assert.equal(page1.body.data.users.length, 3);
    assert.equal(page1.body.data.pagination.total, 5);
    assert.equal(page2.status, 200);
    assert.equal(page2.body.data.users.length, 2);

    const page1Ids = new Set(page1.body.data.users.map((user) => user._id));
    assert.equal(page2.body.data.users.some((user) => page1Ids.has(user._id)), false);
  });

  it('GET /api/users/:username/following — pagination works', async () => {
    const { token, user: mainUser } = await signupAndGetToken();

    for (let i = 0; i < 4; i += 1) {
      const { user: target } = await signupAndGetToken({ name: `Following Target ${i}` });
      await request(app)
        .post(`/api/users/${target.username}/follow`)
        .set(authHeader(token));
    }

    const page1 = await request(app)
      .get(`/api/users/${mainUser.username}/following?page=1&limit=2`)
      .set(authHeader(token));

    const page2 = await request(app)
      .get(`/api/users/${mainUser.username}/following?page=2&limit=2`)
      .set(authHeader(token));

    assert.equal(page1.status, 200);
    assert.equal(page1.body.data.users.length, 2);
    assert.equal(page1.body.data.pagination.total, 4);
    assert.equal(page2.status, 200);
    assert.equal(page2.body.data.users.length, 2);
  });

  it('GET /api/users/:username/followers — sensitive fields never returned', async () => {
    const { token: followerToken } = await signupAndGetToken();
    const { user: target } = await signupAndGetToken();

    await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(followerToken));

    const res = await request(app)
      .get(`/api/users/${target.username}/followers`)
      .set(authHeader(followerToken));

    assert.equal(res.status, 200);
    assert.ok(res.body.data.users.length >= 1);
    assert.equal(res.body.data.users[0].password, undefined);
    assert.equal(res.body.data.users[0].email, undefined);
    assert.equal(res.body.data.users[0].fcmTokens, undefined);
  });

  it('User A following User B does not imply User B follows User A', async () => {
    const { token: tokenA, user: userA } = await signupAndGetToken({ name: 'User A' });
    const { user: userB } = await signupAndGetToken({ name: 'User B' });

    await request(app)
      .post(`/api/users/${userB.username}/follow`)
      .set(authHeader(tokenA));

    const profileB = await request(app)
      .get(`/api/users/${userB.username}`)
      .set(authHeader(tokenA));

    const profileA = await request(app)
      .get(`/api/users/${userA.username}`)
      .set(authHeader(tokenA));

    assert.equal(profileB.body.data.user.following, true);
    assert.equal(profileA.body.data.user.following, false);
    assert.equal(profileA.body.data.user.followersCount, 0);
    assert.equal(profileB.body.data.user.followersCount, 1);
  });

  it('Multiple users have independent follow relationships', async () => {
    const { token: tokenA } = await signupAndGetToken();
    const { token: tokenB } = await signupAndGetToken();
    const { user: target } = await signupAndGetToken();

    await request(app)
      .post(`/api/users/${target.username}/follow`)
      .set(authHeader(tokenA));

    const profileForA = await request(app)
      .get(`/api/users/${target.username}`)
      .set(authHeader(tokenA));

    const profileForB = await request(app)
      .get(`/api/users/${target.username}`)
      .set(authHeader(tokenB));

    assert.equal(profileForA.body.data.user.following, true);
    assert.equal(profileForB.body.data.user.following, false);
    assert.equal(profileForA.body.data.user.followersCount, 1);
    assert.equal(profileForB.body.data.user.followersCount, 1);
  });

  it('Follow relationship unique at DB level', async () => {
    const { user: follower } = await signupAndGetToken();
    const { user: target } = await signupAndGetToken();

    await Follow.create({
      follower: follower._id,
      following: target._id,
    });

    await assert.rejects(
      () =>
        Follow.create({
          follower: follower._id,
          following: target._id,
        }),
      (error) => error.code === 11000,
    );
  });

  it('GET /api/users/me — includes followersCount and followingCount', async () => {
    const { token, user } = await signupAndGetToken();
    const { token: otherToken } = await signupAndGetToken();

    await request(app)
      .post(`/api/users/${user.username}/follow`)
      .set(authHeader(otherToken));

    const res = await request(app).get('/api/users/me').set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.followersCount, 1);
    assert.equal(res.body.data.user.followingCount, 0);
  });
});
