import { AppNotification } from '@/services/notification.service';

type NewNotificationListener = (payload: {
  notification: AppNotification;
  unreadCount: number;
}) => void;

const listeners = new Set<NewNotificationListener>();

export function subscribeNewNotification(callback: NewNotificationListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function notifyNewNotification(payload: {
  notification: AppNotification;
  unreadCount: number;
}): void {
  listeners.forEach((callback) => callback(payload));
}
