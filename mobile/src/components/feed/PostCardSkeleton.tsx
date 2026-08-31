import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '@/components/ui';
import { SkeletonBlock, usePulseAnimation } from '@/components/ui/skeletonPulse';
import { spacing } from '@/theme/spacing';

export function PostCardSkeleton() {
  const pulse = usePulseAnimation();

  return (
    <GlassCard variant="feed" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.author}>
          <SkeletonBlock pulse={pulse} style={styles.avatar} />
          <View style={styles.authorInfo}>
            <SkeletonBlock pulse={pulse} style={styles.nameLine} />
            <SkeletonBlock pulse={pulse} style={styles.metaLine} />
          </View>
        </View>
        <SkeletonBlock pulse={pulse} style={styles.menuIcon} />
      </View>

      <View style={styles.body}>
        <SkeletonBlock pulse={pulse} style={styles.bodyLineFull} />
        <SkeletonBlock pulse={pulse} style={styles.bodyLineMedium} />
        <SkeletonBlock pulse={pulse} style={styles.bodyLineShort} />
      </View>

      <View style={styles.actions}>
        <SkeletonBlock pulse={pulse} style={styles.actionPill} />
        <SkeletonBlock pulse={pulse} style={styles.actionPill} />
        <SkeletonBlock pulse={pulse} style={styles.actionPillShare} />
      </View>
    </GlassCard>
  );
}

type FeedSkeletonListProps = {
  count?: number;
};

export function FeedSkeletonList({ count = 5 }: FeedSkeletonListProps) {
  return (
    <View accessibilityLabel="Loading feed">
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  authorInfo: {
    flex: 1,
    gap: 6,
  },
  nameLine: {
    height: 14,
    width: '55%',
  },
  metaLine: {
    height: 11,
    width: '45%',
  },
  menuIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  body: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bodyLineFull: {
    height: 13,
    width: '100%',
  },
  bodyLineMedium: {
    height: 13,
    width: '95%',
  },
  bodyLineShort: {
    height: 13,
    width: '60%',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionPill: {
    height: 20,
    width: 56,
    borderRadius: 10,
  },
  actionPillShare: {
    height: 20,
    width: 20,
    borderRadius: 10,
    marginLeft: 'auto',
  },
});
