import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { PrimaryButton } from './PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function EmptyState({
  title,
  message,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]} accessibilityRole="text">
      <Ionicons name={icon} size={48} color={colors.textSecondary} />
      <Typography variant="emptyTitle" style={styles.title}>
        {title}
      </Typography>
      {message && (
        <Typography variant="emptyMessage" style={styles.message}>
          {message}
        </Typography>
      )}
      {actionLabel && onAction && (
        <PrimaryButton title={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
