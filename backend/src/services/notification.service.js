const Notification = require('../models/Notification');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { getMessaging } = require('../config/firebase');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const ACTOR_FIELDS = 'name username avatar';

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

const PUSH_COPY = {
  like: (name) => ({ title: 'New like', body: `${name} liked your post` }),
  comment: (name) => ({ title: 'New comment', body: `${name} commented on your post` }),
  follow: (name) => ({ title: 'New follower', body: `${name} started following you` }),
  message: (name) => ({ title: name, body: 'Sent you a message' }),
};

let socketIo = null;

const getUserRoom = (userId) => `user:${userId.toString()}`;

const setSocketIo = (io) => {
  socketIo = io;
};

const stringifyData = (data = {}) => {
  const payload = {};

  for (const [key, value] of Object.entries(data)) {
    if (value != null) {
      payload[key] = String(value);
    }
  }

  return payload;
};

const formatActor = (actor) => {
  if (!actor) {
    return null;
  }

  return {
    _id: actor._id,
    name: actor.name,
    username: actor.username,
    avatar: actor.avatar || null,
  };
};

const toId = (value) => {
  if (!value) {
    return null;
  }

  return value._id || value;
};

const formatNotification = (notification) => ({
  _id: notification._id,
  type: notification.type,
  read: notification.read,
  createdAt: notification.createdAt,
  actor: formatActor(notification.actor),
  post: notification.post ? { _id: toId(notification.post) } : null,
  comment: notification.comment ? { _id: toId(notification.comment) } : null,
  conversationId: notification.conversationId || null,
});

/**
 * Send push notification via FCM.
 * Never throws — FCM failures must not break like/comment/follow.
 */
const sendNotification = async ({ tokens, title, body, data = {} }) => {
  if (!tokens || tokens.length === 0) {
    return { success: false, reason: 'No FCM tokens provided' };
  }

  const messaging = getMessaging();

  if (!messaging) {
    console.warn('[Notification] Firebase not configured — skipping notification');
    return { success: false, reason: 'Firebase not configured' };
  }

  try {
    const message = {
      notification: { title, body },
      data: stringifyData(data),
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    return { success: true, response };
  } catch (error) {
    console.error('[Notification] Failed to send:', error.message);
    return { success: false, reason: error.message };
  }
};

const sendPushToUser = async (userId, { title, body, data = {} }) => {
  try {
    const user = await User.findById(userId).select('+fcmTokens');
    const tokens = user?.fcmTokens || [];

    if (tokens.length === 0) {
      return { success: false, reason: 'No FCM tokens provided' };
    }

    const result = await sendNotification({ tokens, title, body, data });

    if (result.response?.responses) {
      const invalidTokens = result.response.responses
        .map((entry, index) =>
          !entry.success && INVALID_TOKEN_CODES.has(entry.error?.code) ? tokens[index] : null
        )
        .filter(Boolean);

      if (invalidTokens.length > 0) {
        await User.removeFcmTokens(userId, invalidTokens);
      }
    }

    return result;
  } catch (error) {
    console.error('[Notification] Failed to send push:', error.message);
    return { success: false, reason: error.message };
  }
};

const persistNotification = async ({
  recipientId,
  actorId,
  type,
  postId,
  commentId,
  conversationId,
}) => {
  if (type === 'like' && postId) {
    return Notification.findOneAndUpdate(
      { recipient: recipientId, actor: actorId, type: 'like', post: postId },
      { $set: { read: false, createdAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  if (type === 'follow') {
    return Notification.findOneAndUpdate(
      { recipient: recipientId, actor: actorId, type: 'follow' },
      { $set: { read: false, createdAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  return Notification.create({
    recipient: recipientId,
    actor: actorId,
    type,
    post: postId || null,
    comment: commentId || null,
    conversationId: conversationId || null,
  });
};

const emitLiveNotification = async (notification) => {
  if (!socketIo || !notification?.recipient) {
    return;
  }

  try {
    const populated = await Notification.findById(notification._id)
      .populate('actor', ACTOR_FIELDS)
      .lean();

    if (!populated) {
      return;
    }

    const unreadCount = await Notification.countDocuments({
      recipient: notification.recipient,
      read: false,
    });

    socketIo.to(getUserRoom(notification.recipient)).emit('new_notification', {
      notification: formatNotification(populated),
      unreadCount,
    });
  } catch (error) {
    console.error('[Notification] Failed to emit live notification:', error.message);
  }
};

const isRecipientOnline = async (recipientId) => {
  if (!socketIo || !recipientId) {
    return false;
  }

  try {
    const sockets = await socketIo.in(getUserRoom(recipientId)).fetchSockets();
    return sockets.length > 0;
  } catch {
    return false;
  }
};

const sendPushForNotification = async (notification) => {
  const actor = await User.findById(notification.actor).select('name username');
  const actorName = actor?.name || 'Someone';
  const copy = PUSH_COPY[notification.type]?.(actorName) || {
    title: 'New notification',
    body: `${actorName} sent you a notification`,
  };

  return sendPushToUser(notification.recipient, {
    title: copy.title,
    body: copy.body,
    data: {
      type: notification.type,
      notificationId: notification._id,
      actorUsername: actor?.username || '',
      actorName: actorName,
      senderId: notification.actor || undefined,
      conversationId: notification.conversationId || undefined,
      postId: notification.post || undefined,
      commentId: notification.comment || undefined,
    },
  });
};

const createAndNotify = async ({
  recipientId,
  actorId,
  type,
  postId,
  commentId,
  conversationId,
}) => {
  try {
    if (!recipientId || !actorId || !type) {
      return null;
    }

    if (recipientId.toString() === actorId.toString()) {
      return null;
    }

    const notification = await persistNotification({
      recipientId,
      actorId,
      type,
      postId,
      commentId,
      conversationId,
    });

    if (!notification) {
      return null;
    }

    void emitLiveNotification(notification);

    const recipientOnline = await isRecipientOnline(recipientId);
    if (!recipientOnline) {
      void sendPushForNotification(notification);
    }

    return notification;
  } catch (error) {
    console.error('[Notification] Failed to create:', error.message);
    return null;
  }
};

const getNotifications = async (userId, { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = {}) => {
  const safePage = Math.max(1, Number(page) || DEFAULT_PAGE);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));
  const skip = (safePage - 1) * safeLimit;
  const filter = { recipient: userId };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('actor', ACTOR_FIELDS)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, read: false }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

  return {
    notifications: notifications.map(formatNotification),
    unreadCount,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
};

const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { read: true } },
    { new: true }
  ).populate('actor', ACTOR_FIELDS);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return formatNotification(notification);
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );

  return { updated: result.modifiedCount };
};

const registerDeviceToken = async (userId, token) => {
  await User.addFcmToken(userId, token);
};

const removeDeviceToken = async (userId, token) => {
  await User.removeFcmToken(userId, token);
};

module.exports = {
  setSocketIo,
  sendNotification,
  sendPushToUser,
  createAndNotify,
  getNotifications,
  markAsRead,
  markAllAsRead,
  registerDeviceToken,
  removeDeviceToken,
};
