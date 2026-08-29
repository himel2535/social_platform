require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';

const app = require('../src/app');

describe('Health API', () => {
  it('GET /api/health — returns ok', async () => {
    const res = await request(app).get('/api/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.status, 'ok');
  });
});
