const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const {
  buildConversationId,
  getOtherParticipantId,
  isParticipant,
} = require('../utils/conversationId');

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;
const PARTICIPANT_FIELDS = 'name username avatar';

const formatMessage = (message) => ({
  _id: message._id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  receiverId: message.receiverId,
  text: message.text,
  readAt: message.readAt ?? null,
  createdAt: message.createdAt,
});

const formatParticipant = (user) => {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatar: user.avatar || null,
  };
};

const getUnreadCount = (conversation, userId) => {
  const key = userId.toString();
  const counts = conversation.unreadCounts;

  if (counts instanceof Map) {
    return counts.get(key) || 0;
  }

  return counts?.[key] || 0;
};

const validateMessageText = (text) => {
  if (typeof text !== 'string') {
    throw new AppError('Message text must be a string', 400);
  }

  const trimmed = text.trim();

  if (!trimmed) {
    throw new AppError('Message text cannot be empty', 400);
  }

  if (trimmed.length > 2000) {
    throw new AppError('Message cannot exceed 2000 characters', 400);
  }

  return trimmed;
};

const validateReceiverId = (receiverId) => {
  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    throw new AppError('Invalid receiver ID', 400);
  }
};

const ensureReceiverExists = async (receiverId) => {
  const receiver = await User.findById(receiverId).select('_id');

  if (!receiver) {
    throw new AppError('Receiver not found', 404);
  }

  return receiver;
};

const sendMessage = async (senderId, receiverId, text) => {
  validateReceiverId(receiverId);

  if (senderId.toString() === receiverId.toString()) {
    throw new AppError('Cannot send a message to yourself', 400);
  }

  await ensureReceiverExists(receiverId);

  const trimmedText = validateMessageText(text);
  const conversationId = buildConversationId(senderId, receiverId);
  const sortedParticipants = [senderId, receiverId].sort((a, b) =>
    a.toString().localeCompare(b.toString()),
  );
  const receiverKey = receiverId.toString();

  const message = await Message.create({
    conversationId,
    senderId,
    receiverId,
    text: trimmedText,
  });

  const lastMessage = {
    text: trimmedText,
    senderId,
    createdAt: message.createdAt,
  };

  let conversation = await Conversation.findOne({ conversationId });

  if (!conversation) {
    conversation = await Conversation.create({
      conversationId,
      participants: sortedParticipants,
      lastMessage,
      lastMessageAt: message.createdAt,
      unreadCounts: new Map([[receiverKey, 1]]),
    });
  } else {
    const currentUnread = getUnreadCount(conversation, receiverId);

    conversation.lastMessage = lastMessage;
    conversation.lastMessageAt = message.createdAt;
    conversation.unreadCounts.set(receiverKey, currentUnread + 1);
    await conversation.save();
  }

  const formattedMessage = formatMessage(message);

  return {
    message: formattedMessage,
    conversation: {
      conversationId,
      lastMessage,
      lastMessageAt: message.createdAt,
      unreadCountForReceiver: getUnreadCount(conversation, receiverId),
      unreadCountForSender: getUnreadCount(conversation, senderId),
    },
  };
};

const listConversations = async (userId) => {
  const conversations = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1 })
    .lean();

  if (conversations.length === 0) {
    return [];
  }

  const otherParticipantIds = conversations.map((conversation) =>
    getOtherParticipantId(conversation.conversationId, userId),
  );

  const users = await User.find({ _id: { $in: otherParticipantIds } })
    .select(PARTICIPANT_FIELDS)
    .lean();

  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  return conversations.map((conversation) => {
    const otherParticipantId = getOtherParticipantId(conversation.conversationId, userId);

    return {
      conversationId: conversation.conversationId,
      participant: formatParticipant(userMap.get(otherParticipantId)),
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: getUnreadCount(conversation, userId),
    };
  });
};

const getMessagesWithUser = async (userId, otherUserId, { limit = DEFAULT_LIMIT, before } = {}) => {
  validateReceiverId(otherUserId);

  if (userId.toString() === otherUserId.toString()) {
    throw new AppError('Cannot load a conversation with yourself', 400);
  }

  await ensureReceiverExists(otherUserId);

  const conversationId = buildConversationId(userId, otherUserId);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));

  const filter = { conversationId };

  if (before) {
    if (!mongoose.Types.ObjectId.isValid(before)) {
      throw new AppError('Invalid before cursor', 400);
    }

    const cursorMessage = await Message.findOne({ _id: before, conversationId }).select('_id createdAt');

    if (!cursorMessage) {
      throw new AppError('Invalid before cursor', 400);
    }

    filter.createdAt = { $lt: cursorMessage.createdAt };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(safeLimit + 1)
    .lean();

  const hasMore = messages.length > safeLimit;
  const pageMessages = hasMore ? messages.slice(0, safeLimit) : messages;
  const oldestInPage = pageMessages[pageMessages.length - 1];

  return {
    conversationId,
    messages: pageMessages.map(formatMessage),
    pagination: {
      limit: safeLimit,
      hasMore,
      nextBefore: hasMore && oldestInPage ? oldestInPage._id.toString() : null,
    },
  };
};

const markConversationRead = async (userId, conversationId) => {
  if (!conversationId || typeof conversationId !== 'string') {
    throw new AppError('Conversation ID is required', 400);
  }

  if (!isParticipant(conversationId, userId)) {
    throw new AppError('Conversation not found', 404);
  }

  const otherParticipantId = getOtherParticipantId(conversationId, userId);
  const readAt = new Date();

  await Message.updateMany(
    {
      conversationId,
      senderId: otherParticipantId,
      receiverId: userId,
      readAt: null,
    },
    { $set: { readAt } },
  );

  const conversation = await Conversation.findOne({ conversationId });

  if (conversation) {
    conversation.unreadCounts.set(userId.toString(), 0);
    await conversation.save();
  }

  return {
    conversationId,
    readByUserId: userId.toString(),
    readAt: readAt.toISOString(),
    otherParticipantId,
  };
};

module.exports = {
  sendMessage,
  listConversations,
  getMessagesWithUser,
  markConversationRead,
  formatMessage,
};
