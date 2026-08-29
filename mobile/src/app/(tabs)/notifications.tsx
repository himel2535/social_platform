import { Screen, AppHeader, EmptyState } from '@/components/ui';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { StyleSheet } from 'react-native';
import { spacing } from '@/theme/spacing';
import { usePreview, PREVIEW_NOTIFICATIONS } from '@/preview';

export default function NotificationsScreen() {
  const { isPreviewMode } = usePreview();

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <AppHeader title="Notifications" />
      {isPreviewMode ? (
        PREVIEW_NOTIFICATIONS.map((notification) => (
          <NotificationItem
            key={notification.id}
            title={notification.title}
            body={notification.body}
            timestamp={notification.timestamp}
            read={notification.read}
          />
        ))
      ) : (
        <EmptyState
          title="No notifications yet"
          message="You'll be notified when someone likes or comments on your posts."
          icon="notifications-outline"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
  },
});
