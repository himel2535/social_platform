import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { type Href, useRootNavigationState, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';
import { useToast } from '@/components/ui';
import { useNotifications } from '@/context/NotificationContext';
import { notificationService } from '@/services/notification.service';

type AppRouter = ReturnType<typeof useRouter>;

export function navigateFromNotificationData(
  data: Record<string, string>,
  router: AppRouter,
) {
  const type = data.type;
  const postId = data.postId;
  const actorUsername = data.actorUsername || data.username;
  const senderId = data.senderId || data.actorId;

  if ((type === 'like' || type === 'comment') && postId) {
    router.push(`/post/${postId}` as Href);
    return;
  }

  if (type === 'follow' && actorUsername) {
    router.push(`/profile/${actorUsername}` as Href);
    return;
  }

  if (type === 'message' && senderId) {
    router.push({
      pathname: '/messages/[userId]',
      params: {
        userId: senderId,
        name: data.actorName || '',
        username: actorUsername || '',
        avatar: data.actorAvatar || '',
      },
    });
  }
}

export function usePushNotifications() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isPreviewMode } = usePreview();
  const { showToast } = useToast();
  const { refreshUnreadCount } = useNotifications();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const pendingRef = useRef<Record<string, string> | null>(null);
  const lastRegisteredTokenRef = useRef<string | null>(null);
  const routerRef = useRef(router);
  const routerReadyRef = useRef(false);

  routerRef.current = router;
  routerReadyRef.current = !!navigationState?.key;

  const registerDeviceToken = async () => {
    const token = await notificationService.getFCMToken();
    if (!token) {
      return;
    }

    if (lastRegisteredTokenRef.current === token) {
      return;
    }

    await notificationService.registerDeviceToken(token);
    lastRegisteredTokenRef.current = token;
  };

  useEffect(() => {
    if (!routerReadyRef.current || isLoading || !isAuthenticated || isPreviewMode) {
      return;
    }

    if (pendingRef.current) {
      const data = pendingRef.current;
      pendingRef.current = null;
      navigateFromNotificationData(data, routerRef.current);
    }
  }, [navigationState?.key, isLoading, isAuthenticated, isPreviewMode]);

  useEffect(() => {
    if (isLoading || isPreviewMode || !isAuthenticated) {
      lastRegisteredTokenRef.current = null;
      return;
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const register = async () => {
      const last = await notificationService.getLastNotificationData();
      if (last && Object.keys(last).length > 0 && !cancelled) {
        pendingRef.current = last;
      }

      await registerDeviceToken();

      cleanup = notificationService.setupNotificationHandlers({
        onReceived: (notification) => {
          const body = notification.request.content.body;
          const title = notification.request.content.title;
          showToast(body || title || 'New notification', 'info');
          void refreshUnreadCount();
        },
        onTap: (data) => {
          if (routerReadyRef.current && isAuthenticated) {
            navigateFromNotificationData(data, routerRef.current);
          } else {
            pendingRef.current = data;
          }
        },
      });
    };

    void register();

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isAuthenticated && !isPreviewMode) {
        void registerDeviceToken();
        void refreshUnreadCount();
      }
    });

    return () => {
      cancelled = true;
      cleanup?.();
      appStateSubscription.remove();
    };
  }, [isAuthenticated, isLoading, isPreviewMode, refreshUnreadCount, showToast]);
}
