import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { usePreview, PREVIEW_NOTIFICATIONS } from '@/preview';
import { useSocket } from '@/context/SocketContext';
import { AppNotification, notificationService } from '@/services/notification.service';
import { notifyNewNotification } from '@/utils/notificationEvents';

const BADGE_REFRESH_DEBOUNCE_MS = 30_000;

type NewNotificationPayload = {
  notification: AppNotification;
  unreadCount: number;
};

type NotificationContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  syncUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  incrementUnread: () => void;
  markPreviewRead: (id: string) => void;
  markAllPreviewRead: () => void;
  isPreviewRead: (id: string) => boolean;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isPreviewMode } = usePreview();
  const { socket, subscribeReconnect } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [previewReadIds, setPreviewReadIds] = useState<Set<string>>(new Set());
  const lastBadgeFetchRef = useRef(0);

  const previewUnreadCount = useMemo(
    () =>
      PREVIEW_NOTIFICATIONS.filter((item) => !item.read && !previewReadIds.has(item.id)).length,
    [previewReadIds],
  );

  const refreshUnreadCount = useCallback(async () => {
    if (isPreviewMode) {
      setUnreadCount(
        PREVIEW_NOTIFICATIONS.filter((item) => !item.read && !previewReadIds.has(item.id)).length,
      );
      return;
    }

    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const result = await notificationService.getNotifications(1, 1);
      setUnreadCount(result.unreadCount);
      lastBadgeFetchRef.current = Date.now();
    } catch {
      // Badge refresh is best-effort
    }
  }, [isAuthenticated, isPreviewMode, previewReadIds]);

  const syncUnreadCount = useCallback((count: number) => {
    setUnreadCount(count);
    lastBadgeFetchRef.current = Date.now();
  }, []);

  const handleLiveNotification = useCallback((payload: NewNotificationPayload) => {
    syncUnreadCount(payload.unreadCount);
    notifyNewNotification(payload);
  }, [syncUnreadCount]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isPreviewMode) {
      setUnreadCount(previewUnreadCount);
      return;
    }

    void refreshUnreadCount();
  }, [isLoading, isAuthenticated, isPreviewMode, previewUnreadCount, refreshUnreadCount]);

  useEffect(() => {
    return subscribeReconnect(() => {
      void refreshUnreadCount();
    });
  }, [refreshUnreadCount, subscribeReconnect]);

  useEffect(() => {
    if (!socket || !isAuthenticated || isPreviewMode) {
      return;
    }

    const handleNewNotification = (payload: NewNotificationPayload) => {
      if (!payload?.notification) {
        return;
      }

      handleLiveNotification(payload);
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [handleLiveNotification, isAuthenticated, isPreviewMode, socket]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !isAuthenticated || isPreviewMode) {
        return;
      }

      if (Date.now() - lastBadgeFetchRef.current < BADGE_REFRESH_DEBOUNCE_MS) {
        return;
      }

      void refreshUnreadCount();
    });

    return () => subscription.remove();
  }, [isAuthenticated, isPreviewMode, refreshUnreadCount]);

  const incrementUnread = useCallback(() => {
    setUnreadCount((current) => current + 1);
  }, []);

  const decrementUnread = useCallback(() => {
    setUnreadCount((current) => Math.max(0, current - 1));
  }, []);

  const markPreviewRead = useCallback((id: string) => {
    setPreviewReadIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const markAllPreviewRead = useCallback(() => {
    setPreviewReadIds(new Set(PREVIEW_NOTIFICATIONS.map((item) => item.id)));
  }, []);

  const isPreviewRead = useCallback(
    (id: string) => previewReadIds.has(id),
    [previewReadIds],
  );

  const value = useMemo(
    () => ({
      unreadCount: isPreviewMode ? previewUnreadCount : unreadCount,
      refreshUnreadCount,
      syncUnreadCount,
      decrementUnread,
      incrementUnread,
      markPreviewRead,
      markAllPreviewRead,
      isPreviewRead,
    }),
    [
      isPreviewMode,
      previewUnreadCount,
      unreadCount,
      refreshUnreadCount,
      syncUnreadCount,
      decrementUnread,
      incrementUnread,
      markPreviewRead,
      markAllPreviewRead,
      isPreviewRead,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
