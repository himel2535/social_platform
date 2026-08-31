import { useEffect, useRef } from 'react';
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

  if ((type === 'like' || type === 'comment') && postId) {
    router.push(`/post/${postId}` as Href);
    return;
  }

  if (type === 'follow' && actorUsername) {
    router.push(`/profile/${actorUsername}` as Href);
  }
}

export function usePushNotifications() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isPreviewMode } = usePreview();
  const { showToast } = useToast();
  const { incrementUnread } = useNotifications();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const pendingRef = useRef<Record<string, string> | null>(null);
  const registeredRef = useRef(false);
  const routerRef = useRef(router);
  const routerReadyRef = useRef(false);

  routerRef.current = router;
  routerReadyRef.current = !!navigationState?.key;

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
      registeredRef.current = false;
      return;
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const register = async () => {
      const last = await notificationService.getLastNotificationData();
      if (last && Object.keys(last).length > 0 && !cancelled) {
        pendingRef.current = last;
      }

      if (!registeredRef.current) {
        const token = await notificationService.getFCMToken();
        if (token && !cancelled) {
          await notificationService.registerDeviceToken(token);
          registeredRef.current = true;
        }
      }

      cleanup = notificationService.setupNotificationHandlers({
        onReceived: (notification) => {
          const body = notification.request.content.body;
          const title = notification.request.content.title;
          showToast(body || title || 'New notification', 'info');
          incrementUnread();
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

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [isAuthenticated, isLoading, isPreviewMode, incrementUnread, showToast]);
}
