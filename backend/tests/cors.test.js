require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'development';
process.env.CLIENT_URL = 'http://localhost:8081';

const app = require('../src/app');

describe('CORS', () => {
  it('OPTIONS preflight allows localhost:8082 in development', async () => {
    const res = await request(app)
      .options('/api/auth/signup')
      .set('Origin', 'http://localhost:8082')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

    assert.ok(res.status === 204 || res.status === 200);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:8082');
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
  });

  it('OPTIONS preflight allows localhost:8081 in development', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:8081')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

    assert.ok(res.status === 204 || res.status === 200);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:8081');
  });

  it('OPTIONS preflight allows localhost:8083 in development', async () => {
    const res = await request(app)
      .options('/api/auth/me')
      .set('Origin', 'http://localhost:8083')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Authorization');

    assert.ok(res.status === 204 || res.status === 200);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:8083');
  });
});
