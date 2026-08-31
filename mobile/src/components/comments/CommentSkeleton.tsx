import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBlock, usePulseAnimation } from '@/components/ui/skeletonPulse';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export function CommentSkeleton() {
  const pulse = usePulseAnimation();

  return (
    <View style={styles.container}>
      <SkeletonBlock pulse={pulse} style={styles.avatar} />
      <View style={styles.content}>
        <View style={styles.header}>
          <SkeletonBlock pulse={pulse} style={styles.nameLine} />
          <SkeletonBlock pulse={pulse} style={styles.timeLine} />
        </View>
        <SkeletonBlock pulse={pulse} style={styles.textLineFull} />
        <SkeletonBlock pulse={pulse} style={styles.textLineShort} />
      </View>
    </View>
  );
}

type CommentSkeletonListProps = {
  count?: number;
};

export function CommentSkeletonList({ count = 4 }: CommentSkeletonListProps) {
  return (
    <View accessibilityLabel="Loading comments">
      {Array.from({ length: count }).map((_, index) => (
        <CommentSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  nameLine: {
    height: 12,
    width: '40%',
  },
  timeLine: {
    height: 10,
    width: '20%',
  },
  textLineFull: {
    height: 12,
    width: '100%',
  },
  textLineShort: {
    height: 12,
    width: '70%',
  },
});
