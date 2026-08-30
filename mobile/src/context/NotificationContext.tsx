import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { usePreview, PREVIEW_NOTIFICATIONS } from '@/preview';
import { notificationService } from '@/services/notification.service';

type NotificationContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  incrementUnread: () => void;
  markPreviewRead: (id: string) => void;
  markAllPreviewRead: () => void;
  isPreviewRead: (id: string) => boolean;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isPreviewMode } = usePreview();
  const [unreadCount, setUnreadCount] = useState(0);
  const [previewReadIds, setPreviewReadIds] = useState<Set<string>>(new Set());

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
    } catch {
      // Badge refresh is best-effort
    }
  }, [isAuthenticated, isPreviewMode, previewReadIds]);

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
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isAuthenticated && !isPreviewMode) {
        void refreshUnreadCount();
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, isPreviewMode, refreshUnreadCount]);

  const incrementUnread = useCallback(() => {
    setUnreadCount((current) => current + 1);
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

  return (
    <NotificationContext.Provider
      value={{
        unreadCount: isPreviewMode ? previewUnreadCount : unreadCount,
        refreshUnreadCount,
        incrementUnread,
        markPreviewRead,
        markAllPreviewRead,
        isPreviewRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
