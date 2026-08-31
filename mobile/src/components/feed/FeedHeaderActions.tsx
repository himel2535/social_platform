import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { IconButton, Badge } from '@/components/ui';
import { AccountMenu } from '@/components/navigation/AccountMenu';
import { useNotifications } from '@/context/NotificationContext';
import { spacing } from '@/theme/spacing';

type Props = {
  showMenu: boolean;
};

export function FeedHeaderActions({ showMenu }: Props) {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  if (!showMenu) {
    return null;
  }

  return (
    <View style={styles.headerActions}>
      <View>
        <IconButton
          icon="notifications-outline"
          accessibilityLabel="Notifications"
          onPress={() => router.push('/notifications')}
        />
        {unreadCount > 0 ? <Badge count={unreadCount} style={styles.badge} /> : null}
      </View>
      <AccountMenu size={32} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
