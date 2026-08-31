const messageService = require('../services/message.service');
const notificationService = require('../services/notification.service');
const { buildConversationId } = require('../utils/conversationId');
const { checkMessageRateLimit } = require('../utils/messageRateLimiter');
const AppError = require('../utils/AppError');

function getUserRoom(userId) {
  return `user:${userId.toString()}`;
}

function emitSocketError(socket, message, code = 'VALIDATION_ERROR') {
  socket.emit('error', { message, code });
}

function buildAckResponse(success, payload = {}) {
  return {
    success,
    ...payload,
  };
}

function registerMessageHandlers(io, socket) {
  const userId = socket.user._id;

  socket.on('send_message', async (payload = {}, ack) => {
    try {
      const rateCheck = checkMessageRateLimit(userId);

      if (!rateCheck.allowed) {
        const message = 'Too many messages. Please slow down.';
        emitSocketError(socket, message, 'RATE_LIMITED');

        if (typeof ack === 'function') {
          ack(buildAckResponse(false, { message, code: 'RATE_LIMITED' }));
        }

        return;
      }

      const { receiverId, text } = payload;
      const result = await messageService.sendMessage(userId, receiverId, text);

      const receiverRoom = getUserRoom(receiverId);
      const senderRoom = getUserRoom(userId);

      io.to(receiverRoom).emit('new_message', {
        message: result.message,
        conversation: {
          conversationId: result.conversation.conversationId,
          lastMessage: result.conversation.lastMessage,
          lastMessageAt: result.conversation.lastMessageAt,
          unreadCount: result.conversation.unreadCountForReceiver,
        },
      });

      io.to(senderRoom).emit('new_message', {
        message: result.message,
        conversation: {
          conversationId: result.conversation.conversationId,
          lastMessage: result.conversation.lastMessage,
          lastMessageAt: result.conversation.lastMessageAt,
          unreadCount: result.conversation.unreadCountForSender,
        },
      });

      const receiverSockets = await io.in(receiverRoom).fetchSockets();
      if (receiverSockets.length === 0) {
        await notificationService.createAndNotify({
          recipientId: receiverId,
          actorId: userId,
          type: 'message',
          conversationId: result.conversation.conversationId,
        });
      }

      if (typeof ack === 'function') {
        ack(
          buildAckResponse(true, {
            message: 'Message sent',
            data: result,
          }),
        );
      }
    } catch (err) {
      const message = err instanceof AppError ? err.message : 'Failed to send message';
      const code =
        err instanceof AppError && err.statusCode === 404
          ? 'NOT_FOUND'
          : err instanceof AppError && err.statusCode === 400
            ? 'VALIDATION_ERROR'
            : 'SERVER_ERROR';

      emitSocketError(socket, message, code);

      if (typeof ack === 'function') {
        ack(buildAckResponse(false, { message, code }));
      }
    }
  });

  socket.on('mark_read', async (payload = {}, ack) => {
    try {
      const { conversationId } = payload;
      const result = await messageService.markConversationRead(userId, conversationId);

      io.to(getUserRoom(result.otherParticipantId)).emit('messages_read', {
        conversationId: result.conversationId,
        readByUserId: result.readByUserId,
        readAt: result.readAt,
      });

      if (typeof ack === 'function') {
        ack(
          buildAckResponse(true, {
            message: 'Messages marked as read',
            data: {
              conversationId: result.conversationId,
              readByUserId: result.readByUserId,
              readAt: result.readAt,
            },
          }),
        );
      }
    } catch (err) {
      const message = err instanceof AppError ? err.message : 'Failed to mark messages as read';
      const code = err instanceof AppError && err.statusCode === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR';

      emitSocketError(socket, message, code);

      if (typeof ack === 'function') {
        ack(buildAckResponse(false, { message, code }));
      }
    }
  });

  socket.on('user_typing', (payload = {}) => {
    const { receiverId } = payload;

    if (!receiverId) {
      return;
    }

    const conversationId = buildConversationId(userId, receiverId);

    io.to(getUserRoom(receiverId)).emit('user_typing', {
      conversationId,
      userId: userId.toString(),
    });
  });

  socket.on('user_stopped_typing', (payload = {}) => {
    const { receiverId } = payload;

    if (!receiverId) {
      return;
    }

    const conversationId = buildConversationId(userId, receiverId);

    io.to(getUserRoom(receiverId)).emit('user_stopped_typing', {
      conversationId,
      userId: userId.toString(),
    });
  });
}

module.exports = {
  registerMessageHandlers,
  getUserRoom,
};
