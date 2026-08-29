import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
};

export function AppHeader({ title, leftAction, rightAction, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>{leftAction}</View>
      <Typography variant="screenTitle" style={styles.title} numberOfLines={1}>
        {title}
      </Typography>
      <View style={[styles.side, styles.right]}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  side: {
    width: 80,
    alignItems: 'flex-start',
  },
  right: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
  },
});
