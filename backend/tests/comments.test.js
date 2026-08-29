require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { after, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.NODE_ENV = 'test';

const { getTestDatabaseUri } = require('./helpers/testDb');
const TEST_DB_URI = getTestDatabaseUri();

const app = require('../src/app');
const Comment = require('../src/models/Comment');
const Post = require('../src/models/Post');
const { clearTestCollections } = require('./helpers/dbCleanup');

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

describe('Comments API', async () => {
  try {
    await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    console.warn(`MongoDB unavailable (${error.message}) — skipping comments integration tests`);
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

  it('GET /api/posts/:id/comments — without token returns 401', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app).get(`/api/posts/${post._id}/comments`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('POST /api/posts/:id/comments — without token returns 401', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .send({ content: 'Hello' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('DELETE /api/comments/:id — without token returns 401', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).delete(`/api/comments/${fakeId}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('GET /api/posts/:id/comments — invalid post ID returns 400', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .get('/api/posts/not-a-valid-id/comments')
      .set(authHeader(token));

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('DELETE /api/comments/:id — invalid comment ID returns 400', async () => {
    const { token } = await signupAndGetToken();

    const res = await request(app)
      .delete('/api/comments/not-a-valid-id')
      .set(authHeader(token));

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('GET /api/posts/:id/comments — non-existent post returns 404', async () => {
    const { token } = await signupAndGetToken();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .get(`/api/posts/${fakeId}/comments`)
      .set(authHeader(token));

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it('POST /api/posts/:id/comments — missing content returns 400', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('POST /api/posts/:id/comments — empty content returns 400', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: '' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('POST /api/posts/:id/comments — whitespace content returns 400', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: '   ' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('POST /api/posts/:id/comments — content over 500 characters returns 400', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'a'.repeat(501) });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('POST /api/posts/:id/comments — valid comment returns 201', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'This is a comment' });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Comment added successfully');
    assert.ok(res.body.data.comment._id);
    assert.equal(res.body.data.comment.content, 'This is a comment');
    assert.equal(res.body.data.commentsCount, 1);
  });

  it('POST /api/posts/:id/comments — author comes from authenticated user', async () => {
    const { token, user } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'My comment' });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.comment.author._id, user._id);
    assert.equal(res.body.data.comment.author.name, user.name);
  });

  it('GET /api/posts/:id/comments — comment appears in list', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'Visible comment' });

    const res = await request(app)
      .get(`/api/posts/${post._id}/comments`)
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data.comments.length, 1);
    assert.equal(res.body.data.comments[0].content, 'Visible comment');
  });

  it('GET /api/posts/:id/comments — newest comments first', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'Older comment' });

    await new Promise((resolve) => setTimeout(resolve, 50));

    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'Newer comment' });

    const res = await request(app)
      .get(`/api/posts/${post._id}/comments`)
      .set(authHeader(token));

    assert.equal(res.body.data.comments[0].content, 'Newer comment');
    assert.equal(res.body.data.comments[1].content, 'Older comment');
  });

  it('GET /api/posts/:id/comments — pagination works', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    for (let i = 1; i <= 25; i += 1) {
      await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set(authHeader(token))
        .send({ content: `Comment ${i}` });
    }

    const page1 = await request(app)
      .get(`/api/posts/${post._id}/comments?page=1&limit=20`)
      .set(authHeader(token));

    const page2 = await request(app)
      .get(`/api/posts/${post._id}/comments?page=2&limit=20`)
      .set(authHeader(token));

    assert.equal(page1.body.data.comments.length, 20);
    assert.equal(page2.body.data.comments.length, 5);
    assert.equal(page1.body.data.pagination.total, 25);
  });

  it('GET /api/posts/:id/comments — maximum limit is enforced', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const res = await request(app)
      .get(`/api/posts/${post._id}/comments?limit=999`)
      .set(authHeader(token));

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('GET /api/posts/:id/comments — password is never returned', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'Safe fields check' });

    const res = await request(app)
      .get(`/api/posts/${post._id}/comments`)
      .set(authHeader(token));

    assert.equal(res.body.data.comments[0].author.password, undefined);
    assert.equal(res.body.data.comments[0].author.email, undefined);
  });

  it('DELETE /api/comments/:id — user cannot delete another user comment returns 403', async () => {
    const userA = await signupAndGetToken();
    const userB = await signupAndGetToken();
    const post = await createTestPost(userA.token);

    const createRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(userA.token))
      .send({ content: 'User A comment' });

    const commentId = createRes.body.data.comment._id;

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set(authHeader(userB.token));

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('DELETE /api/comments/:id — user can delete own comment', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const createRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'Delete me' });

    const commentId = createRes.body.data.comment._id;

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set(authHeader(token));

    assert.equal(res.status, 200);
    assert.equal(res.body.message, 'Comment deleted successfully');
    assert.equal(res.body.data.commentsCount, 0);

    const remaining = await Comment.findById(commentId);
    assert.equal(remaining, null);
  });

  it('POST /api/posts/:id/comments — commentsCount increments correctly', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'First' });

    const second = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'Second' });

    assert.equal(second.body.data.commentsCount, 2);

    const dbPost = await Post.findById(post._id);
    assert.equal(dbPost.commentsCount, 2);
  });

  it('DELETE /api/comments/:id — commentsCount decrements correctly', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const createRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'To delete' });

    const commentId = createRes.body.data.comment._id;

    const deleteRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set(authHeader(token));

    assert.equal(deleteRes.body.data.commentsCount, 0);

    const dbPost = await Post.findById(post._id);
    assert.equal(dbPost.commentsCount, 0);
  });

  it('DELETE /api/comments/:id — commentsCount never becomes negative', async () => {
    const { token } = await signupAndGetToken();
    const post = await createTestPost(token);

    const createRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set(authHeader(token))
      .send({ content: 'Only one' });

    const commentId = createRes.body.data.comment._id;

    await Post.findByIdAndUpdate(post._id, { commentsCount: 0 });

    const deleteRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set(authHeader(token));

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.data.commentsCount, 0);

    const dbPost = await Post.findById(post._id);
    assert.equal(dbPost.commentsCount, 0);
  });
});
