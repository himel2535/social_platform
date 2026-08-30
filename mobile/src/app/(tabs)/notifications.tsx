import { useCallback, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Screen,
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  useToast,
} from '@/components/ui';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { spacing } from '@/theme/spacing';
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

  return { title: name, body: 'sent you a notification' };
}

export default function NotificationsScreen() {
  const { isPreviewMode } = usePreview();
  const {
    refreshUnreadCount,
    markPreviewRead,
    isPreviewRead,
  } = useNotifications();
  const { showToast } = useToast();
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(!isPreviewMode);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const loadingMoreRef = useRef(false);

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
        await refreshUnreadCount();
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
    [isPreviewMode, refreshUnreadCount],
  );

  useFocusEffect(
    useCallback(() => {
      void loadNotifications(1);
    }, [loadNotifications]),
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isPreviewMode || !pagination?.hasNextPage || loadingMoreRef.current) {
      return;
    }

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;

    if (distanceFromBottom < 120) {
      void loadNotifications(pagination.page + 1, true);
    }
  };

  const handlePreviewPress = (notification: PreviewNotification) => {
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
  };

  const handleAuthenticatedPress = async (notification: AppNotification) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification._id);
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id ? { ...item, read: true } : item,
          ),
        );
        await refreshUnreadCount();
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

    navigateFromNotificationData(
      {
        type,
        postId: postId || '',
        actorUsername: actorUsername || '',
      },
      router,
    );
  };

  return (
    <Screen
      scroll
      contentContainerStyle={styles.content}
      scrollViewProps={{ onScroll: handleScroll, scrollEventThrottle: 400 }}
    >
      <AppHeader title="Notifications" />
      {isPreviewMode ? (
        PREVIEW_NOTIFICATIONS.map((notification) => (
          <NotificationItem
            key={notification.id}
            title={notification.title}
            body={notification.body}
            timestamp={notification.timestamp}
            read={notification.read || isPreviewRead(notification.id)}
            avatarUri={notification.avatar}
            onPress={() => handlePreviewPress(notification)}
          />
        ))
      ) : loading ? (
        <LoadingSpinner style={styles.centered} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadNotifications(1)} />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          message="You'll be notified when someone likes or comments on your posts."
          icon="notifications-outline"
        />
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => {
            const copy = notificationCopy(notification);
            return (
              <NotificationItem
                key={notification._id}
                title={copy.title}
                body={copy.body}
                timestamp={notification.createdAt}
                read={notification.read}
                avatarUri={notification.actor?.avatar}
                onPress={() => handleAuthenticatedPress(notification)}
              />
            );
          })}
          {loadingMore ? <LoadingSpinner style={styles.loadMore} /> : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
  },
  list: {
    marginTop: spacing.sm,
  },
  centered: {
    marginTop: spacing.lg,
  },
  loadMore: {
    marginVertical: spacing.lg,
  },
});
