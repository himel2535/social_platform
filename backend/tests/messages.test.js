require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const http = require('http');
const mongoose = require('mongoose');
const { after, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.NODE_ENV = 'test';

const { getTestDatabaseUri } = require('./helpers/testDb');
const TEST_DB_URI = getTestDatabaseUri();

const app = require('../src/app');
const { clearTestCollections } = require('./helpers/dbCleanup');
const { resetMessageRateLimiter } = require('../src/utils/messageRateLimiter');
const { buildConversationId } = require('../src/utils/conversationId');

const unique = () => Date.now().toString(36);

const validUser = () => ({
  name: 'John Doe',
  username: `user_${unique()}`,
  email: `john_${unique()}@example.com`,
  password: 'StrongPassword123',
});

async function signupUser(overrides = {}) {
  const payload = { ...validUser(), ...overrides };
  const res = await request(app).post('/api/auth/signup').send(payload);

  assert.equal(res.status, 201);

  return {
    token: res.body.data.token,
    user: res.body.data.user,
  };
}

function connectSocketClient(server, token) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}`;

    const socket = ioClient(url, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });

    socket.on('connect', () => resolve({ socket, url }));
    socket.on('connect_error', (err) => reject(err));
  });
}

describe('Messaging API and sockets', async () => {
  let dbAvailable = false;
  let server;
  let io;

  try {
    await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 5000 });
    dbAvailable = true;
  } catch (error) {
    console.warn(`MongoDB unavailable (${error.message}) — skipping messaging integration tests`);
    await mongoose.disconnect().catch(() => {});
    return;
  }

  beforeEach(async () => {
    await clearTestCollections(TEST_DB_URI);
    resetMessageRateLimiter();
  });

  after(async () => {
    if (io) {
      io.close();
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    await clearTestCollections(TEST_DB_URI);
    await mongoose.connection.close();
  });

  it('GET /api/conversations and message history work', async () => {
    const userA = await signupUser({ name: 'Alice' });
    const userB = await signupUser({ name: 'Bob' });

    server = http.createServer(app);
    io = new Server(server, { cors: { origin: true } });
    require('../src/socket')(io);

    await new Promise((resolve) => server.listen(0, resolve));

    const { socket: senderSocket } = await connectSocketClient(server, userA.token);

    const sendResult = await new Promise((resolve, reject) => {
      senderSocket.emit(
        'send_message',
        { receiverId: userB.user._id, text: 'Hello Bob' },
        (response) => {
          if (!response?.success) {
            reject(new Error(response?.message || 'send_message failed'));
            return;
          }

          resolve(response.data);
        },
      );
    });

    assert.equal(sendResult.message.text, 'Hello Bob');

    const conversationsRes = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${userB.token}`);

    assert.equal(conversationsRes.status, 200);
    assert.equal(conversationsRes.body.data.conversations.length, 1);
    assert.equal(conversationsRes.body.data.conversations[0].unreadCount, 1);
    assert.equal(conversationsRes.body.data.conversations[0].participant.username, userA.user.username);

    const messagesRes = await request(app)
      .get(`/api/conversations/${userA.user._id}/messages`)
      .set('Authorization', `Bearer ${userB.token}`);

    assert.equal(messagesRes.status, 200);
    assert.equal(messagesRes.body.data.messages.length, 1);
    assert.equal(messagesRes.body.data.messages[0].text, 'Hello Bob');

    senderSocket.disconnect();
    io.close();
    await new Promise((resolve) => server.close(resolve));
    server = null;
    io = null;
  });

  it('socket send_message delivers new_message and mark_read emits messages_read', async () => {
    const userA = await signupUser({ name: 'Alice' });
    const userB = await signupUser({ name: 'Bob' });
    const conversationId = buildConversationId(userA.user._id, userB.user._id);

    server = http.createServer(app);
    io = new Server(server, { cors: { origin: true } });
    require('../src/socket')(io);

    await new Promise((resolve) => server.listen(0, resolve));

    const { socket: receiverSocket } = await connectSocketClient(server, userB.token);
    const { socket: senderSocket } = await connectSocketClient(server, userA.token);

    const receivedPromise = new Promise((resolve) => {
      receiverSocket.on('new_message', (payload) => resolve(payload));
    });

    senderSocket.emit('send_message', { receiverId: userB.user._id, text: 'Ping' });

    const received = await receivedPromise;
    assert.equal(received.message.text, 'Ping');
    assert.equal(received.conversation.unreadCount, 1);

    const readPromise = new Promise((resolve) => {
      senderSocket.on('messages_read', (payload) => resolve(payload));
    });

    receiverSocket.emit('mark_read', { conversationId });

    const readEvent = await readPromise;
    assert.equal(readEvent.conversationId, conversationId);
    assert.equal(readEvent.readByUserId, userB.user._id);

    receiverSocket.disconnect();
    senderSocket.disconnect();
    io.close();
    await new Promise((resolve) => server.close(resolve));
    server = null;
    io = null;
  });

  it('rejects unauthenticated socket connections', async () => {
    server = http.createServer(app);
    io = new Server(server, { cors: { origin: true } });
    require('../src/socket')(io);

    await new Promise((resolve) => server.listen(0, resolve));

    await assert.rejects(
      () => connectSocketClient(server, 'invalid-token'),
      /Unauthorized|xhr poll error|websocket error/i,
    );

    io.close();
    await new Promise((resolve) => server.close(resolve));
    server = null;
    io = null;
  });
});
