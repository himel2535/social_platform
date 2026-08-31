import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui';
import { spacing } from '@/theme/spacing';

type Props = {
  label: string;
};

export function DateDivider({ label }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        <Typography variant="metadata" style={styles.label}>
          {label}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
  },
});
