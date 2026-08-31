import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ListRenderItem, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import {
  Screen,
  AppHeader,
  EmptyState,
  ErrorState,
  CenteredLoading,
  useToast,
} from '@/components/ui';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/glass';
import { usePreview, PREVIEW_NOTIFICATIONS, PreviewNotification } from '@/preview';
import { useNotifications } from '@/context/NotificationContext';
import {
  AppNotification,
  notificationService,
} from '@/services/notification.service';
import { Pagination } from '@/services/post.service';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { navigateFromNotificationData } from '@/hooks/usePushNotifications';

const PAGE_LIMIT = 20;
const TAB_REFRESH_DEBOUNCE_MS = 10_000;

function notificationCopy(notification: AppNotification): { title: string; body: string } {
  const name = notification.actor?.name || 'Someone';

  if (notification.type === 'like') {
    return { title: name, body: `${name} liked your post` };
  }
  if (notification.type === 'comment') {
    return { title: name, body: `${name} commented on your post` };
  }
  if (notification.type === 'follow') {
    return { title: name, body: `${name} started following you` };
  }
  if (notification.type === 'message') {
    return { title: name, body: `${name} sent you a message` };
  }

  return { title: name, body: 'sent you a notification' };
}

export default function NotificationsScreen() {
  const { isPreviewMode } = usePreview();
  const {
    syncUnreadCount,
    decrementUnread,
    markPreviewRead,
    isPreviewRead,
  } = useNotifications();
  const { showToast } = useToast();
  const router = useRouter();
  const segments = useSegments();
  const activeTab = segments[1];

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(!isPreviewMode);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const loadingMoreRef = useRef(false);
  const paginationRef = useRef<Pagination | null>(null);
  const lastFetchRef = useRef(0);
  const previousTabRef = useRef<string | undefined>(undefined);

  paginationRef.current = pagination;

  const loadNotifications = useCallback(
    async (page = 1, append = false) => {
      if (isPreviewMode) {
        setLoading(false);
        return;
      }

      if (append) {
        if (loadingMoreRef.current) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError('');
      }

      try {
        const result = await notificationService.getNotifications(page, PAGE_LIMIT);
        setNotifications((current) =>
          append ? [...current, ...result.notifications] : result.notifications,
        );
        setPagination(result.pagination);
        syncUnreadCount(result.unreadCount);
        lastFetchRef.current = Date.now();
      } catch (err) {
        if (!append) {
          setNotifications([]);
          setError(normalizeApiError(err as ApiError, 'general'));
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [isPreviewMode, syncUnreadCount],
  );

  useEffect(() => {
    void loadNotifications(1);
  }, [loadNotifications]);

  useEffect(() => {
    if (isPreviewMode || activeTab !== 'notifications') {
      previousTabRef.current = activeTab;
      return;
    }

    const previousTab = previousTabRef.current;
    previousTabRef.current = activeTab;

    if (
      previousTab !== undefined &&
      previousTab !== 'notifications' &&
      Date.now() - lastFetchRef.current > TAB_REFRESH_DEBOUNCE_MS
    ) {
      void loadNotifications(1);
    }
  }, [activeTab, isPreviewMode, loadNotifications]);

  const handleLoadMore = useCallback(() => {
    const currentPagination = paginationRef.current;
    if (!currentPagination?.hasNextPage || loadingMoreRef.current) {
      return;
    }
    void loadNotifications(currentPagination.page + 1, true);
  }, [loadNotifications]);

  const handlePreviewPress = useCallback(
    (notification: PreviewNotification) => {
      markPreviewRead(notification.id);

      if (notification.type === 'like' || notification.type === 'comment') {
        if (notification.postId) {
          router.push(`/post/${notification.postId}`);
        }
        return;
      }

      if (notification.type === 'follow' && notification.username) {
        router.push(`/profile/${notification.username}`);
      }
    },
    [markPreviewRead, router],
  );

  const handleAuthenticatedPress = useCallback(
    async (notification: AppNotification) => {
      if (!notification.read) {
        try {
          await notificationService.markAsRead(notification._id);
          setNotifications((current) =>
            current.map((item) =>
              item._id === notification._id ? { ...item, read: true } : item,
            ),
          );
          decrementUnread();
        } catch {
          // Navigation still proceeds if mark-read fails
        }
      }

      const type = notification.type;
      const postId = notification.post?._id;
      const actorUsername = notification.actor?.username;

      if ((type === 'like' || type === 'comment') && !postId) {
        showToast('This post is no longer available', 'error');
        return;
      }

      if (type === 'follow' && !actorUsername) {
        showToast('This user is no longer available', 'error');
        return;
      }

      if (type === 'message' && !notification.actor?._id) {
        showToast('This conversation is no longer available', 'error');
        return;
      }

      navigateFromNotificationData(
        {
          type,
          postId: postId || '',
          actorUsername: actorUsername || '',
          senderId: notification.actor?._id || '',
          actorName: notification.actor?.name || '',
          actorAvatar: notification.actor?.avatar || '',
        },
        router,
      );
    },
    [decrementUnread, router, showToast],
  );

  const renderItem: ListRenderItem<AppNotification> = useCallback(
    ({ item }) => {
      const copy = notificationCopy(item);
      return (
        <NotificationItem
          title={copy.title}
          body={copy.body}
          timestamp={item.createdAt}
          read={item.read}
          avatarUri={item.actor?.avatar}
          onPress={() => handleAuthenticatedPress(item)}
        />
      );
    },
    [handleAuthenticatedPress],
  );

  const listHeader = useMemo(() => <AppHeader title="Notifications" />, []);

  const listEmpty = useMemo(() => {
    if (loading) {
      return <CenteredLoading />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={() => loadNotifications(1)} />;
    }

    if (notifications.length === 0) {
      return (
        <EmptyState
          title="No notifications yet"
          message="You'll be notified when someone likes or comments on your posts."
          icon="notifications-outline"
        />
      );
    }

    return null;
  }, [loading, error, notifications.length, loadNotifications]);

  const listFooter = useMemo(
    () => (loadingMore ? <CenteredLoading style={styles.loadMore} /> : null),
    [loadingMore],
  );

  if (isPreviewMode) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        {listHeader}
        {PREVIEW_NOTIFICATIONS.map((notification) => (
          <NotificationItem
            key={notification.id}
            title={notification.title}
            body={notification.body}
            timestamp={notification.timestamp}
            read={notification.read || isPreviewRead(notification.id)}
            avatarUri={notification.avatar}
            onPress={() => handlePreviewPress(notification)}
          />
        ))}
      </Screen>
    );
  }

  return (
    <Screen contentPaddingBottom={layout.tabBarHeight + spacing.lg}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        style={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  loadMore: {
    minHeight: 120,
    marginVertical: spacing.lg,
  },
});
