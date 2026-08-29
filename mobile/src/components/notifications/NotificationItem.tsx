import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, Typography } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { formatTimeAgo } from '@/utils/format';
import { colors } from '@/theme/colors';

type Props = {
  title: string;
  body: string;
  timestamp: string | Date;
  read?: boolean;
  onPress?: () => void;
};

export function NotificationItem({ title, body, timestamp, read = false, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.container, !read && styles.unread]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Avatar name={title} size={40} />
      <View style={styles.content}>
        <Typography variant="userName">{title}</Typography>
        <Typography variant="postContent" numberOfLines={2}>
          {body}
        </Typography>
        <Typography variant="metadata">{formatTimeAgo(timestamp)}</Typography>
      </View>
      {!read && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  unread: {
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginTop: spacing.sm,
  },
});
