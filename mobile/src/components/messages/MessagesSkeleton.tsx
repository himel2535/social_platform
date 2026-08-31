import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBlock, usePulseAnimation } from '@/components/ui/skeletonPulse';
import { spacing } from '@/theme/spacing';

export function InboxSkeleton() {
  const pulse = usePulseAnimation();

  return (
    <View accessibilityLabel="Loading conversations">
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.row}>
          <SkeletonBlock pulse={pulse} style={styles.avatar} />
          <View style={styles.content}>
            <SkeletonBlock pulse={pulse} style={styles.nameLine} />
            <SkeletonBlock pulse={pulse} style={styles.previewLine} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ThreadSkeleton() {
  const pulse = usePulseAnimation();

  return (
    <View style={styles.thread} accessibilityLabel="Loading messages">
      {Array.from({ length: 8 }).map((_, index) => (
        <View
          key={index}
          style={[styles.bubbleRow, index % 2 === 0 ? styles.bubbleLeft : styles.bubbleRight]}
        >
          <SkeletonBlock pulse={pulse} style={styles.bubble} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  nameLine: {
    height: 14,
    width: '45%',
  },
  previewLine: {
    height: 12,
    width: '70%',
  },
  thread: {
    flex: 1,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  bubbleRow: {
    paddingHorizontal: spacing.lg,
  },
  bubbleLeft: {
    alignItems: 'flex-start',
  },
  bubbleRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    height: 36,
    width: '55%',
    borderRadius: 16,
  },
});
