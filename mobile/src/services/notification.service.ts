import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('[Notifications] Push notifications require a physical device or dev build');
      return false;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
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

  async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await api.post('/users/fcm-token', { token });
    } catch (error) {
      console.warn('[Notifications] Failed to register token with backend:', error);
    }
  },

  setupNotificationHandlers(onNotificationTap?: (data: Record<string, string>) => void): () => void {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Notifications] Received in foreground:', notification.request.content.title);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      onNotificationTap?.(data);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },
};
