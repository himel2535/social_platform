import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';
import { Pagination } from './post.service';
import { getFcmToken, removeFcmToken, saveFcmToken } from '@/utils/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationActor = {
  _id: string;
  name: string;
  username: string;
  avatar?: string | null;
};

export type NotificationType = 'like' | 'comment' | 'follow';

export type AppNotification = {
  _id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actor: NotificationActor | null;
  post: { _id: string } | null;
  comment: { _id: string } | null;
};

export type NotificationsResponse = {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: Pagination;
};

type BackendSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type NotificationHandlers = {
  onReceived?: (notification: Notifications.Notification) => void;
  onTap?: (data: Record<string, string>) => void;
};

const toDataRecord = (data: unknown): Record<string, string> => {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value != null) {
      result[key] = String(value);
    }
  }
  return result;
};

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('[Notifications] Push notifications require a physical device or dev build');
      return false;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      return true;
    }

    if (existing !== 'undetermined') {
      return false;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async getFCMToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const tokenData = await Notifications.getDevicePushTokenAsync();
      return tokenData.data;
    } catch (error) {
      console.warn('[Notifications] Failed to get FCM token:', error);
      console.warn('[Notifications] Real FCM requires EAS dev build + google-services.json');
      return null;
    }
  },

  async getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
    const response = await api.get<BackendSuccess<NotificationsResponse>>('/notifications', {
      params: { page, limit },
    });
    return response.data.data;
  },

  async markAsRead(id: string): Promise<AppNotification> {
    const response = await api.patch<BackendSuccess<{ notification: AppNotification }>>(
      `/notifications/${id}/read`,
    );
    return response.data.data.notification;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async registerDeviceToken(token: string): Promise<void> {
    try {
      await api.post('/notifications/device-token', { token });
      await saveFcmToken(token);
    } catch (error) {
      console.warn('[Notifications] Failed to register token with backend:', error);
    }
  },

  async removeDeviceToken(token?: string): Promise<void> {
    const stored = token ?? (await getFcmToken());
    if (!stored) {
      return;
    }

    try {
      await api.delete('/notifications/device-token', { data: { token: stored } });
    } catch (error) {
      console.warn('[Notifications] Failed to remove token from backend:', error);
    } finally {
      await removeFcmToken();
    }
  },

  async getLastNotificationData(): Promise<Record<string, string> | null> {
    try {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (!response) {
        return null;
      }
      return toDataRecord(response.notification.request.content.data);
    } catch {
      return null;
    }
  },

  setupNotificationHandlers(handlers: NotificationHandlers = {}): () => void {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      handlers.onReceived?.(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handlers.onTap?.(toDataRecord(response.notification.request.content.data));
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },
};
