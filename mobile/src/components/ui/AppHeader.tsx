import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { BrandTitle } from './BrandTitle';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  showBrandIcon?: boolean;
};

export function AppHeader({ title, leftAction, rightAction, style, showBrandIcon }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>{leftAction}</View>
      {showBrandIcon ? (
        <View style={styles.brandTitle}>
          <BrandTitle />
        </View>
      ) : (
        <Typography variant="screenTitle" style={styles.title} numberOfLines={1}>
          {title}
        </Typography>
      )}
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
  brandTitle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
