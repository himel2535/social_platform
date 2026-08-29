const { getMessaging } = require('../config/firebase');

/**
 * Send push notification via FCM.
 * Stub for Phase 1 — logs and never throws.
 * FCM failures must not break like/comment operations (Phase 4+).
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
      data,
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    return { success: true, response };
  } catch (error) {
    console.error('[Notification] Failed to send:', error.message);
    return { success: false, reason: error.message };
  }
};

module.exports = { sendNotification };
