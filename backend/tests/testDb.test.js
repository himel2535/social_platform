require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseDatabaseName,
  getTestDatabaseUri,
  assertSafeTestDatabase,
} = require('./helpers/testDb');

process.env.NODE_ENV = 'test';

describe('testDb safety helper', () => {
  it('parseDatabaseName extracts database name from URI', () => {
    assert.equal(
      parseDatabaseName('mongodb://127.0.0.1:27017/social_platform_test'),
      'social_platform_test',
    );
    assert.equal(
      parseDatabaseName('mongodb+srv://user:pass@cluster.mongodb.net/social_platform_test?retryWrites=true'),
      'social_platform_test',
    );
  });

  it('getTestDatabaseUri never falls back to MONGODB_URI', () => {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/social_platform';
    delete process.env.MONGODB_URI_TEST;

    assert.equal(
      getTestDatabaseUri(),
      'mongodb://127.0.0.1:27017/social_platform_test',
    );
  });

  it('assertSafeTestDatabase allows test database cleanup', () => {
    assert.doesNotThrow(() =>
      assertSafeTestDatabase('mongodb://127.0.0.1:27017/social_platform_test'),
    );
  });

  it('assertSafeTestDatabase refuses development database', () => {
    assert.throws(
      () => assertSafeTestDatabase('mongodb://127.0.0.1:27017/social_platform'),
      /forbidden development database/i,
    );
  });

  it('assertSafeTestDatabase refuses non-test database names', () => {
    assert.throws(
      () => assertSafeTestDatabase('mongodb://127.0.0.1:27017/other_db'),
      /must end with "_test"/i,
    );
  });
});
