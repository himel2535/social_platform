require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { after, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.NODE_ENV = 'test';

const { getTestDatabaseUri } = require('./helpers/testDb');
const TEST_DB_URI = getTestDatabaseUri();

const app = require('../src/app');
const { clearTestCollections } = require('./helpers/dbCleanup');

const unique = () => Date.now().toString(36);

const validUser = () => ({
  name: 'John Doe',
  username: `user_${unique()}`,
  email: `john_${unique()}@example.com`,
  password: 'StrongPassword123',
});

describe('Authentication API', async () => {
  let dbAvailable = false;

  try {
    await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
    dbAvailable = true;
  } catch (error) {
    console.warn(`MongoDB unavailable (${error.message}) — skipping auth integration tests`);
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

  it('POST /api/auth/signup — successful signup', async () => {
    const payload = validUser();
    const res = await request(app).post('/api/auth/signup').send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Account created successfully');
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, payload.email.toLowerCase());
    assert.equal(res.body.data.user.username, payload.username.toLowerCase());
    assert.equal(res.body.data.user.password, undefined);
  });

  it('POST /api/auth/signup — duplicate email', async () => {
    const payload = validUser();
    await request(app).post('/api/auth/signup').send(payload);

    const duplicate = {
      ...validUser(),
      email: payload.email,
    };

    const res = await request(app).post('/api/auth/signup').send(duplicate);

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /email/i);
  });

  it('POST /api/auth/signup — duplicate username', async () => {
    const payload = validUser();
    await request(app).post('/api/auth/signup').send(payload);

    const duplicate = {
      ...validUser(),
      username: payload.username,
    };

    const res = await request(app).post('/api/auth/signup').send(duplicate);

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /username/i);
  });

  it('POST /api/auth/signup — invalid signup data', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'J',
      username: 'ab',
      email: 'not-an-email',
      password: '123',
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message);
  });

  it('POST /api/auth/login — successful login', async () => {
    const payload = validUser();
    await request(app).post('/api/auth/signup').send(payload);

    const res = await request(app).post('/api/auth/login').send({
      email: payload.email,
      password: payload.password,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Login successful');
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, payload.email.toLowerCase());
  });

  it('POST /api/auth/login — wrong password', async () => {
    const payload = validUser();
    await request(app).post('/api/auth/signup').send(payload);

    const res = await request(app).post('/api/auth/login').send({
      email: payload.email,
      password: 'WrongPassword999',
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password');
  });

  it('POST /api/auth/login — nonexistent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'missing@example.com',
      password: 'StrongPassword123',
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password');
  });

  it('GET /api/auth/me — valid token', async () => {
    const payload = validUser();
    const signupRes = await request(app).post('/api/auth/signup').send(payload);
    const token = signupRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, payload.email.toLowerCase());
  });

  it('GET /api/auth/me — without token', async () => {
    const res = await request(app).get('/api/auth/me');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /not authorized/i);
  });

  it('GET /api/auth/me — invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid token');
  });

  it('GET /api/auth/me — expired token', async () => {
    const payload = validUser();
    const signupRes = await request(app).post('/api/auth/signup').send(payload);
    const userId = signupRes.body.data.user._id;

    const expiredToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '-1s',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Token expired');
  });
});
