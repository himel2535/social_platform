import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  style?: ViewStyle;
};

export function Divider({ style }: Props) {
  return <View style={[styles.divider, style]} accessibilityRole="none" />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.textSecondary,
    opacity: 0.2,
    marginVertical: spacing.md,
  },
});
