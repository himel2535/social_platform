import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type Props = {
  lines?: number;
  style?: ViewStyle;
};

export function LoadingSkeleton({ lines = 3, style }: Props) {
  return (
    <View style={[styles.container, style]} accessibilityLabel="Loading content">
      <View style={styles.avatar} />
      <View style={styles.content}>
        <View style={[styles.line, { width: '60%' }]} />
        {Array.from({ length: lines }).map((_, i) => (
          <View key={i} style={[styles.line, { width: i === lines - 1 ? '40%' : '100%' }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  line: {
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.5,
  },
});
