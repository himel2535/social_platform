const DEFAULT_TEST_URI = 'mongodb://127.0.0.1:27017/social_platform_test';
const FORBIDDEN_DATABASES = new Set(['social_platform']);

const parseDatabaseName = (uri) => {
  if (!uri) {
    return '';
  }

  const withoutQuery = uri.split('?')[0];
  const segments = withoutQuery.split('/').filter(Boolean);
  const databaseName = segments[segments.length - 1] || '';

  if (databaseName.includes('@')) {
    return '';
  }

  return databaseName;
};

const getTestDatabaseUri = () => {
  if (process.env.MONGODB_URI_TEST) {
    return process.env.MONGODB_URI_TEST;
  }

  return DEFAULT_TEST_URI;
};

const assertSafeTestDatabase = (uri) => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Refusing database cleanup outside NODE_ENV=test');
  }

  const databaseName = parseDatabaseName(uri);

  if (!databaseName) {
    throw new Error('Refusing database cleanup — unable to determine database name from URI');
  }

  if (FORBIDDEN_DATABASES.has(databaseName)) {
    throw new Error(
      `Refusing database cleanup on forbidden development database "${databaseName}"`,
    );
  }

  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing database cleanup on non-test database "${databaseName}" — database name must end with "_test"`,
    );
  }
};

module.exports = {
  DEFAULT_TEST_URI,
  parseDatabaseName,
  getTestDatabaseUri,
  assertSafeTestDatabase,
};
