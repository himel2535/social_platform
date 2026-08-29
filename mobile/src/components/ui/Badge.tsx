import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type Props = {
  count?: number;
  dot?: boolean;
  style?: ViewStyle;
};

export function Badge({ count, dot = false, style }: Props) {
  if (dot) {
    return <View style={[styles.dot, style]} accessibilityLabel="New notification" />;
  }

  if (!count || count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);

  return (
    <View style={[styles.badge, style]} accessibilityLabel={`${label} notifications`}>
      <Typography variant="metadata" color="textPrimary" style={styles.text}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
});
