import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '@/components/ui';
import { SkeletonBlock, usePulseAnimation } from '@/components/ui/skeletonPulse';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export function PostCardSkeleton() {
  const pulse = usePulseAnimation();

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.author}>
          <SkeletonBlock pulse={pulse} style={styles.avatar} />
          <View style={styles.authorInfo}>
            <SkeletonBlock pulse={pulse} style={styles.nameLine} />
            <SkeletonBlock pulse={pulse} style={styles.usernameLine} />
          </View>
        </View>
        <SkeletonBlock pulse={pulse} style={styles.menuIcon} />
      </View>

      <View style={styles.body}>
        <SkeletonBlock pulse={pulse} style={styles.bodyLineFull} />
        <SkeletonBlock pulse={pulse} style={styles.bodyLineMedium} />
        <SkeletonBlock pulse={pulse} style={styles.bodyLineShort} />
      </View>

      <SkeletonBlock pulse={pulse} style={styles.timeLine} />

      <View style={styles.actions}>
        <SkeletonBlock pulse={pulse} style={styles.actionPill} />
        <SkeletonBlock pulse={pulse} style={styles.actionPill} />
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
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
  },
  authorInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  nameLine: {
    height: 14,
    width: '55%',
  },
  usernameLine: {
    height: 12,
    width: '35%',
  },
  menuIcon: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
  },
  body: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bodyLineFull: {
    height: 12,
    width: '100%',
  },
  bodyLineMedium: {
    height: 12,
    width: '95%',
  },
  bodyLineShort: {
    height: 12,
    width: '60%',
  },
  timeLine: {
    height: 10,
    width: '25%',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  actionPill: {
    height: 20,
    width: 56,
    borderRadius: radius.full,
  },
});
